"""Bounded next-session targets; never rewrite an open workout."""
from coach_rotation_010102 import age_hours, key


def strength_progressions(ctx, energy='Normale', pain='Nessuno'):
    training=ctx.get('training',{});result={}
    outcomes={}
    for r in training.get('exercise_outcomes',[]):
        outcomes.setdefault((r['workout_id'],key(r['exercise'])),r['status'])
    for e in ctx.get('exercise_catalog',[]):
        if e.get('loadType') not in ('plates','kg'):continue
        rows=[r for r in training.get('set_history',[]) if key(r.get('exercise'))==key(e['name']) and r.get('workout_id') and type(r.get('reps')) in (int,float) and 1<=r['reps']<=50 and type(r.get('weight')) in (int,float) and r['weight']>=0]
        sessions={}
        for r in sorted(rows,key=lambda r:age_hours(r.get('ts')) if age_hours(r.get('ts')) is not None else float('inf')):
            sessions.setdefault(r['workout_id'],[]).append(r)
        latest=list(sessions.items())[:2]
        reps=10;rest=120 if e['group'] in ('Gambe','Femorali','Petto','Schiena') else 90
        load=None;action='initial';policy='maintain';previous_sets=None
        base_reps=reps;base_rest=rest
        reason='Nessuno storico utile: base di 10 ripetizioni. Conferma il carico prima di iniziare.'
        if latest:
            wid,last=latest[0];load=last[0]['weight'];reps=max(5,min(20,int(min(r['reps'] for r in last))))
            rests=[r.get('rest_sec') for r in last if type(r.get('rest_sec')) in (int,float) and 30<=r['rest_sec']<=180]
            if rests:rest=int(max(rests))
            base_reps=reps;base_rest=rest
            previous_sets=len({r.get('set_no') for r in last if r.get('set_no') is not None})
            hours=age_hours(last[0].get('ts'))
            def effort(wid, items):
                rating=next((r.get('effort') for r in training.get('effort_ratings',[]) if r.get('workout_id')==wid and r.get('exercise_id')==e['id']),None)
                hard=rating in (4,5) or any(r.get('fatigue') in ('Dura','Al limite') for r in items)
                easy=rating in (1,2) if rating in (1,2,3,4,5) else all(r.get('fatigue')=='Facile' for r in items)
                return hard,easy and not hard
            hard,_=effort(wid,last);action='maintain'
            reason='Consolida il livello registrato: servono due sedute complete e facili allo stesso carico e target prima di aumentare.'
            if hard or hours is not None and hours>28*24 or energy=='Bassa':
                action='reduce';policy='reduce';reps=max(5,reps-1);rest=min(180,rest+15)
                lower=sorted({r['weight'] for r in rows if r['weight']<load},reverse=True)
                load=max(1,round(load)-1) if e['loadType']=='plates' else next(iter(lower),load)
                reason='Sforzo alto, energia bassa o lunga interruzione: riduco il target e aggiungo 15 s di recupero, entro 180 s. Conferma il carico proposto.'
            elif len(latest)==2 and hours is not None and 48<=hours<=28*24 and pain in ('Nessuno','',None):
                comparable=all(len({r.get('set_no') for r in rs if r.get('set_no') is not None})>=2 and outcomes.get((w,key(e['name'])))=='Completato' and effort(w,rs)[1] and len({r['reps'] for r in rs})==1 and len({r['weight'] for r in rs})==1 and (h:=age_hours(rs[0].get('ts'))) is not None and 0<=h<=28*24 for w,rs in latest)
                same=comparable and latest[1][1][0]['weight']==load and latest[1][1][0]['reps']==last[0]['reps']
                if same:
                    higher=min((r['weight'] for r in rows if load<r['weight']<=load+2),default=None)
                    if reps>=12 and (e['loadType']=='plates' or higher is not None):
                        load=max(1,round(load))+1 if e['loadType']=='plates' else higher
                        reps=8;action='load';policy='progress'
                        reason='Due sedute complete e facili ad almeno 12 ripetizioni: propongo il carico successivo e riparto da 8 ripetizioni. Conferma che sia disponibile; per i manubri uso solo carichi già registrati, sempre dischi su un manubrio.'
                    elif reps<20:
                        reps+=1;action='reps'
                        reason='Due sedute complete e facili allo stesso livello: +1 ripetizione per serie, mantenendo carico e recupero. Non aumento anche le serie.'
                    else:
                        minimum=90 if e['group'] in ('Gambe','Femorali','Petto','Schiena') else 60
                        previous_rest=latest[1][1][0].get('rest_sec')
                        if rest>minimum and previous_rest==rest:
                            rest=max(minimum,rest-15);action='density'
                            reason='Target consolidato e nessun carico superiore noto: mantengo carico e ripetizioni, riduco soltanto il recupero di 15 s entro il minimo prudente.'
                        else:reason='Target consolidato: mantengo. Per aumentare i kg servono carichi disponibili confermati; puoi registrarli con i controlli del peso.'
        custom=(ctx.get('coach_notes') or {}).get('exercise_preferences',{}).get(e['id'],{})
        # Explicit target/series notes take precedence; do not pair them with an
        # automatic simultaneous weight increase or density change.
        if custom:
            if action=='load':load=latest[0][1][0]['weight'];policy='maintain'
            reps=custom.get('reps',base_reps)
            rest=custom.get('rest',base_rest)
            action='user';reason='Applico le indicazioni numeriche salvate nelle Note per il Coach; i carichi restano confermabili.'
        result[e['id']]={'target':reps,'rest':rest,'suggested_load':load,'load_policy':policy,'action':action,'previous_sets':previous_sets,'reason':reason}
    return result
