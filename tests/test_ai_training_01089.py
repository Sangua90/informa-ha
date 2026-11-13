import importlib.util
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
from datetime import datetime


ROOT = Path(__file__).parents[1] / 'informa'


class AITrainingTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        folder = Path(self.temp.name)
        self.core = types.ModuleType('ai_training_core_test')
        self.core.__file__ = str(ROOT / 'app.py')
        sys.modules[self.core.__name__] = self.core
        source = (ROOT / 'app.py').read_text(encoding='utf-8').replace('DB = Path("/data/informa.db")', f'DB = Path({str(folder / "db.sqlite")!r})').replace('PHOTO_DIR = Path("/data/meal_photos")', f'PHOTO_DIR = Path({str(folder / "photos")!r})')
        exec(compile(source, 'app.py', 'exec'), self.core.__dict__)
        spec = importlib.util.spec_from_file_location('ai_training_catalog_test', ROOT / 'coach_library_0962.py')
        catalog = importlib.util.module_from_spec(spec);spec.loader.exec_module(catalog)
        old = lambda: {'generated_at':datetime.now().isoformat(), 'goal':'Forza', 'training':{},'nutrition':{'today':{},'goals':{}},'supplements':{'active':0}}
        self.cfg = {'provider':'gemini','api_key':'test-only-secret','model':'gemini-3.6-flash'}
        self.config = types.SimpleNamespace(_ai_config_092=lambda:self.cfg, _extract_interaction_text=lambda data: data['steps'][0]['content'][0]['text'])
        dependencies = {'app':self.core,'nutrition_ai_0102':types.SimpleNamespace(app=self.core.app),'ai_coach_090':types.SimpleNamespace(_coach_context_090=old),'ai_context_093':types.SimpleNamespace(),'ai_gemini_091':types.SimpleNamespace(),'ai_gemini_092':self.config,'coach_library_0962':catalog}
        spec = importlib.util.spec_from_file_location('ai_training_test', ROOT / 'ai_training_01089.py')
        self.module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, dependencies): spec.loader.exec_module(self.module)
        self.client = self.core.app.test_client()

    def tearDown(self):
        sys.modules.pop(self.core.__name__, None)
        self.temp.cleanup()

    def plan(self, ctx, ids=('chest','plank')):
        return {'decision':'train','reason':'Obiettivo forza, storico e recupero considerati','data_used':ctx['coverage']['sources'], 'items':[{'id':id,'sets':2,'reps':30 if id=='plank' else 10,'rest':60} for id in ids]}

    def test_context_updates_after_saved_measurements_sets_exclusions_and_effort(self):
        con=self.core.db()
        con.execute('UPDATE profile SET height_cm=190,goal=? WHERE id=1', ('Forza',))
        con.execute('INSERT INTO body_measurements(ts,weight_kg,waist_cm,chest_cm,arm_r_cm,thigh_l_cm,height_cm) VALUES(?,?,?,?,?,?,?)',(datetime.now().isoformat(),90,95,110,38,60,190))
        con.commit();con.close()
        response=self.client.post('/api/set',json={'exercise':'Plank','reps':30,'rep_type':'seconds','set_no':1})
        wid=response.get_json()['workout_id']
        self.client.post('/api/exercise-effort-01089',json={'exercise_id':'plank','workout_id':wid,'effort':4})
        self.client.put('/api/exercise-availability-01087/chest',json={'enabled':False})
        ctx=self.module.unified_context()
        self.assertEqual(ctx['latest_measurements']['height_cm'],190)
        self.assertEqual(ctx['latest_measurements']['chest_cm'],110)
        self.assertEqual(ctx['latest_measurements']['thigh_l_cm'],60)
        self.assertEqual(ctx['training']['set_history'][0]['rep_type'],'seconds')
        self.assertEqual(ctx['training']['effort_ratings'][0]['effort'],4)
        self.assertEqual(ctx['training']['sets_72h'],1)
        self.assertEqual(ctx['equipment']['excluded_exercise_ids'],['chest'])
        self.assertNotIn('name',ctx['profile'])

    def test_ai_plan_is_generated_from_fresh_context_and_normalized(self):
        captured=[]
        def request(question,ctx,**kwargs):
            captured.append(ctx);return json.dumps(self.plan(ctx))
        with patch.object(self.module,'request_ai',request):
            response=self.client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':30,'energy':'Normale','pain':'Nessuno'})
        data=response.get_json()
        self.assertEqual(data['mode'],'gemini')
        self.assertEqual([x['id'] for x in data['plan']],['chest','plank'])
        self.assertEqual(data['plan'][1]['repType'],'seconds')
        self.assertEqual(data['plan'][0]['loadType'],'plates')
        self.assertIn('checkin',data['data_used'])
        self.assertIn('measurements',captured[0])
        self.assertIn('equipment',captured[0])

    def test_invalid_duplicate_excluded_or_pain_blocked_ai_plans_fall_back(self):
        for ids,pain in [(('chest','chest'),'Nessuno'),(('invented','plank'),'Nessuno'),(('chest','plank'),'Spalla')]:
            with self.subTest(ids=ids,pain=pain), patch.object(self.module,'request_ai',lambda q,c,**kw:json.dumps(self.plan(c,ids))):
                data=self.client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':30,'pain':pain}).get_json()
                self.assertEqual(data['mode'],'local_fallback')
                self.assertIsNone(data['plan'])

    def test_budget_sets_units_and_source_coverage_are_checked(self):
        ctx=self.module.unified_context();candidates=self.module.allowed_candidates(ctx,'Nessuno')
        for change in ['sets','reps','rest','sources','duration']:
            value=self.plan(ctx)
            if change in ('sets','reps','rest'):value['items'][0][change]=999
            if change=='sources':value['data_used']=[]
            with self.subTest(change=change), self.assertRaises(ValueError):
                self.module.validate_plan(value,candidates,2,'Normale',0.1 if change=='duration' else 30,ctx['coverage']['sources'])

    def test_recovery_and_provider_failure_are_explicit(self):
        with patch.object(self.module,'request_ai',lambda q,c,**kw:json.dumps({'decision':'recovery','reason':'Recupero richiesto dallo storico','data_used':c['coverage']['sources'],'items':[]})):
            data=self.client.post('/api/ai-workout-01089',json={'exercise_count':2}).get_json()
            self.assertEqual(data['decision'],'recovery');self.assertEqual(data['plan'],[])
        with patch.object(self.module,'request_ai',side_effect=RuntimeError('Gemini non configurato')):
            data=self.client.post('/api/ai-workout-01089',json={}).get_json()
            self.assertEqual(data['mode'],'local_fallback');self.assertIn('non configurato',data['reason'])

    def test_network_request_uses_structured_schema_and_stateless_revision(self):
        payload={}
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return json.dumps({'steps':[{'type':'model_output','content':[{'type':'text','text':'{}'}]}]}).encode()
        def open_request(req,timeout):payload.update(json.loads(req.data));self.assertEqual(req.get_header('Api-revision'),'2026-05-20');return Response()
        with patch.object(self.module.urllib.request,'urlopen',open_request):
            self.assertEqual(self.module.request_ai('Prova',self.module.unified_context(),schema={'type':'object'}),'{}')
        self.assertFalse(payload['store'])
        self.assertIn('Manubri: il carico registrato',payload['system_instruction'])
        self.assertEqual(payload['response_format']['mime_type'],'application/json')
        self.assertNotIn(self.cfg['api_key'],payload['input'])

    def test_dumbbell_context_uses_discs_on_one_implement_without_converting_saved_loads(self):
        catalog=self.module.training_catalog()
        weighted=[e for e in catalog if e['loadType']=='kg']
        self.assertEqual(len(weighted),12)
        for e in weighted:
            self.assertEqual(e['loadBasis'],'dumbbell_discs_each')
            self.assertEqual(e['dumbbellCount'],1 if e['id'] in {'one_arm_dumbbell_row','goblet_squat','single_leg_romanian_deadlift','seated_dumbbell_calf_raise'} else 2)
        exercise=next(e for e in weighted if e['id']=='dumbbell_shoulder_press')
        self.client.post('/api/set',json={'exercise':exercise['name'],'weight':7.5,'reps':10,'set_no':1})
        ctx=self.module.unified_context()
        saved=ctx['training']['set_history'][0]
        self.assertEqual(saved['weight'],7.5)
        self.assertEqual(saved['load_basis'],'dumbbell_discs_each')
        self.assertEqual(saved['dumbbell_count'],2)
        self.assertEqual(self.module.known_load(exercise,ctx,'maintain'),7.5)
        self.assertIn('esclusi impugnatura e fermadischi',ctx['equipment']['load_convention'])
        self.assertIn('mai per la coppia',self.module.safe_context(ctx)['equipment']['load_convention'])

    def bodyweight_context(self, id='heel_taps', reps=10, fatigue='Facile', completed=True, hours=72):
        ctx=self.module.unified_context()
        ex=next(e for e in ctx['exercise_catalog'] if e['id']==id)
        ctx['training']['set_history']=[{'workout_id':wid,'exercise':ex['name'],'reps':reps,'rep_type':ex['repType'],'set_no':n,'fatigue':fatigue,'ts':(datetime.now()-__import__('datetime').timedelta(hours=hours+offset)).isoformat()} for wid,offset in [(2,0),(1,168)] for n in (2,1)]
        ctx['training']['exercise_outcomes']=[{'workout_id':wid,'exercise':ex['name'],'status':'Completato' if completed else 'Parziale'} for wid in (2,1)]
        ctx['training']['effort_ratings']=[]
        return ctx

    def test_bodyweight_initial_targets_and_two_complete_easy_sessions_progress_in_correct_units(self):
        initial=self.module.bodyweight_progressions(self.module.unified_context())
        self.assertEqual(initial['heel_taps']['target'],10)
        self.assertEqual(initial['plank']['target'],30)
        self.assertNotIn('stretch_calves',initial)
        for id,reps,target in [('heel_taps',10,12),('plank',30,35)]:
            with self.subTest(id=id):
                result=self.module.bodyweight_progressions(self.bodyweight_context(id,reps))[id]
                self.assertEqual((result['target'],result['action'],result['previous_sets']),(target,'progress',2))

    def test_bodyweight_partial_missing_outcome_one_set_or_mixed_repetitions_never_progress(self):
        for scenario in ('partial','missing','one_set','mixed','one_session','duplicate_set'):
            ctx=self.bodyweight_context()
            if scenario=='partial':ctx['training']['exercise_outcomes'][0]['status']='Parziale'
            if scenario=='missing':ctx['training']['exercise_outcomes']=[]
            if scenario=='one_set':ctx['training']['set_history']=ctx['training']['set_history'][::2]
            if scenario=='one_session':ctx['training']['set_history']=ctx['training']['set_history'][:2]
            if scenario=='mixed':ctx['training']['set_history'][0]['reps']=12
            if scenario=='duplicate_set':
                for row in ctx['training']['set_history']:row['set_no']=1
            with self.subTest(scenario=scenario):self.assertEqual(self.module.bodyweight_progressions(ctx)['heel_taps']['action'],'maintain')

    def test_bodyweight_moderate_effort_holds_and_hard_effort_reduces_in_correct_units(self):
        for id,reps,target in [('heel_taps',10,8),('plank',30,25)]:
            ctx=self.bodyweight_context(id,reps,fatigue='Giusta')
            self.assertEqual(self.module.bodyweight_progressions(ctx)[id]['action'],'maintain')
            ctx['training']['effort_ratings']=[{'workout_id':2,'exercise_id':id,'effort':5}]
            result=self.module.bodyweight_progressions(ctx)[id]
            self.assertEqual((result['target'],result['action']),(target,'reduce'))

    def test_bodyweight_numeric_easy_rating_is_session_bound_and_overrides_hidden_moderate_default(self):
        ctx=self.bodyweight_context(fatigue='Giusta')
        ctx['training']['effort_ratings']=[{'workout_id':wid,'exercise_id':'heel_taps','effort':2} for wid in (2,1)]
        self.assertEqual(self.module.bodyweight_progressions(ctx)['heel_taps']['target'],12)
        # Explicit moderate feedback also overrides old easy set labels.
        for row in ctx['training']['set_history']:row['fatigue']='Facile'
        ctx['training']['effort_ratings'][0]['effort']=3
        self.assertEqual(self.module.bodyweight_progressions(ctx)['heel_taps']['target'],10)
        for row in ctx['training']['set_history']:row['fatigue']='Giusta'
        ctx['training']['effort_ratings'][0]['effort']=2
        ctx['training']['effort_ratings'][0]['workout_id']=999
        self.assertEqual(self.module.bodyweight_progressions(ctx)['heel_taps']['target'],10)

    def test_bodyweight_short_recovery_low_energy_or_pain_prevents_increase_and_long_break_reduces(self):
        self.assertEqual(self.module.bodyweight_progressions(self.bodyweight_context(hours=12))['heel_taps']['action'],'maintain')
        ctx=self.bodyweight_context()
        for energy,pain in [('Bassa','Nessuno'),('Normale','Schiena')]:
            self.assertEqual(self.module.bodyweight_progressions(ctx,energy,pain)['heel_taps']['action'],'maintain')
        self.assertEqual(self.module.bodyweight_progressions(self.bodyweight_context(hours=800))['heel_taps']['target'],8)

    def test_bodyweight_ceiling_stays_bounded_and_recommends_a_variant(self):
        for id,reps in [('heel_taps',20),('plank',60)]:
            result=self.module.bodyweight_progressions(self.bodyweight_context(id,reps))[id]
            self.assertEqual((result['target'],result['action']),(reps,'ceiling'))
            self.assertIn('variante',result['reason'])

    def test_real_workout_route_applies_bodyweight_target_to_ai_plan_and_caps_simultaneous_series_increase(self):
        ctx=self.bodyweight_context()
        with patch.object(self.module,'unified_context',return_value=ctx),patch.object(self.module,'request_ai',lambda q,c,**kw:json.dumps(self.plan(c,('heel_taps','plank')))):
            response=self.client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':30,'energy':'Normale','pain':'Nessuno'})
        data=response.get_json()
        self.assertEqual(data['mode'],'gemini')
        self.assertEqual(data['plan'][0]['reps'],12)
        self.assertEqual(data['plan'][0]['progression']['action'],'progress')
        self.assertEqual(data['plan'][1]['reps'],30)
        targets=self.module.bodyweight_progressions(ctx)
        value=self.plan(ctx,('heel_taps','plank'));value['items'][0]['sets']=4
        candidates=self.module.allowed_candidates(ctx,'Nessuno')
        result=self.module.validate_plan(value,candidates,2,'Normale',30,ctx['coverage']['sources'],targets)
        self.assertEqual(result[0]['sets'],2)

    def test_effort_is_idempotent_and_payload_is_validated(self):
        body={'exercise_id':'plank','effort':5,'recorded_at':'2026-11-10T12:00:00'}
        for _ in range(2):self.assertEqual(self.client.post('/api/exercise-effort-01089',json=body).status_code,200)
        self.assertEqual(len(self.module.unified_context()['training']['effort_ratings']),1)
        for bad in [0,6,True,'5']:
            self.assertEqual(self.client.post('/api/exercise-effort-01089',json={**body,'effort':bad}).status_code,400)

    def test_transient_503_retries_then_returns_the_actual_provider_response(self):
        import urllib.error
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"OK provider"}]}}]}'
        failure=urllib.error.HTTPError('test',503,'busy',{},None)
        with patch.object(self.module.urllib.request,'urlopen',side_effect=[failure,failure,Response()]) as send,patch.object(self.module.time,'sleep') as sleep:
            self.assertEqual(self.module.request_ai('Test',{}),'OK provider');self.assertEqual(send.call_count,3);self.assertEqual(sleep.call_count,2)

    def test_long_primary_retry_after_uses_supported_alternate_with_same_model_context_and_schema(self):
        import io,urllib.error
        calls=[];schema={'type':'object','properties':{'decision':{'type':'string'}},'required':['decision']}
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\\"decision\\":\\"train\\"}"}]}}]}'
        def send(req,timeout):
            calls.append((req.full_url,json.loads(req.data),timeout))
            if len(calls)==1:raise urllib.error.HTTPError('private-url',503,'private error',{'Retry-After':'120'},io.BytesIO(b'{"error":{"code":"service_unavailable","message":"test-only-secret"}}'))
            return Response()
        with patch.object(self.module.urllib.request,'urlopen',send),patch.object(self.module.time,'sleep') as sleep:
            self.assertEqual(json.loads(self.module.request_ai('Prova',{'checkin':{'energy':'Normale'},'name':'private person'},schema=schema)),{'decision':'train'})
        self.assertEqual(len(calls),2);self.assertIn('/models/gemini-3.6-flash:generateContent',calls[1][0])
        first,second=calls[0][1],calls[1][1]
        self.assertEqual(first['input'],second['contents'][0]['parts'][0]['text']);self.assertEqual(first['system_instruction'],second['systemInstruction']['parts'][0]['text'])
        self.assertEqual(second['generationConfig']['responseFormat']['text'],{'mimeType':'APPLICATION_JSON','schema':schema})
        self.assertNotIn('private person',first['input']);self.assertLess(sleep.call_args.args[0],2)
        info=self.module.request_info();self.assertEqual(info['api'],'generateContent');self.assertEqual(info['attempts'][0]['provider_code'],'service_unavailable');self.assertEqual(info['attempts'][0]['retry_after_seconds'],120);self.assertNotIn('secret',json.dumps(info));self.assertNotIn('private-url',json.dumps(info))

    def test_alternate_honors_its_own_retry_after_and_never_exceeds_three_calls(self):
        import urllib.error
        with patch.object(self.module.urllib.request,'urlopen',side_effect=[urllib.error.HTTPError('test',503,'busy',{},None),urllib.error.HTTPError('test',503,'busy',{'Retry-After':'120'},None)]) as send,patch.object(self.module.time,'sleep') as sleep,self.assertRaises(RuntimeError):
            self.module.request_ai('Prova',{},timeout=20)
        self.assertEqual(send.call_count,2);self.assertEqual(sleep.call_count,1)

    def test_alternate_does_not_expose_thoughts_or_accept_truncated_generation(self):
        import urllib.error
        class Response:
            def __init__(self,finish):self.finish=finish
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return json.dumps({'candidates':[{'finishReason':self.finish,'content':{'parts':[{'thought':True,'text':'private reasoning'},{'text':'Risposta finale'}]}}]}).encode()
        for finish in ('STOP','MAX_TOKENS'):
            with patch.object(self.module.urllib.request,'urlopen',side_effect=[urllib.error.HTTPError('test',503,'busy',{},None),Response(finish)]),patch.object(self.module.time,'sleep'):
                if finish=='STOP':self.assertEqual(self.module.request_ai('Prova',{}),'Risposta finale')
                else:
                    with self.assertRaises(RuntimeError):self.module.request_ai('Prova',{})

    def test_provider_failures_are_bounded_and_permanent_errors_are_not_retried(self):
        import urllib.error
        for code,count in [(503,3),(401,1),(400,1),(429,1)]:
            with self.subTest(code=code),patch.object(self.module.urllib.request,'urlopen',side_effect=urllib.error.HTTPError('private-url',code,'secret upstream body',{},None)) as send,patch.object(self.module.time,'sleep'),self.assertRaises(RuntimeError) as error:
                self.module.request_ai('Test',{})
            self.assertEqual(send.call_count,count);self.assertNotIn('secret',str(error.exception));self.assertNotIn('private-url',str(error.exception))

    def test_provider_deadline_prevents_unbounded_retry(self):
        import urllib.error
        with patch.object(self.module.urllib.request,'urlopen',side_effect=urllib.error.URLError('offline')) as send,patch.object(self.module.time,'monotonic',side_effect=[0,0,39]),patch.object(self.module.time,'sleep') as sleep,self.assertRaises(RuntimeError):
            self.module.request_ai('Test',{},timeout=40)
        self.assertEqual(send.call_count,1);sleep.assert_not_called()

    def test_new_measurements_are_in_fresh_ai_context_without_rewriting_old_limbs(self):
        con=self.core.db();con.execute("INSERT INTO body_measurements(ts,hip_cm,calf_cm,measurement_side,arm_l_cm) VALUES('2026-11-12',105,40,'left',37)");con.commit();con.close()
        ctx=self.module.unified_context();self.assertEqual(ctx['latest_measurements']['hip_cm'],105);self.assertEqual(ctx['latest_measurements']['calf_cm'],40);self.assertEqual(ctx['measurements'][0]['measurement_side'],'left');self.assertEqual(ctx['latest_measurements']['arm_l_cm'],37);self.assertIsNone(ctx['measurements'][0]['arm_r_cm'])

    def test_health_history_is_dated_numeric_and_not_raw_import_payloads(self):
        con=self.core.db()
        con.execute('CREATE TABLE health_rest_metrics(id INTEGER PRIMARY KEY,metric_name TEXT,units TEXT,sample_ts TEXT,sample_json TEXT)')
        con.execute('INSERT INTO health_rest_metrics VALUES(?,?,?,?,?)',(1,'heart_rate_variability','ms','2026-11-10',json.dumps({'qty':45,'contact':'private@example.test'})))
        con.commit();con.close()
        ctx=self.module.unified_context()
        self.assertEqual(ctx['health']['recent_samples'][0]['values'],{'qty':45})
        self.assertEqual(ctx['health']['recent_samples'][0]['sample_ts'],'2026-11-10')
        self.assertIn('health',ctx['coverage']['sources'])

    def test_load_policy_uses_only_recorded_loads_and_checks_effort_before_progress(self):
        ctx=self.module.unified_context();exercise=next(e for e in ctx['exercise_catalog'] if e['id']=='chest')
        self.assertIsNone(self.module.known_load(exercise,ctx,'maintain'))
        at=(datetime.now()-__import__('datetime').timedelta(hours=72)).isoformat()
        ctx['training']['set_history']=[{'exercise':exercise['name'],'weight':5,'fatigue':'Facile','ts':at}]*2
        ctx['training']['effort_ratings']=[{'exercise_id':'chest','effort':2}]
        self.assertEqual(self.module.known_load(exercise,ctx,'maintain'),5)
        self.assertEqual(self.module.known_load(exercise,ctx,'reduce'),4)
        self.assertEqual(self.module.known_load(exercise,ctx,'progress'),6)
        ctx['training']['effort_ratings'][0]['effort']=5
        self.assertEqual(self.module.known_load(exercise,ctx,'progress'),5)
