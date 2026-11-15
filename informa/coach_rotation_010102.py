"""Coverage-driven blocks and weekly variation from canonical completed work."""
from datetime import datetime
from math import ceil, comb


GROUPS = ('Petto','Schiena','Gambe','Femorali','Spalle','Glutei','Tricipiti','Bicipiti','Polpacci')
BLOCKS = (('back_shoulders','Schiena e spalle',('Schiena','Spalle')),
          ('chest_arms','Petto e braccia',('Petto','Bicipiti','Tricipiti')),
          ('lower','Gambe e parte inferiore',('Gambe','Femorali','Glutei','Polpacci')))


def init_program(con):
    con.execute('CREATE TABLE IF NOT EXISTS coach_program_state(key TEXT PRIMARY KEY,value INTEGER NOT NULL)')
    # Start the new split with the NEXT session. Old full-body workouts remain
    # useful for recovery and progression but cannot form two thirds of a split.
    latest=con.execute('SELECT COALESCE(MAX(id),0) FROM workouts').fetchone()[0]
    con.execute("INSERT OR IGNORE INTO coach_program_state(key,value) VALUES('split_010102_start',?)",(latest,))
    con.commit()


def key(value):
    return ' '.join(str(value or '').casefold().split())


def age_hours(ts, now=None):
    try:
        at = datetime.fromisoformat(str(ts).replace('Z','+00:00'))
        now = now or datetime.now().astimezone()
        if at.tzinfo is None: at = at.replace(tzinfo=now.tzinfo)
        return (now-at).total_seconds()/3600
    except (ValueError,TypeError):
        return None


def finished_history(con, catalog):
    """Do not count proposals, skips, cardio or unfinished drafts as sessions."""
    if not con.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='workout_finish'").fetchone():
        return {'finished_strength_sessions':0,'sessions':[]}
    names = [e['name'].lower() for e in catalog if e['group'] in GROUPS]
    marks = ','.join('?' for _ in names)
    sql = f'''SELECT w.id,w.ts FROM workouts w
        WHERE EXISTS(SELECT 1 FROM workout_finish f WHERE f.workout_id=w.id)
        AND EXISTS(SELECT 1 FROM sets s WHERE s.workout_id=w.id AND s.reps>0
                   AND lower(trim(s.exercise)) IN ({marks}))'''
    all_sessions=list(con.execute(sql+' ORDER BY w.ts DESC,w.id DESC',names))
    total=len(all_sessions)
    state=con.execute("SELECT value FROM coach_program_state WHERE key='split_010102_start'").fetchone() if con.execute("SELECT 1 FROM sqlite_master WHERE name='coach_program_state'").fetchone() else None
    start=state[0] if state else 0
    program=[w for w in all_sessions if w['id']>start]
    program_total=len(program);run=program_total
    for n,w in enumerate(program[:-1]):
        earlier=age_hours(program[n+1]['ts']);later=age_hours(w['ts'])
        if earlier is not None and later is not None and earlier-later>28*24:run=n+1;break
    sessions = []
    statuses={}
    if con.execute("SELECT 1 FROM sqlite_master WHERE name='exercise_status'").fetchone():
        for r in con.execute('SELECT workout_id,exercise,status FROM exercise_status ORDER BY id DESC'):
            statuses.setdefault((r['workout_id'],key(r['exercise'])),r['status'])
    for w in all_sessions[:30]:
        exercises = [dict(r) for r in con.execute('''SELECT exercise,COUNT(DISTINCT set_no) sets
            FROM sets WHERE workout_id=? AND reps>0 GROUP BY exercise''',(w['id'],))]
        for ex in exercises:ex['status']=statuses.get((w['id'],key(ex['exercise'])))
        sessions.append({'workout_id':w['id'],'ts':w['ts'],'exercises':exercises})
    # Keep lightweight coverage for ALL finished program sessions. A bounded
    # recent history must not lose an older group when a block spans many visits.
    catalog_by_name={key(e['name']):e for e in catalog if e['group'] in GROUPS}
    coverage={w['id']:set() for w in program}
    performed={w['id']:set() for w in program}
    for row in con.execute('''SELECT DISTINCT s.workout_id,s.exercise FROM sets s JOIN workouts w ON w.id=s.workout_id
        WHERE w.id>? AND s.reps>0 AND EXISTS(SELECT 1 FROM workout_finish f WHERE f.workout_id=w.id)''',(start,)):
        ex=catalog_by_name.get(key(row['exercise']))
        if ex and row['workout_id'] in coverage:
            performed[row['workout_id']].add(ex['group'])
            if statuses.get((row['workout_id'],key(row['exercise'])))=='Completato':coverage[row['workout_id']].add(ex['group'])
    coverage_sessions=[{'workout_id':w['id'],'ts':w['ts'],'groups':sorted(coverage[w['id']]),'performed_groups':sorted(performed[w['id']])} for w in reversed(program)]
    return {'finished_strength_sessions':total,'program_finished_sessions':program_total,'program_run_sessions':run,'program_start_workout_id':start,'coverage_sessions':coverage_sessions,'sessions':sessions}


def selection_policy(ctx, candidates, count):
    candidates={id:e for id,e in candidates.items() if e['group'] in GROUPS}
    training = ctx.get('training',{})
    history = training.get('rotation_history',{})
    sessions = history.get('sessions',[])
    catalog = {key(e['name']):e for e in ctx.get('exercise_catalog',[]) if e['group'] in GROUPS}
    by_group = {g:[e['id'] for e in candidates.values() if e['group']==g] for g in GROUPS}
    available = [g for g in GROUPS if by_group[g]]
    # Coverage, not a modulo-three counter, closes a block. Deferred groups
    # survive low exercise counts, skipped work, long breaks and restarts.
    program_sessions=[s for s in sessions if s['workout_id']>history.get('program_start_workout_id',0)]
    evidence=history.get('coverage_sessions')
    if evidence is None:
        evidence=[{'workout_id':s['workout_id'],'ts':s['ts'],'groups':sorted({catalog[key(x['exercise'])]['group'] for x in s['exercises'] if key(x['exercise']) in catalog and x.get('status','Completato')=='Completato'}),'performed_groups':sorted({catalog[key(x['exercise'])]['group'] for x in s['exercises'] if key(x['exercise']) in catalog})} for s in reversed(program_sessions)]
    # Count against every enabled group, even when pain temporarily removes its
    # candidates. Pain must suspend work without resetting or cancelling its debt.
    target={e['group'] for e in ctx.get('exercise_catalog',[]) if e['group'] in GROUPS and e.get('enabled',True)}
    covered=set();completed=0;block_number=1;last_groups=set()
    for visit in evidence:
        groups=set(visit['groups'])&target
        covered.update(groups);completed+=1;last_groups=set(visit.get('performed_groups',groups))&target
        if target and target<=covered:
            covered=set();completed=0;block_number+=1;last_groups=set()
    missing=[g for g in available if g not in covered]
    suspended=sorted(target-set(available)-covered)
    remaining=max(1,3-completed)
    quota=min(count,ceil(len(missing)/remaining))
    shortfall=max(0,len(missing)-count*remaining)
    carry=next((id for id,_,groups in BLOCKS if last_groups and last_groups<=set(groups) and any(g in missing for g in groups)),None)
    options=[]
    for id,label,groups in BLOCKS:
        enabled=[g for g in groups if g in available]
        due=[g for g in enabled if g not in covered]
        if id==carry:enabled=due
        if not due:continue
        ages=[]
        for g in enabled:
            exposures=[age_hours(s.get('ts')) for s in sessions if any(key(x['exercise']) in catalog and catalog[key(x['exercise'])]['group']==g for x in s['exercises'])]
            exposures += [age_hours(r.get('ts')) for r in training.get('set_history',[]) if key(r.get('exercise')) in catalog and catalog[key(r['exercise'])]['group']==g]
            ages.append(min([h for h in exposures if h is not None and h>=0],default=24*365))
        options.append({'id':id,'label':label,'groups':enabled,'missing_groups':due,
                        'exercise_count':min(count,sum(len(by_group[g]) for g in enabled)),
                        'required_new_groups':min(count,len(due)),
                        'hours_since_latest_work':round(min(ages),1),
                        'recent_work_warning':min(ages)<48,
                        'recovery_priority':round(sum(min(h,168) for h in ages)/len(ages),1)})
    options.sort(key=lambda b:(b['recent_work_warning'],b['id']!=carry,-b['recovery_priority'],-len(b['missing_groups'])))
    extra_sessions=max(0,len(options)-remaining)
    shortfall=max(shortfall,extra_sessions,max((len(b['missing_groups'])-count for b in options),default=0))
    # Completed work drives recovery/coverage. These are proposal-only duplicate
    # guards: they never contribute any muscle work or advance the cycle.
    duplicate_sets = []
    for s in sessions[:1]:
        h=age_hours(s.get('ts'))
        if h is not None and 0<=h<=7*24:
            ids=sorted({catalog[key(x['exercise'])]['id'] for x in s['exercises'] if key(x['exercise']) in catalog})
            if ids:duplicate_sets.append(ids)
    for p in training.get('previous_proposals_not_completed_workouts',[])[:3]:
        h=age_hours(p.get('ts'))
        if p.get('mode')=='gemini' and p.get('decision')=='train' and h is not None and 0<=h<=7*24:
            original=[e for e in p.get('plan') or [] if isinstance(e,dict) and not e.get('finisher') and e.get('group')!='Core']
            ids=sorted({e.get('id') for e in original if e.get('id') in candidates})
            # A changed exclusion list must not turn a different old plan into a duplicate.
            if len(ids)==len(original):duplicate_sets.append(ids)
    blocked=sorted({tuple(ids) for ids in duplicate_sets if len(ids)==min(count,len(candidates)) and set(ids)<=set(candidates)})
    if len(candidates)<=count or len(blocked)>=comb(len(candidates),min(count,len(candidates))):blocked=[]
    # A small carried-over group may have exhausted every possible combination.
    # Do not make its debt impossible to complete merely by regenerating previews.
    for focus in options:
        pool={id for id,e in candidates.items() if e['group'] in focus['groups']}
        size=focus['exercise_count']
        local=[ids for ids in blocked if len(ids)==size and set(ids)<=pool]
        if pool and len(local)>=comb(len(pool),size):blocked=[ids for ids in blocked if ids not in local]
    # Keep an exercise long enough to compare performance, then offer another
    # compatible variant after repeated exposures spanning at least a week.
    variation_due = {}
    for g in available:
        exposures=[]
        for s in sessions:
            h=age_hours(s.get('ts'))
            if h is None or not 0<=h<=28*24:continue
            ids={catalog[key(x['exercise'])]['id'] for x in s['exercises'] if key(x['exercise']) in catalog and catalog[key(x['exercise'])]['group']==g}
            if ids:exposures.append((ids,h))
        if len(exposures)>=2 and exposures[1][1]>=7*24:
            repeated=exposures[0][0]&exposures[1][0]&set(by_group[g])
            alternatives=set(by_group[g])-repeated
            if repeated and alternatives:variation_due[g]=sorted(alternatives)
    return {'cycle_session':completed+1,'cycle_length':3,'block_number':block_number,'completion_rule':'all_available_groups','carryover_focus_id':carry,'suspended_groups':suspended,'covered_groups':sorted(covered),
            'missing_groups':missing,'required_new_groups':quota,'available_groups':available,
            'unavailable_groups':[g for g in GROUPS if g not in available],
            'remaining_sessions':remaining,'coverage_shortfall':shortfall,
            'minimum_exercises_for_coverage':max((len(b['missing_groups']) for b in options),default=0),
            'extra_sessions_needed':extra_sessions,'focus_options':options,
            'blocked_exercise_sets':[list(ids) for ids in blocked],
            'weekly_variants':variation_due,
            'meaning':'Copertura dei gruppi principali da esercizi canonici completati in sedute terminate. Il lavoro parziale conta per recupero e progressione, ma resta da completare. Core finale, proposte, cardio e salti non coprono gruppi principali. Il blocco prosegue finché tutti i gruppi disponibili sono coperti; i fastidi sospendono senza cancellare. Non certifica recupero fisiologico.'}


class SelectionError(ValueError):
    pass


def validate_selection(plan, policy):
    groups={e['group'] for e in plan}
    options=policy.get('focus_options',[])
    pending=next((b for b in options if b['id']==policy.get('carryover_focus_id') and not b['recent_work_warning']),None)
    if pending and not groups<=set(pending['groups']):raise SelectionError('Prima completa i gruppi rinviati del focus '+pending['label']+': '+', '.join(pending['missing_groups']))
    focus=next((b for b in options if groups<=set(b['groups']) and len(groups&set(b['missing_groups']))>=b['required_new_groups']),None)
    if not focus:
        raise SelectionError('Scegli un solo focus disponibile e copri i suoi gruppi mancanti: '+str([{'id':b['id'],'groups':b['groups'],'required_new_groups':b['required_new_groups']} for b in options]))
    if len(plan)!=focus['exercise_count']:raise SelectionError('Numero di esercizi del focus non valido: servono '+str(focus['exercise_count']))
    if sorted(e['id'] for e in plan) in policy['blocked_exercise_sets']:
        raise SelectionError('Scheda identica a una seduta/proposta recente: cambia gli esercizi mantenendo la copertura dei muscoli')
    for group, alternatives in policy['weekly_variants'].items():
        if group in groups and not any(e['id'] in alternatives for e in plan):
            raise SelectionError('Variazione settimanale per '+group+': scegli una variante disponibile tra '+', '.join(alternatives))
    return focus
