from contextlib import closing
import importlib.util
import json
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch
import test_ai_training_01089 as fixtures


class CoachNotesTest(unittest.TestCase):
    def setUp(self):
        self.fixture=fixtures.AITrainingTest();self.fixture.setUp()
        self.core=self.fixture.core;self.training=self.fixture.module;self.client=self.fixture.client
        spec=importlib.util.spec_from_file_location('coach_notes_test',Path(__file__).parents[1]/'informa/coach_notes_010101.py')
        self.notes=importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules,{'app':self.core,'ai_training_01089':self.training,'coach_questions_01093':types.SimpleNamespace(app=self.core.app)}):spec.loader.exec_module(self.notes)

    def tearDown(self):self.fixture.tearDown()

    def save(self,reps=20,id='bird_dog',request_id='notes-request-001',body=None,changes=None):
        if changes is None:changes=[{'exercise_id':id,'reps':reps,'unit':'seconds' if id=='plank' else 'reps'}]
        with patch.object(self.training,'request_ai',return_value=json.dumps({'changes':changes})):
            return self.client.post('/api/coach-notes',json={'request_id':request_id,'exercise_id':id,'body':body or f'Vorrei {reps} ripetizioni per lato per questo esercizio'})

    def test_note_is_durable_and_changes_the_next_plan_without_creating_performed_work(self):
        response=self.save();self.assertEqual(response.status_code,200,response.get_json())
        self.assertIn('20 rip. per lato',response.get_json()['note']['summary'])
        ctx=self.training.unified_context()
        self.assertEqual(ctx['coach_notes']['exercise_preferences']['bird_dog']['reps'],20)
        self.assertEqual(ctx['training']['bodyweight_progression']['bird_dog']['target'],20)
        self.assertIn('coach_notes',ctx['coverage']['sources'])
        self.assertIn('coach_notes',self.training.safe_context(ctx))
        with closing(self.core.db()) as con:
            self.assertEqual(con.execute('SELECT COUNT(*) FROM workouts').fetchone()[0],0)
            self.assertEqual(con.execute('SELECT COUNT(*) FROM sets').fetchone()[0],0)
        def plan(q,c,**kw):return json.dumps(self.fixture.plan(c,('bird_dog','chest')))
        with patch.object(self.training,'request_ai',plan):
            data=self.client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':30,'energy':'Normale','pain':'Nessuno'}).get_json()
        self.assertEqual(data['mode'],'gemini',data)
        self.assertEqual(data['plan'][0]['reps'],20)
        self.assertTrue(data['plan'][0]['perSide'])

    def test_retry_uses_the_original_acknowledgement_without_another_provider_call(self):
        first=self.save().get_json()['note']
        with patch.object(self.training,'request_ai',side_effect=AssertionError('must not repeat')):
            second=self.client.post('/api/coach-notes',json={'request_id':'notes-request-001','exercise_id':'bird_dog','body':'Vorrei 20 ripetizioni per lato'}).get_json()['note']
        self.assertEqual(first,second)
        self.assertEqual(len(self.client.get('/api/coach-notes').get_json()['items']),1)

    def test_latest_explicit_preference_wins_and_archiving_does_not_resurrect_old_instructions(self):
        first=self.save().get_json()['note'];second=self.save(12,request_id='notes-request-002').get_json()['note']
        ctx=self.training.unified_context()
        self.assertEqual(ctx['coach_notes']['exercise_preferences']['bird_dog']['reps'],12)
        self.assertEqual(len(ctx['coach_notes']['notes']),1)
        self.assertEqual(self.client.post(f"/api/coach-notes/{second['id']}/active",json={'active':False}).status_code,200)
        ctx=self.training.unified_context()
        self.assertEqual(ctx['coach_notes']['exercise_preferences'],{})
        self.assertEqual(ctx['coach_notes']['notes'],[])
        self.assertEqual(ctx['training']['bodyweight_progression']['bird_dog']['target'],6)
        self.client.post(f"/api/coach-notes/{first['id']}/active",json={'active':False})
        self.client.post(f"/api/coach-notes/{first['id']}/active",json={'active':True})
        self.assertEqual(self.training.unified_context()['coach_notes']['exercise_preferences']['bird_dog']['reps'],20)

    def test_generic_note_is_context_only_and_cannot_alter_parameters_or_exclusions(self):
        self.client.put('/api/exercise-availability-01087/plank',json={'enabled':False})
        response=self.save(body='Preferisco allenarmi con calma e usare i manubri',changes=[])
        self.assertEqual(response.status_code,200)
        self.assertIn('Nessun parametro',response.get_json()['note']['summary'])
        self.assertEqual(self.training.unified_context()['coach_notes']['exercise_preferences'],{})
        with closing(self.core.db()) as con:self.assertEqual([r[0] for r in con.execute('SELECT exercise_id FROM exercise_exclusions')],['plank'])

    def test_invalid_or_ambiguous_changes_are_rejected_before_writing(self):
        cases=[([{'exercise_id':'bird_dog','reps':31,'unit':'reps'}],'Vorrei 31 ripetizioni per lato'),
               ([{'exercise_id':'bird_dog','reps':20,'unit':'seconds'}],'Vorrei 20 ripetizioni per lato'),
               ([{'exercise_id':'bird_dog','reps':20,'unit':'reps'}],'Vorrei 20 ripetizioni totali'),
               ([{'exercise_id':'bird_dog','reps':12,'unit':'reps'}],'Vorrei 20 ripetizioni per lato'),
               ([{'exercise_id':'bird_dog','sets':4}],'Vorrei 4 serie'),
               ([{'exercise_id':'chest','reps':20,'unit':'reps'}],'Vorrei 20 ripetizioni per lato'),
               ([{'exercise_id':'bird_dog','weight':20}],'Vorrei 20 kg')]
        for changes,body in cases:
            with self.subTest(changes=changes):self.assertEqual(self.save(body=body,changes=changes).status_code,400)
        self.assertEqual(self.client.get('/api/coach-notes').get_json()['items'],[])

    def test_timed_note_requires_seconds_and_provider_failure_does_not_claim_to_save(self):
        self.assertEqual(self.save(id='plank',body='Vorrei 20 ripetizioni',changes=[{'exercise_id':'plank','reps':20,'unit':'seconds'}]).status_code,400)
        self.assertEqual(self.save(id='plank',body='Vorrei 45 secondi',changes=[{'exercise_id':'plank','reps':45,'unit':'seconds'}]).status_code,200)
        with patch.object(self.training,'request_ai',side_effect=RuntimeError('offline')):
            response=self.client.post('/api/coach-notes',json={'request_id':'notes-request-003','exercise_id':'bird_dog','body':'Vorrei 20 ripetizioni per lato'})
        self.assertEqual(response.status_code,503)
        self.assertEqual(len(self.client.get('/api/coach-notes').get_json()['items']),1)

    def test_weighted_preferences_sets_and_rest_are_in_the_shared_local_endpoint_and_ai_validator(self):
        response=self.save(id='dumbbell_curl',body='Voglio 20 ripetizioni, 3 serie e 90 secondi di recupero',changes=[{'exercise_id':'dumbbell_curl','reps':20,'unit':'reps','sets':3,'rest':90}])
        self.assertEqual(response.status_code,200)
        data=self.client.get('/api/bodyweight-progression-01099').get_json()
        self.assertEqual(data['exercise_preferences']['dumbbell_curl'],{'reps':20,'sets':3,'rest':90})
        ctx=self.training.unified_context();plan=self.fixture.plan(ctx,('dumbbell_curl','bird_dog'))
        result=self.training.validate_plan(plan,self.training.allowed_candidates(ctx,'Nessuno'),2,'Normale',30,ctx['coverage']['sources'],ctx['training']['bodyweight_progression'],ctx['coach_notes']['exercise_preferences'])
        self.assertEqual((result[0]['reps'],result[0]['sets'],result[0]['rest']),(20,3,90))

    def test_preview_interprets_but_does_not_save_a_note_preference_or_performed_work(self):
        with patch.object(self.training,'request_ai',return_value=json.dumps({'changes':[{'exercise_id':'bird_dog','reps':20,'unit':'reps'}]})):
            response=self.client.post('/api/coach-notes',json={'request_id':'preview-request-001','exercise_id':'bird_dog','body':'Vorrei 20 ripetizioni per lato','preview':True})
        data=response.get_json();self.assertEqual(response.status_code,200)
        self.assertTrue(data['preview']);self.assertFalse(data['applied'])
        self.assertEqual(data['changes'][0]['reps'],20)
        self.assertEqual(self.client.get('/api/coach-notes').get_json()['items'],[])
        self.assertEqual(self.training.unified_context()['coach_notes']['exercise_preferences'],{})

    def test_bird_dog_is_selectable_per_side_and_uses_both_sides_in_the_time_budget(self):
        ctx=self.training.unified_context();candidates=self.training.allowed_candidates(ctx,'Nessuno')
        bird=candidates['bird_dog'];self.assertTrue(bird['perSide']);self.assertEqual(bird['loadType'],'bodyweight')
        for pain in ('Ginocchio','Spalla','Schiena','Polso'):
            self.assertNotIn('bird_dog',self.training.allowed_candidates(ctx,pain))
        value=self.fixture.plan(ctx,('bird_dog','plank'));value['items'][0]['reps']=6
        targets=ctx['training']['bodyweight_progression']
        with self.assertRaises(ValueError):self.training.validate_plan(value,candidates,2,'Normale',5.9,ctx['coverage']['sources'],targets)
        result=self.training.validate_plan(value,candidates,2,'Normale',7,ctx['coverage']['sources'],targets)
        self.assertEqual(result[0]['reps'],6)
