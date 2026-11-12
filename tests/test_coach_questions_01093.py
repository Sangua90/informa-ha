import importlib.util
from contextlib import closing
import json
from pathlib import Path
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
import types
import unittest
from unittest.mock import patch

import test_ai_training_01089 as fixtures


class CoachQuestionsTest(unittest.TestCase):
    def setUp(self):
        self.fixture=fixtures.AITrainingTest();self.fixture.setUp()
        self.core=self.fixture.core;self.training=self.fixture.module;self.client=self.fixture.client
        path=Path(__file__).parents[1]/'informa/coach_questions_01093.py'
        spec=importlib.util.spec_from_file_location('coach_questions_test',path);self.q=importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules,{'app':self.core,'ai_training_01089':self.training,'logic_audit_01091':types.SimpleNamespace(app=self.core.app)}):spec.loader.exec_module(self.q)
        self.notify=patch.object(self.core,'hass_request',return_value={});self.ha=self.notify.start()
        self.panel=patch.object(self.q,'panel_path',return_value='/abc_informa');self.panel.start()

    def tearDown(self):
        self.panel.stop();self.notify.stop();self.fixture.tearDown()

    def first(self):
        return self.client.post('/api/coach-questions/check').get_json()['items'][0]

    def answer(self,q,text='Due volte, di solito martedì e sabato',revision=None):
        return self.client.post(f"/api/coach-questions/{q['id']}/answer",json={'answer':text,'revision':q['revision'] if revision is None else revision})

    def test_initial_question_notification_and_link_are_durable_and_deduplicated(self):
        q=self.first();self.first();self.assertEqual(len(self.q.listing()),1)
        calls=[c for c in self.ha.call_args_list if c.args[0].endswith('/create')]
        self.assertEqual(len(calls),1);payload=calls[0].kwargs['payload']
        self.assertIn('/abc_informa?coach_question='+str(q['id']),payload['message'])
        self.assertNotIn(q['body'],payload['message']);self.assertEqual(payload['notification_id'],'informa_coach_question_'+str(q['id']))
        mobile=[c for c in self.ha.call_args_list if '/notify/' in c.args[0]][0].kwargs['payload']
        self.assertEqual(mobile['data']['url'],mobile['data']['clickAction']);self.assertEqual(mobile['data']['tag'],payload['notification_id'])

    def test_answer_edit_and_lost_ack_retry_save_once_per_revision(self):
        q=self.first();first=self.answer(q).get_json()['question'];self.assertEqual(first['state'],'answered')
        self.assertEqual(self.answer(q).get_json()['question']['revision'],1)
        edited=self.answer(first,'Tre sedute, con frequenza variabile').get_json()['question'];self.assertEqual(edited['revision'],2)
        with closing(self.core.db()) as con:self.assertEqual(con.execute('SELECT COUNT(*) FROM coach_question_answers').fetchone()[0],2)
        self.assertTrue(any(c.args[0].endswith('/dismiss') for c in self.ha.call_args_list))

    def test_stale_device_cannot_overwrite_a_newer_answer(self):
        q=self.first();self.answer(q,'Due volte')
        response=self.answer(q,'Cinque volte');self.assertEqual(response.status_code,409)
        self.assertEqual(self.q.listing()[0]['answer'],'Due volte')

    def test_invalid_answers_and_unknown_ids_never_write(self):
        q=self.first()
        for body in [[],{}, {'answer':' ','revision':0},{'answer':True,'revision':0},{'answer':'x'*2001,'revision':0},{'answer':'Due','revision':True}]:
            self.assertEqual(self.client.post(f"/api/coach-questions/{q['id']}/answer",json=body).status_code,400)
        self.assertEqual(self.client.post('/api/coach-questions/999/answer',json={'answer':'Due','revision':0}).status_code,404)
        self.assertIsNone(self.q.listing()[0]['answer'])

    def test_saved_answer_is_in_fresh_model_context_and_does_not_count_as_training(self):
        q=self.first();self.answer(q)
        ctx=self.training.unified_context();self.assertIn('coach_answers',ctx['coverage']['sources'])
        self.assertEqual(ctx['coach_dialogue']['answers'][0]['answer'],'Due volte, di solito martedì e sabato')
        self.assertEqual(ctx['training']['set_history'],[])
        self.assertIn('coach_dialogue',self.training.safe_context(ctx))
        captured=[]
        def generate(prompt,ctx,**kw):
            captured.append((prompt,ctx));return json.dumps(self.fixture.plan(ctx))
        with patch.object(self.training,'request_ai',generate):data=self.client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':30}).get_json()
        self.assertEqual(data['decision'],'train');self.assertIn('coach_dialogue',captured[0][0]);self.assertEqual(captured[0][1]['coach_dialogue']['answers'][0]['topic'],'frequency')

    def test_pending_question_prevents_an_unnecessary_model_call_and_can_be_postponed(self):
        with patch.object(self.training,'request_ai') as generate:
            response=self.client.post('/api/ai-workout-01089',json={'exercise_count':2}).get_json()
        self.assertEqual(response['decision'],'clarify');generate.assert_not_called();q=response['question']
        self.assertEqual(self.client.post(f"/api/coach-questions/{q['id']}/postpone").status_code,200)
        self.assertIsNone(self.q.active_question());self.assertEqual(self.q.listing()[0]['state'],'open')
        with patch.object(self.training,'request_ai',lambda p,c,**kw:json.dumps(self.fixture.plan(c))):
            self.assertEqual(self.client.post('/api/ai-workout-01089',json={'exercise_count':2,'minutes':30}).get_json()['decision'],'train')
        self.assertEqual(len(self.q.listing()),1)

    def test_model_can_create_a_validated_clarification_then_reuses_pending_question(self):
        self.answer(self.first())
        def generate(p,c,**kw):return json.dumps({'decision':'clarify','reason':'Chiarire il recupero','data_used':c['coverage']['sources'],'items':[],'question':{'topic':'recovery','text':'Il fastidio segnalato compare anche durante le attività quotidiane?'}})
        with patch.object(self.training,'request_ai',generate):data=self.client.post('/api/ai-workout-01089',json={}).get_json()
        self.assertEqual(data['decision'],'clarify');self.assertEqual(data['question']['topic'],'recovery')
        with patch.object(self.training,'request_ai') as request:
            repeated=self.client.post('/api/ai-workout-01089',json={}).get_json()
        request.assert_not_called();self.assertEqual(repeated['question']['id'],data['question']['id'])

    def test_notification_failure_keeps_question_and_retries_with_backoff(self):
        self.ha.side_effect=RuntimeError('private upstream failure')
        q=self.first();self.assertTrue(q['notification_pending']);count=self.ha.call_count
        self.first();self.assertEqual(self.ha.call_count,count)
        self.assertNotIn('private upstream',json.dumps(self.q.listing()))
        with closing(self.core.db()) as con:con.execute('UPDATE coach_questions SET notify_retry_at=0');con.commit()
        self.ha.side_effect=None;self.first();self.assertFalse(self.q.listing()[0]['notification_pending'])

    def test_concurrent_notifications_share_one_claim(self):
        q=self.q.create_question('frequency',self.q.FREQUENCY,'initial_setup');started=threading.Event();release=threading.Event()
        def send(path,**kw):
            if path.endswith('/create'):started.set();release.wait(3)
            return {}
        self.ha.side_effect=send
        with ThreadPoolExecutor(max_workers=2) as pool:
            first=pool.submit(self.q.notify_question,q['id'])
            try:self.assertTrue(started.wait(3));self.assertFalse(pool.submit(self.q.notify_question,q['id']).result(3))
            finally:release.set()
            self.assertTrue(first.result(3))
        self.assertEqual(sum(c.args[0].endswith('/create') for c in self.ha.call_args_list),1)

    def test_invalid_model_question_cannot_notify_or_become_a_workout(self):
        self.answer(self.first());before=len(self.q.listing())
        def invalid(p,c,**kw):return json.dumps({'decision':'clarify','reason':'Test','data_used':c['coverage']['sources'],'items':[],'question':{'topic':'invalid','text':'Invented'}})
        with patch.object(self.training,'request_ai',invalid):data=self.client.post('/api/ai-workout-01089',json={}).get_json()
        self.assertEqual(data['mode'],'local_fallback');self.assertEqual(len(self.q.listing()),before)
