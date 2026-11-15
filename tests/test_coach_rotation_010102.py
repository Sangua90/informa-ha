import copy
from datetime import datetime, timedelta
import json
import unittest
from unittest.mock import patch
import test_ai_training_01089 as fixtures
from coach_rotation_010102 import init_program, selection_policy, validate_selection, SelectionError, finished_history
from coach_progression_010102 import strength_progressions


class CoachRotationTest(unittest.TestCase):
    def setUp(self):
        self.f=fixtures.AITrainingTest();self.f.setUp()
        self.m=self.f.module;self.ctx=self.m.unified_context()
        self.catalog={e['id']:e for e in self.ctx['exercise_catalog']}
        self.candidates=self.m.allowed_candidates(self.ctx,'Nessuno')

    def tearDown(self):self.f.tearDown()

    def session(self, ids, days=2, wid=1):
        return {'workout_id':wid,'ts':(datetime.now()-timedelta(days=days)).isoformat(),
                'exercises':[{'exercise':self.catalog[id]['name'],'sets':3} for id in ids]}

    def history(self, sessions, total=None):
        self.ctx['training']['rotation_history']={'finished_strength_sessions':len(sessions) if total is None else total,'sessions':sessions}

    def test_three_real_sessions_cover_all_available_primary_groups(self):
        schedules=[['lat','lat_close_grip','dumbbell_shoulder_press','dumbbell_lateral_raise','one_arm_dumbbell_row'],
                   ['chest','pec_fly','dumbbell_curl','pushdown','dumbbell_hammer_curl'],
                   ['goblet_squat','leg_extension','romanian_deadlift','bodyweight_glute_kickback','calf_raise']]
        sessions=[];covered=set()
        for index,ids in enumerate(schedules):
            self.history(sessions)
            policy=selection_policy(self.ctx,self.candidates,5)
            self.assertEqual(policy['cycle_session'],index+1)
            validate_selection([self.catalog[id] for id in ids],policy)
            covered.update(self.catalog[id]['group'] for id in ids)
            sessions.insert(0,self.session(ids,days=2,wid=index+1))
        self.assertEqual(covered,set(policy['available_groups']))
        self.history(sessions)
        self.assertEqual(selection_policy(self.ctx,self.candidates,5)['cycle_session'],1)

    def test_old_full_body_workouts_do_not_form_the_first_two_sessions_of_the_new_split(self):
        ids=['lat','chest','pushdown','goblet_squat','incline_bench_crunch']
        self.history([self.session(ids,1,57),self.session(ids,3,56)])
        self.ctx['training']['rotation_history'].update(program_finished_sessions=0,program_start_workout_id=57)
        policy=selection_policy(self.ctx,self.candidates,5)
        self.assertEqual(policy['cycle_session'],1)
        self.assertEqual(policy['covered_groups'],[])
        self.assertEqual(len(policy['missing_groups']),9)
        with self.assertRaises(SelectionError):validate_selection([self.catalog[id] for id in reversed(ids)],policy)
        good=['lat','lat_close_grip','dumbbell_lateral_raise','dumbbell_reverse_fly','one_arm_dumbbell_row']
        validate_selection([self.catalog[id] for id in good],policy)

    def test_proposals_do_not_advance_cycle_or_train_muscles_and_order_cannot_hide_duplicate(self):
        self.ctx['training']['previous_proposals_not_completed_workouts']=[{'ts':datetime.now().isoformat(),'mode':'gemini','decision':'train','plan':[{'id':'chest'},{'id':'plank'}]}]
        p=selection_policy(self.ctx,self.candidates,2)
        self.assertEqual((p['cycle_session'],p['covered_groups']),(1,[]))
        with self.assertRaises(SelectionError):validate_selection([self.catalog['plank'],self.catalog['chest']],p)

    def test_small_count_and_unavailable_groups_are_reported_without_fake_coverage(self):
        p=selection_policy(self.ctx,self.candidates,2)
        self.assertEqual(p['coverage_shortfall'],3)
        self.assertEqual(p['minimum_exercises_for_coverage'],4)
        candidates={id:e for id,e in self.candidates.items() if e['group'] not in ('Spalle','Polpacci')}
        p=selection_policy(self.ctx,candidates,4)
        self.assertEqual(set(p['unavailable_groups']),{'Spalle','Polpacci'})
        self.assertEqual(p['coverage_shortfall'],0)

    def test_weekly_variant_is_enforced_only_when_compatible_alternatives_exist(self):
        self.history([self.session(['lat','dumbbell_shoulder_press','chest','dumbbell_curl','pushdown','goblet_squat','romanian_deadlift','bodyweight_glute_kickback','calf_raise'],2,2),self.session(['lat'],9,1)],total=3)
        p=selection_policy(self.ctx,self.candidates,2)
        self.assertNotIn('lat',p['weekly_variants']['Schiena'])
        with self.assertRaises(SelectionError):validate_selection([self.catalog['lat'],self.catalog['chest']],p)
        validate_selection([self.catalog['lat_close_grip'],self.catalog['dumbbell_shoulder_press']],p)
        narrow={id:e for id,e in self.candidates.items() if e['group']!='Schiena' or id=='lat'}
        self.assertNotIn('Schiena',selection_policy(self.ctx,narrow,2)['weekly_variants'])

    def test_long_break_retains_pending_groups_and_narrow_catalog_does_not_ban_only_possible_plan(self):
        self.history([self.session(['chest','plank'],days=40)],total=2)
        p=selection_policy(self.ctx,{id:self.catalog[id] for id in ('lat','plank')},2)
        self.assertEqual(p['cycle_session'],2)
        self.assertEqual(p['blocked_exercise_sets'],[])
        validate_selection([self.catalog['lat']],p)

    def test_finished_history_counts_only_saved_strength_and_reads_beyond_set_context_limit(self):
        con=self.f.core.db()
        con.execute('CREATE TABLE workout_finish(id INTEGER PRIMARY KEY,workout_id INTEGER,ts TEXT)')
        for wid,name,finished in [(1,'Chest press alla macchina',True),(2,'Lat machine al petto',False),(3,'Mobilità dinamica anche',True)]:
            con.execute('INSERT INTO workouts(id,ts,title) VALUES(?,?,?)',(wid,datetime.now().isoformat(),'Test'))
            con.execute('INSERT INTO sets(workout_id,exercise,set_no,reps) VALUES(?,?,1,10)',(wid,name))
            if finished:con.execute('INSERT INTO workout_finish(workout_id) VALUES(?)',(wid,))
        # A finished skipped/cardio-only workout has no performed strength sets.
        con.execute('INSERT INTO workouts(id,ts,title) VALUES(4,?,?)',(datetime.now().isoformat(),'Test'))
        con.execute('INSERT INTO workout_finish(workout_id) VALUES(4)')
        con.commit();h=finished_history(con,self.m.training_catalog())
        self.assertEqual(h['finished_strength_sessions'],1)
        self.assertEqual([s['workout_id'] for s in h['sessions']],[1])
        con.execute('DROP TABLE coach_program_state');init_program(con)
        self.assertEqual(finished_history(con,self.m.training_catalog())['program_finished_sessions'],0)
        con.execute('INSERT INTO workouts(id,ts,title) VALUES(5,?,?)',(datetime.now().isoformat(),'New split'))
        con.execute("INSERT INTO sets(workout_id,exercise,set_no,reps) VALUES(5,'Lat machine al petto',1,10)")
        con.execute('INSERT INTO workout_finish(workout_id) VALUES(5)');con.commit()
        init_program(con)  # Restart must not reset the baseline.
        h=finished_history(con,self.m.training_catalog());con.close()
        self.assertEqual(h['program_finished_sessions'],1)
        self.assertEqual(h['program_start_workout_id'],4)

    def test_recent_partial_work_affects_recovery_without_advancing_the_split(self):
        self.ctx['training']['set_history']=[{'workout_id':99,'exercise':self.catalog['lat']['name'],'ts':datetime.now().isoformat()}]
        p=selection_policy(self.ctx,self.candidates,5)
        self.assertEqual(p['cycle_session'],1)
        self.assertNotEqual(p['focus_options'][0]['id'],'back_shoulders')
        self.assertTrue(next(b for b in p['focus_options'] if b['id']=='back_shoulders')['recent_work_warning'])

    def test_model_repairs_duplicate_once_and_preview_never_saves_a_proposal(self):
        self.m.save_decision('gemini','train','First',{},[self.catalog['chest'],self.catalog['dumbbell_curl']])
        plans=[self.f.plan(self.ctx),self.f.plan(self.ctx,('lat','dumbbell_shoulder_press'))]
        for p in plans:p['data_used']=self.ctx['coverage']['sources']+['checkin']
        with patch.object(self.m,'request_ai',side_effect=[json.dumps(p) for p in plans]) as request:
            data=self.f.client.post('/api/ai-workout-01089',json={'preview':True,'exercise_count':2}).get_json()
        self.assertEqual(data['mode'],'gemini');self.assertTrue(data['preview'])
        self.assertEqual(request.call_count,2)
        self.assertLessEqual(request.call_args_list[1].kwargs['timeout'],request.call_args_list[0].kwargs['timeout'])
        con=self.f.core.db();self.assertEqual(con.execute('SELECT COUNT(*) FROM ai_workout_decisions').fetchone()[0],1);con.close()
        with patch.object(self.m,'request_ai',return_value=json.dumps(plans[0])) as request:
            data=self.f.client.post('/api/ai-workout-01089',json={'preview':True,'exercise_count':2}).get_json()
        self.assertEqual(data['mode'],'local_fallback');self.assertEqual(request.call_count,2)

    def test_general_assessment_is_required_and_recovery_does_not_advance_cycle(self):
        def missing(q,c,**kw):
            value=self.f.plan(c);value.pop('assessment');return json.dumps(value)
        with patch.object(self.m,'request_ai',missing):
            data=self.f.client.post('/api/ai-workout-01089',json={'preview':True,'exercise_count':2}).get_json()
        self.assertEqual(data['mode'],'local_fallback');self.assertIn('valutazione generale',data['reason'])
        def recovery(q,c,**kw):return json.dumps({'decision':'recovery','reason':'Recupero complessivo insufficiente','assessment':fixtures.ASSESSMENT,'data_used':c['coverage']['sources'],'items':[]})
        with patch.object(self.m,'request_ai',recovery):
            data=self.f.client.post('/api/ai-workout-01089',json={'preview':True,'exercise_count':5}).get_json()
        self.assertEqual(data['decision'],'recovery');self.assertEqual(data['plan'],[])
        self.assertEqual(data['selection_policy']['cycle_session'],1)

    def test_split_rejects_mixed_focus_and_adapts_to_an_exhausted_catalog(self):
        p=selection_policy(self.ctx,self.candidates,2)
        with self.assertRaises(SelectionError):validate_selection([self.catalog['lat'],self.catalog['chest']],p)
        narrow={'dumbbell_curl':self.catalog['dumbbell_curl']}
        p=selection_policy(self.ctx,narrow,5)
        self.assertEqual(p['focus_options'][0]['exercise_count'],1)
        validate_selection([self.catalog['dumbbell_curl']],p)

    def test_two_main_exercises_extend_the_block_and_pending_groups_are_completed_next(self):
        schedules=[['lat','dumbbell_shoulder_press'],['chest','dumbbell_curl'],
                   ['pushdown','single_arm_triceps_pushdown'],['goblet_squat','romanian_deadlift'],
                   ['bodyweight_glute_kickback','calf_raise']]
        sessions=[]
        for index,ids in enumerate(schedules):
            self.history(sessions)
            p=selection_policy(self.ctx,self.candidates,2)
            if index==2:
                self.assertEqual(p['carryover_focus_id'],'chest_arms')
                self.assertEqual(p['focus_options'][0]['groups'],['Tricipiti'])
                with self.assertRaises(SelectionError):validate_selection([self.catalog['goblet_squat'],self.catalog['romanian_deadlift']],p)
            if index==3:
                self.assertEqual(p['cycle_session'],4)
                self.assertEqual(set(p['missing_groups']),{'Gambe','Femorali','Glutei','Polpacci'})
            if index==4:self.assertEqual(p['focus_options'][0]['groups'],['Glutei','Polpacci'])
            validate_selection([self.catalog[id] for id in ids],p)
            sessions.insert(0,self.session(ids,days=2,wid=index+1))
        self.history(sessions);p=selection_policy(self.ctx,self.candidates,2)
        self.assertEqual((p['cycle_session'],p['block_number']),(1,2))

    def test_localized_pain_suspends_a_group_without_cancelling_coverage_debt(self):
        ids=['lat','dumbbell_shoulder_press','chest','dumbbell_curl','pushdown','goblet_squat','romanian_deadlift','calf_raise']
        self.history([self.session(ids,days=2)])
        p=selection_policy(self.ctx,self.m.allowed_candidates(self.ctx,'Fastidio gluteo destro'),2)
        self.assertIn('Glutei',p['suspended_groups']);self.assertEqual(p['block_number'],1)
        p=selection_policy(self.ctx,self.candidates,2)
        self.assertEqual(p['missing_groups'],['Glutei']);self.assertEqual(p['block_number'],1)
        available=self.m.allowed_candidates(self.ctx,'Fastidio bicipite destro')
        self.assertFalse(any(e['group']=='Bicipiti' for e in available.values()))
        self.assertTrue(any(e['group']=='Tricipiti' for e in available.values()))

    def test_core_is_added_after_two_main_exercises_and_fits_the_total_budget(self):
        with patch.object(self.m,'request_ai',lambda q,c,**kw:json.dumps(self.f.plan(c))):
            d=self.f.client.post('/api/ai-workout-01089',json={'preview':True,'exercise_count':2,'minutes':20}).get_json()
        self.assertEqual(d['mode'],'gemini',d)
        self.assertEqual(len([e for e in d['plan'] if not e.get('finisher')]),2)
        self.assertEqual(d['plan'][-1]['id'],'plank');self.assertTrue(d['plan'][-1]['finisher'])
        self.assertEqual(d['plan'][-1]['repType'],'seconds')
        self.assertLessEqual(self.m.plan_minutes(d['plan']),20)
        self.assertIsNone(self.m.core_finisher(self.ctx,'Normale','Nessuno',0,'plank'))
        with patch.object(self.m,'unified_context',return_value=self.f.bodyweight_context()):
            d=self.f.client.get('/api/bodyweight-progression-01099?pain=Nessuno%20').get_json()
        self.assertEqual(d['items']['heel_taps']['action'],'progress')
        self.ctx['exercise_catalog']=[{**e,'enabled':False} if e['group']=='Core' else e for e in self.ctx['exercise_catalog']]
        self.assertIsNone(self.m.core_finisher(self.ctx,'Normale','Nessuno',20))

    def test_partial_work_stays_pending_and_core_only_history_does_not_close_a_block(self):
        session=self.session(['chest','dumbbell_curl'],days=3)
        session['exercises'][0]['status']='Parziale'
        session['exercises'][1]['status']='Completato'
        self.history([session]);p=selection_policy(self.ctx,self.candidates,2)
        self.assertIn('Petto',p['missing_groups']);self.assertNotIn('Bicipiti',p['missing_groups'])
        self.assertEqual(p['block_number'],1)
        con=self.f.core.db()
        con.execute('CREATE TABLE workout_finish(id INTEGER PRIMARY KEY,workout_id INTEGER,ts TEXT)')
        con.execute('INSERT INTO workouts(id,ts,title) VALUES(99,?,?)',(datetime.now().isoformat(),'Core only'))
        con.execute("INSERT INTO sets(workout_id,exercise,set_no,reps) VALUES(99,'Plank',1,30)")
        con.execute('INSERT INTO workout_finish(workout_id) VALUES(99)');con.commit()
        self.assertEqual(finished_history(con,self.m.training_catalog())['program_finished_sessions'],0)
        con.close()

    def test_repeated_previews_cannot_make_a_small_pending_group_impossible(self):
        self.history([self.session(['chest','dumbbell_curl'],days=2)])
        # The three compatible triceps exercises give only three distinct pairs.
        ids=['pushdown','single_arm_triceps_pushdown','triceps_short_bar_pushdown']
        candidates={id:e for id,e in self.candidates.items() if e['group']!='Tricipiti' or id in ids}
        self.ctx['training']['previous_proposals_not_completed_workouts']=[{'ts':datetime.now().isoformat(),'mode':'gemini','decision':'train','plan':[self.catalog[id] for id in pair]} for pair in [(ids[0],ids[1]),(ids[0],ids[2]),(ids[1],ids[2])]]
        p=selection_policy(self.ctx,candidates,2)
        self.assertEqual(p['carryover_focus_id'],'chest_arms')
        validate_selection([self.catalog[id] for id in ids[:2]],p)


class StrengthProgressionTest(unittest.TestCase):
    setUp=CoachRotationTest.setUp
    tearDown=CoachRotationTest.tearDown
    def strength_context(self,id='chest',reps=10,weight=5,effort=2,hours=72,complete=True):
        ctx=copy.deepcopy(self.ctx);e=self.catalog[id];training=ctx['training']
        training['set_history']=[];training['exercise_outcomes']=[];training['effort_ratings']=[]
        for wid,age in [(2,hours),(1,hours+72)]:
            at=(datetime.now()-timedelta(hours=age)).isoformat()
            training['set_history'] += [dict(workout_id=wid,ts=at,exercise=e['name'],set_no=n,reps=reps,weight=weight,fatigue='Giusta',rest_sec=120) for n in (1,2,3)]
            training['exercise_outcomes'].append(dict(workout_id=wid,exercise=e['name'],status='Completato' if complete else 'Parziale'))
            training['effort_ratings'].append(dict(workout_id=wid,exercise_id=id,effort=effort))
        return ctx

    def test_two_easy_complete_sessions_progress_reps_then_load_without_adding_sets(self):
        ctx=self.strength_context();p=strength_progressions(ctx)['chest']
        self.assertEqual((p['target'],p['suggested_load'],p['rest'],p['action']),(11,5,120,'reps'))
        ctx=self.strength_context(reps=12);p=strength_progressions(ctx)['chest']
        self.assertEqual((p['target'],p['suggested_load'],p['action']),(8,6,'load'))
        value=self.f.plan(ctx,('chest','plank'));value['items'][0]['sets']=4
        plan=self.m.validate_plan(value,self.candidates,2,'Normale',30,ctx['coverage']['sources'],strength_targets=strength_progressions(ctx))
        self.assertEqual((plan[0]['sets'],plan[0]['reps'],plan[0]['rest'],plan[0]['suggested_load']),(3,8,120,6))

    def test_moderate_partial_short_recovery_and_mixed_weights_never_increase(self):
        for changes in ({'effort':3},{'complete':False},{'hours':24}):
            with self.subTest(changes=changes):self.assertEqual(strength_progressions(self.strength_context(**changes))['chest']['action'],'maintain')
        ctx=self.strength_context();ctx['training']['set_history'][0]['weight']=6
        self.assertEqual(strength_progressions(ctx)['chest']['action'],'maintain')

    def test_reducing_series_requires_low_energy_or_recorded_difficulty_not_an_old_date(self):
        ctx=self.strength_context(effort=3,hours=900);p=strength_progressions(ctx)['chest']
        self.assertEqual((p['target'],p['suggested_load'],p['series_floor'],p['reduction_allowed']),(10,5,3,False))
        value=self.f.plan(ctx,('chest','dumbbell_curl'));value['items'][0]['sets']=1
        plan=self.m.validate_plan(value,self.candidates,2,'Normale',45,ctx['coverage']['sources'],strength_targets=strength_progressions(ctx))
        self.assertEqual(plan[0]['sets'],3)
        for energy,effort in [('Bassa',3),('Normale',5)]:
            current=self.strength_context(effort=effort);targets=strength_progressions(current,energy)
            self.assertTrue(targets['chest']['reduction_allowed'])
            plan=self.m.validate_plan(value,self.candidates,2,energy,45,ctx['coverage']['sources'],strength_targets=targets)
            self.assertEqual(plan[0]['sets'],1)

    def test_partial_last_visit_does_not_lower_the_previous_complete_series_floor(self):
        ctx=self.strength_context(effort=3)
        ctx['training']['set_history']=[r for r in ctx['training']['set_history'] if r['workout_id']==1 or r['set_no']==1]
        ctx['training']['exercise_outcomes'][0]['status']='Parziale'
        p=strength_progressions(ctx)['chest']
        self.assertEqual((p['previous_sets'],p['series_floor'],p['reduction_allowed']),(1,3,False))

    def test_hard_work_reduces_target_and_adapts_rest_and_notes_win(self):
        ctx=self.strength_context(effort=5);p=strength_progressions(ctx)['chest']
        self.assertEqual((p['target'],p['suggested_load'],p['rest']),(9,4,135))
        ctx=self.strength_context(reps=12);ctx['coach_notes']={'exercise_preferences':{'chest':{'reps':20,'rest':75}}}
        p=strength_progressions(ctx)['chest'];self.assertEqual((p['action'],p['target'],p['rest'],p['suggested_load']),('user',20,75,5))

    def test_dumbbells_do_not_invent_discs_and_density_changes_only_after_consolidation(self):
        ctx=self.strength_context('dumbbell_curl',12,7.5)
        p=strength_progressions(ctx)['dumbbell_curl'];self.assertEqual((p['target'],p['suggested_load']),(13,7.5))
        older=dict(ctx['training']['set_history'][-1],workout_id=9,weight=8.5,ts=(datetime.now()-timedelta(days=30)).isoformat())
        ctx['training']['set_history'].append(older)
        p=strength_progressions(ctx)['dumbbell_curl'];self.assertEqual((p['target'],p['suggested_load']),(8,8.5))
        ctx=self.strength_context('dumbbell_curl',20,7.5)
        p=strength_progressions(ctx)['dumbbell_curl'];self.assertEqual((p['target'],p['rest'],p['action']),(20,105,'density'))
        for row in ctx['training']['set_history']:
            if row['workout_id']==1:row['rest_sec']=105
        self.assertEqual(strength_progressions(ctx)['dumbbell_curl']['action'],'maintain')
