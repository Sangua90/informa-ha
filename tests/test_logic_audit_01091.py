import ast
import importlib.util
import json
import math
import urllib.request
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

ROOT=Path(__file__).parents[1]/'informa'


class LogicAuditTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();folder=Path(self.temp.name)
        self.core=types.ModuleType('audit_core_test');self.core.__file__=str(ROOT/'app.py');sys.modules[self.core.__name__]=self.core
        source=(ROOT/'app.py').read_text(encoding='utf-8').replace('DB = Path("/data/informa.db")',f'DB = Path({str(folder/"db.sqlite")!r})').replace('PHOTO_DIR = Path("/data/meal_photos")',f'PHOTO_DIR = Path({str(folder/"photos")!r})')
        exec(compile(source,'app.py','exec'),self.core.__dict__)
        con=self.core.db();con.executescript('''CREATE TABLE workout_finish(id INTEGER PRIMARY KEY,ts TEXT,workout_id INTEGER,reason TEXT,duration_min REAL,useful_work TEXT);
        CREATE TABLE exercise_status(id INTEGER PRIMARY KEY,ts TEXT,workout_id INTEGER,exercise TEXT,priority TEXT,status TEXT,notes TEXT);
        CREATE TABLE treadmill_sessions(id INTEGER PRIMARY KEY,ts TEXT,duration_min REAL,avg_speed_kmh REAL,max_speed_kmh REAL,avg_incline_pct REAL,max_incline_pct REAL,fatigue TEXT,phases_json TEXT);''');con.commit();con.close()
        for path,endpoint in [('/api/coach/finish','coach_finish'),('/api/treadmill-0970','treadmill_save_0970')]:
            self.core.app.add_url_rule(path,endpoint,lambda:None,methods=['POST'])
        # Real legacy partial-update handler, rather than a test copy of its SQL.
        tree=ast.parse((ROOT/'nutrition_ai_0102.py').read_text(encoding='utf-8'))
        fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='nutrition_update_0102');fn.decorator_list=[]
        ns={'root':self.core};exec(compile(ast.Module(body=[fn],type_ignores=[]),'nutrition_ai_0102.py','exec'),ns)
        self.core.app.add_url_rule('/api/nutrition/entry/<int:entry_id>/update',view_func=ns['nutrition_update_0102'],methods=['POST'])
        spec=importlib.util.spec_from_file_location('audit_test',ROOT/'logic_audit_01091.py');self.module=importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules,{'app':self.core,'ai_training_01089':types.SimpleNamespace(app=self.core.app)}):spec.loader.exec_module(self.module)
        self.client=self.core.app.test_client()

    def tearDown(self):
        sys.modules.pop(self.core.__name__,None);self.temp.cleanup()

    def count(self,table):
        con=self.core.db();count=con.execute('SELECT COUNT(*) FROM '+table).fetchone()[0];con.close();return count

    def set(self,**extra):
        return self.client.post('/api/set',json={'exercise':'Chest','set_no':1,'reps':10,'weight':5,**extra})

    def test_idempotent_sets_create_one_workout_and_one_performed_set(self):
        bodies=[self.set(request_id='session:chest:1').get_json() for _ in range(2)]
        self.assertEqual(bodies[0],bodies[1]);self.assertEqual(self.count('sets'),1);self.assertEqual(self.count('workouts'),1)

    def test_numeric_corruption_and_missing_workouts_never_write(self):
        for key,bad in [('reps',-1),('reps',True),('reps',float('inf')),('reps',10.5),('weight',float('nan')),('weight',-3),('set_no',0)]:
            with self.subTest(key=key,bad=bad):self.assertEqual(self.set(**{key:bad}).status_code,400)
        self.assertEqual(self.set(workout_id=999).status_code,404)
        self.assertEqual(self.client.post('/api/set',json=[]).status_code,400);self.assertEqual(self.count('sets'),0);self.assertEqual(self.count('workouts'),0)

    def test_food_validation_and_partial_updates_preserve_omitted_fields(self):
        for bad in (-2,float('inf'),float('nan'),True):
            self.assertEqual(self.client.post('/api/nutrition/entry',json={'name':'Pasto','calories':bad}).status_code,400)
        entry=self.client.post('/api/nutrition/entry',json={'name':'Pasto','calories':400,'protein_g':30}).get_json()['id']
        self.assertEqual(self.client.post(f'/api/nutrition/entry/{entry}/update',json={'name':'Corretto'}).status_code,200)
        con=self.core.db();row=con.execute('SELECT name,calories,protein_g FROM nutrition_entries').fetchone();con.close();self.assertEqual(tuple(row),('Corretto',400,30))

    def test_invalid_water_measurements_and_cardio_do_not_corrupt_history(self):
        measurements_before=self.count('body_measurements')
        for path,body in [('/api/nutrition/water',{'ml':'bad'}),('/api/nutrition/water',{'ml':float('inf')}),('/api/measurement',{'weight_kg':float('inf')}),('/api/measurement',{'weight_kg':-1}),('/api/cardio',{'duration_min':float('nan')})]:
            self.assertEqual(self.client.post(path,json=body).status_code,400)
        self.assertEqual(self.count('nutrition_entries'),0);self.assertEqual(self.count('body_measurements'),measurements_before);self.assertEqual(self.count('cardio'),0)

    def test_meal_confirmation_retry_cannot_duplicate_the_log(self):
        for _ in range(2):
            self.assertEqual(self.client.post('/api/nutrition/entry',json={'request_id':'meal:one','name':'Pasto','calories':400}).status_code,200)
        self.assertEqual(self.count('nutrition_entries'),1)

    def test_cardio_and_archives_cannot_change_a_closed_workout(self):
        wid=self.set().get_json()['workout_id'];self.client.post('/api/coach/finish',json={'workout_id':wid,'duration_min':10})
        self.assertEqual(self.client.post('/api/cardio',json={'workout_id':wid,'duration_min':5}).status_code,409)

    def test_finish_is_idempotent_persists_duration_effort_and_partial_work(self):
        wid=self.set().get_json()['workout_id'];body={'workout_id':wid,'duration_min':24,'effort':4,'reason':'Tempo finito'}
        for _ in range(2):self.assertEqual(self.client.post('/api/coach/finish',json=body).status_code,200)
        self.assertEqual(self.count('workout_finish'),1)
        con=self.core.db();self.assertEqual(con.execute('SELECT duration_min FROM workouts').fetchone()[0],24);self.assertEqual(con.execute('SELECT effort FROM workout_finish').fetchone()[0],4);self.assertEqual(con.execute('SELECT status FROM exercise_status').fetchone()[0],'Parziale');con.close()
        self.assertEqual(self.set(workout_id=wid,set_no=2).status_code,409)

    def test_empty_finish_cannot_fabricate_a_completed_workout(self):
        self.assertEqual(self.client.post('/api/coach/finish',json={'duration_min':20}).status_code,400);self.assertEqual(self.count('workout_finish'),0)

    def test_treadmill_history_cardio_and_status_are_atomic_and_retry_safe(self):
        body={'request_id':'session:treadmill','duration_min':20,'save_cardio':True,'fatigue':'Giusta','phases':[]}
        con=self.core.db();con.execute("CREATE TRIGGER fail_cardio BEFORE INSERT ON cardio BEGIN SELECT RAISE(ABORT,'test failure'); END");con.commit();con.close()
        with patch.object(self.core.app.logger,'error'):
            self.assertEqual(self.client.post('/api/treadmill-0970',json=body).status_code,500)
        for table in ('workouts','treadmill_sessions','cardio','exercise_status'):self.assertEqual(self.count(table),0)
        con=self.core.db();con.execute('DROP TRIGGER fail_cardio');con.commit();con.close()
        for _ in range(2):self.assertEqual(self.client.post('/api/treadmill-0970',json=body).status_code,200)
        for table in ('workouts','treadmill_sessions','cardio','exercise_status'):self.assertEqual(self.count(table),1)

    def test_migrations_preserve_existing_records_and_remain_repeatable(self):
        self.set();self.module.init_audit_db();self.module.init_audit_db();self.assertEqual(self.count('sets'),1)

    def function(self,file,name,namespace):
        tree=ast.parse((ROOT/file).read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name);fn.decorator_list=[]
        exec(compile(ast.Module(body=[fn],type_ignores=[]),file,'exec'),namespace);return namespace[name]

    def test_guide_aliases_preserve_uploads_and_prefer_the_canonical_photo(self):
        directory=Path(self.temp.name)/'guides';directory.mkdir()
        lookup=self.function('guide_patch.py','_user_guide_path',{'USER_GUIDE_DIR':directory})
        for canonical,legacy in [('mobility_back_lats','mobility_back'),('stretch_trunk_core','stretch_trunk')]:
            (directory/(legacy+'.png')).write_bytes(b'legacy');self.assertEqual(lookup(canonical).name,legacy+'.png')
            (directory/(canonical+'.png')).write_bytes(b'canonical');self.assertEqual(lookup(legacy).name,canonical+'.png');self.assertEqual(lookup(canonical).name,canonical+'.png')

    def test_treadmill_protocol_has_no_zero_length_phases_and_matches_requested_time(self):
        build=self.function('treadmill_progression_0970.py','build_plan',{})
        for minutes in range(5,61):
            phases,_=build(minutes);self.assertEqual(sum(p['minutes'] for p in phases),minutes);self.assertTrue(all(p['minutes']>0 for p in phases))

    def test_treadmill_query_rejects_nonfinite_and_too_short_requests(self):
        build=self.function('treadmill_progression_0970.py','build_plan',{})
        handler=self.function('treadmill_progression_0970.py','treadmill_plan_0970',{'root':self.core,'request':self.core.request,'math':math,'build_plan':build,'last_session':lambda:None})
        # Hook registration is complete before the first request.
        self.core.app.add_url_rule('/api/treadmill-0970/plan',view_func=handler)
        for minutes in ('nan','inf','-1','2'):self.assertEqual(self.client.get('/api/treadmill-0970/plan?minutes='+minutes).status_code,400)
        data=self.client.get('/api/treadmill-0970/plan?minutes=5').get_json();self.assertEqual(sum(p['minutes'] for p in data['phases']),data['duration_min'])

    def test_nutrition_model_output_must_have_finite_nonnegative_numbers(self):
        analyze=self.function('nutrition_ai_0102.py','_gemini_parts',{'gem':types.SimpleNamespace(_ai_config=lambda:{'provider':'gemini','api_key':'test-secret','model':'test-model'}),'urllib':__import__('urllib'),'json':json,'math':math})
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return self.body
        response=Response()
        for value in [-1,float('inf'),True,120]:
            response.body=json.dumps({'candidates':[{'content':{'parts':[{'text':json.dumps({'understood':'Pasto','calories':value})}]}}]}).encode()
            with patch.object(urllib.request,'urlopen',return_value=response):
                if value==120:self.assertEqual(analyze([],'Test')['calories'],120)
                else:
                    with self.assertRaises(ValueError):analyze([],'Test')
