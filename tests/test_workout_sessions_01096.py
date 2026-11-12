import copy
import importlib.util
import sys
import types
import unittest
from unittest.mock import patch
import test_logic_audit_01091 as legacy
ROOT=legacy.ROOT


class WorkoutSessionsTest(unittest.TestCase):
    def setUp(self):
        legacy.LogicAuditTest.setUp(self)
        self.core.app.add_url_rule('/api/workouts-0933/<int:workout_id>','workout_delete_0933',lambda workout_id:None,methods=['DELETE'])
        training=types.SimpleNamespace(config=types.SimpleNamespace(),context93=types.SimpleNamespace(),request_ai=lambda:None)
        spec=importlib.util.spec_from_file_location('sessions_test',ROOT/'workout_sessions_01096.py');self.sessions=importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules,{'app':self.core,'coach_questions_01093':types.SimpleNamespace(app=self.core.app),'ai_training_01089':training}):spec.loader.exec_module(self.sessions)
        self.snapshot={'session_id':'session-test-123','workout_id':None,'plan':[{'id':'chest','name':'Chest','sets':2,'reps':10,'rest':60}],'options':{'started':'2026-11-12T12:00:00'},'flow':{'chest':{'stage':'started','sets':{'1':{'weight':'9','reps':'10','done':False}}}},'names':{},'order':['chest'],'updated_at':123}

    tearDown=legacy.LogicAuditTest.tearDown
    count=legacy.LogicAuditTest.count
    set=legacy.LogicAuditTest.set

    def save(self,revision=0,snapshot=None):
        return self.client.put('/api/workout-session',json={'revision':revision,'snapshot':snapshot or self.snapshot})

    def test_snapshot_does_not_create_completed_workout_or_sets(self):
        self.assertEqual(self.save().status_code,200)
        self.assertEqual(self.count('workouts'),0);self.assertEqual(self.count('sets'),0)
        data=self.client.get('/api/workout-session').get_json()
        self.assertEqual(data['session'],self.snapshot);self.assertEqual(data['revision'],1)

    def test_lost_ack_retry_and_revision_prevent_overwriting_newer_session(self):
        self.assertEqual(self.save().get_json()['revision'],1)
        self.assertEqual(self.save().get_json()['revision'],1)
        changed=copy.deepcopy(self.snapshot);changed['updated_at']=999
        self.assertEqual(self.save(snapshot=changed).status_code,409)
        self.assertEqual(self.save(revision=1,snapshot=changed).get_json()['revision'],2)

    def test_single_active_session_and_closed_tombstone(self):
        self.save();other={**self.snapshot,'session_id':'another-session'}
        self.assertEqual(self.save(snapshot=other).status_code,409)
        self.assertEqual(self.client.post('/api/workout-session/session-test-123/close',json={'state':'discarded'}).status_code,200)
        self.assertEqual(self.save().status_code,410)
        self.assertEqual(self.client.get('/api/workout-session?session_id=session-test-123').get_json()['state'],'discarded')
        self.assertEqual(self.save(snapshot=other).status_code,200)

    def test_reconcile_lost_set_and_archive_ack_from_canonical_db(self):
        self.save();wid=self.set(request_id='session-test-123:chest:1',weight=5).get_json()['workout_id']
        data=self.client.get('/api/workout-session').get_json()['session']
        self.assertEqual(data['workout_id'],wid);self.assertTrue(data['flow']['chest']['sets']['1']['done']);self.assertEqual(data['flow']['chest']['sets']['1']['weight'],'5.0')
        self.client.post('/api/workout-flow-0949/archive',json={'request_id':'session-test-123:archive:chest','exercise':'Chest','workout_id':wid,'status':'Parziale'})
        data=self.client.get('/api/workout-session').get_json()['session']
        self.assertEqual(data['flow']['chest']['status'],'Parziale')

    def test_unsaved_set_cannot_become_canonical_done(self):
        wid=self.set(request_id='session-test-123:chest:1').get_json()['workout_id']
        self.snapshot['flow']['chest']['sets']['2']={'done':True,'weight':'7','reps':'10'}
        self.save();data=self.client.get('/api/workout-session').get_json()['session']
        self.assertEqual(data['workout_id'],wid);self.assertFalse(data['flow']['chest']['sets']['2']['done']);self.assertEqual(data['flow']['chest']['sets']['2']['weight'],'7')

    def test_finish_closes_even_when_snapshot_did_not_receive_workout_id(self):
        self.save();wid=self.set(request_id='session-test-123:chest:1').get_json()['workout_id']
        self.assertEqual(self.client.post('/api/coach/finish',json={'workout_id':wid,'session_id':self.snapshot['session_id'],'duration_min':10}).status_code,200)
        self.assertEqual(self.save().status_code,410);self.assertIsNone(self.client.get('/api/workout-session').get_json()['session'])

    def test_discard_closes_bound_draft_before_deleting_mutation_rows(self):
        self.save();wid=self.set(request_id='session-test-123:chest:1').get_json()['workout_id']
        self.assertEqual(self.client.delete('/api/workouts-0933/'+str(wid)).status_code,200)
        self.assertEqual(self.count('workouts'),0);self.assertEqual(self.count('sets'),0);self.assertEqual(self.count('mutation_requests'),0)
        self.assertEqual(self.save().status_code,410)

    def test_invalid_snapshots_are_rejected_without_overwriting_the_draft(self):
        for update in [{'plan':None},{'plan':[{'id':'bad<id','name':'Chest'}]},{'plan':[{'id':'chest','name':'<img src=x>'}]},{'plan':[{'id':'chest','name':'Chest','sets':1.5}]},{'plan':[{'id':'chest','name':'Chest','reps':float('nan')}]},{'session_id':'x%'},{'workout_id':999}]:
            with self.subTest(update=update):self.assertIn(self.save(snapshot={**self.snapshot,**update}).status_code,(400,404))
        self.assertEqual(self.count('workout_drafts'),0)

    def test_discard_after_lost_ack_removes_the_actual_bound_workout(self):
        self.save();self.set(request_id='session-test-123:chest:1')
        self.assertEqual(self.client.post('/api/workout-session/session-test-123/close',json={'state':'discarded'}).status_code,200)
        self.assertEqual(self.count('workouts'),0);self.assertEqual(self.count('sets'),0);self.assertEqual(self.save().status_code,410)

    def test_stale_offline_discard_cannot_erase_a_session_already_finished_elsewhere(self):
        self.save();wid=self.set(request_id='session-test-123:chest:1').get_json()['workout_id']
        self.client.post('/api/coach/finish',json={'workout_id':wid,'session_id':self.snapshot['session_id'],'duration_min':10})
        response=self.client.post('/api/workout-session/session-test-123/close',json={'state':'discarded'})
        self.assertEqual(response.status_code,200);self.assertEqual(response.get_json()['state'],'saved');self.assertEqual(self.count('workouts'),1);self.assertEqual(self.count('sets'),1)
        self.assertEqual(self.client.get('/api/workout-session?session_id=session-test-123').get_json()['state'],'saved')
        self.assertEqual(self.client.delete('/api/workouts-0933/'+str(wid)+'?session_id=session-test-123').get_json()['state'],'saved');self.assertEqual(self.count('workouts'),1)
