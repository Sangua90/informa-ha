"""Durable unfinished workout sessions, independent of browser lifetime."""
from contextlib import closing
from datetime import datetime
import json
import re
import math
import coach_questions_01093 as base
import ai_training_01089 as training
import app as root

app=base.app
with closing(root.db()) as con:
    con.executescript('''CREATE TABLE IF NOT EXISTS workout_drafts(
        session_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,snapshot_json TEXT NOT NULL,
        workout_id INTEGER,state TEXT NOT NULL DEFAULT 'active',updated_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS workout_session_closed(session_id TEXT PRIMARY KEY,state TEXT NOT NULL,closed_at TEXT NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS one_active_workout_draft ON workout_drafts(state) WHERE state='active';''')
    con.commit()


def session_id(value):
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_-]{8,100}',value):raise ValueError('Identificativo seduta non valido')
    return value


def validate(snapshot):
    if not isinstance(snapshot,dict):raise ValueError('Seduta non valida')
    sid=session_id(snapshot.get('session_id'));plan=snapshot.get('plan')
    if not isinstance(plan,list) or not 0<=len(plan)<=60:raise ValueError('Piano della seduta non valido')
    ids=set()
    for ex in plan:
        if not isinstance(ex,dict) or not isinstance(ex.get('id'),str) or not re.fullmatch('[a-z0-9_]+',ex['id']) or ex['id'] in ids or not isinstance(ex.get('name'),str):raise ValueError('Esercizio della seduta non valido')
        ids.add(ex['id'])
        for key in ('sets','reps','seconds','rest','duration','minutes'):
            value=ex.get(key)
            if value is not None and (type(value) not in (int,float) or not math.isfinite(value) or not 0<=value<=3600):raise ValueError('Durata o serie non valide')
        if ex.get('sets') is not None and (ex['sets']!=int(ex['sets']) or not 1<=ex['sets']<=20):raise ValueError('Numero serie non valido')
        for key in ('name','guide','group','priority','loadType','repType'):
            value=ex.get(key)
            if value is not None and (not isinstance(value,str) or len(value)>300 or any(c in value for c in '<>"\'&')):raise ValueError('Descrizione esercizio non valida')
    if not isinstance(snapshot.get('flow',{}),dict):raise ValueError('Avanzamento non valido')
    if len(json.dumps(snapshot,allow_nan=False))>250000:raise ValueError('Seduta troppo grande')
    return sid


def bound_workout(con,sid,wid=None):
    # A set/cardio/archive may have committed even when its acknowledgement was lost.
    row=con.execute("SELECT workout_id FROM mutation_requests WHERE id GLOB ? AND workout_id IS NOT NULL ORDER BY rowid DESC LIMIT 1",(sid+':*',)).fetchone()
    return row['workout_id'] if row else wid


def close(con,sid,state):
    at=datetime.now().isoformat(timespec='seconds')
    con.execute('INSERT OR IGNORE INTO workout_session_closed(session_id,state,closed_at) VALUES(?,?,?)',(sid,state,at))
    state=con.execute('SELECT state FROM workout_session_closed WHERE session_id=?',(sid,)).fetchone()['state']
    con.execute('UPDATE workout_drafts SET state=?,updated_at=? WHERE session_id=?',(state,at,sid))


def reconcile(con,snapshot,wid):
    if not wid:return snapshot
    snapshot['workout_id']=wid;flow=snapshot.setdefault('flow',{});names=snapshot.get('names') or {}
    for ex in snapshot['plan']:names[ex['id']]=ex['name']
    saved={(r['exercise'],str(r['set_no'])):dict(r) for r in con.execute('SELECT exercise,set_no,weight,reps,rep_type FROM sets WHERE workout_id=?',(wid,))}
    for ex in snapshot['plan']:
        if ex.get('cardio') or ex.get('mobility') or ex.get('stretching'):continue
        state=flow.setdefault(ex['id'],{'stage':'planned','sets':{}});sets=state.setdefault('sets',{})
        for n in range(1,min(20,int(ex.get('sets') or 1))+1):
            row=saved.get((ex['name'],str(n)))
            if row:
                sets[str(n)]={'weight':'' if row['weight'] is None else str(row['weight']),'reps':str(row['reps']),'edited':True,'done':True}
                if state.get('stage')=='planned':state['stage']='started'
            elif str(n) in sets:sets[str(n)]['done']=False
    statuses={r['exercise']:r['status'] for r in con.execute('SELECT exercise,status FROM exercise_status WHERE workout_id=? ORDER BY id',(wid,))}
    for id,name in names.items():
        if name in statuses:flow[id]={**flow.get(id,{}),'stage':'archived','status':statuses[name]}
    return snapshot


@app.get('/api/workout-session')
def workout_session_get():
    sid=root.request.args.get('session_id')
    with closing(root.db()) as con:
        if sid:
            closed=con.execute('SELECT state FROM workout_session_closed WHERE session_id=?',(sid,)).fetchone()
            if closed:return root.jsonify(ok=True,session=None,state=closed['state'])
        row=con.execute("SELECT * FROM workout_drafts WHERE state='active' LIMIT 1").fetchone()
        if not row:return root.jsonify(ok=True,session=None)
        wid=bound_workout(con,row['session_id'],row['workout_id'])
        if wid and (not con.execute('SELECT 1 FROM workouts WHERE id=?',(wid,)).fetchone() or con.execute('SELECT 1 FROM workout_finish WHERE workout_id=?',(wid,)).fetchone()):
            close(con,row['session_id'],'saved');con.commit();return root.jsonify(ok=True,session=None,state='saved')
        snapshot=reconcile(con,json.loads(row['snapshot_json']),wid)
    return root.jsonify(ok=True,session=snapshot,revision=row['revision'])


@app.route('/api/workout-session',methods=['PUT','POST'])
def workout_session_save():
    x=root.request.get_json(silent=True)
    try:
        if not isinstance(x,dict) or type(x.get('revision')) is not int or x['revision']<0:raise ValueError('Versione seduta non valida')
        snapshot=x.get('snapshot');sid=validate(snapshot)
        wid=snapshot.get('workout_id')
        if wid is not None and (type(wid) is not int or wid<=0):raise ValueError('Allenamento non valido')
    except (ValueError,TypeError) as e:return root.jsonify(ok=False,error=str(e)),400
    with closing(root.db()) as con:
        con.execute('BEGIN IMMEDIATE')
        if con.execute('SELECT 1 FROM workout_session_closed WHERE session_id=?',(sid,)).fetchone():return root.jsonify(ok=False,error='Seduta già terminata'),410
        other=con.execute("SELECT session_id FROM workout_drafts WHERE state='active' AND session_id<>?",(sid,)).fetchone()
        if other:return root.jsonify(ok=False,error='Esiste una seduta da riprendere: completala o eliminala prima di prepararne un’altra'),409
        row=con.execute('SELECT * FROM workout_drafts WHERE session_id=?',(sid,)).fetchone()
        current=row['revision'] if row else 0
        if current!=x['revision']:
            if row and json.loads(row['snapshot_json'])==snapshot:return root.jsonify(ok=True,revision=current)
            return root.jsonify(ok=False,error='La seduta è stata aggiornata su un altro dispositivo. Ricarica la seduta salvata.'),409
        wid=bound_workout(con,sid,wid or (row['workout_id'] if row else None))
        if wid:
            if not con.execute('SELECT 1 FROM workouts WHERE id=?',(wid,)).fetchone():return root.jsonify(ok=False,error='Allenamento non trovato'),404
            if con.execute('SELECT 1 FROM workout_finish WHERE workout_id=?',(wid,)).fetchone():
                close(con,sid,'saved');con.commit();return root.jsonify(ok=False,error='Seduta già salvata'),410
        con.execute("INSERT INTO workout_drafts(session_id,revision,snapshot_json,workout_id,state,updated_at) VALUES(?,?,?,?,'active',?) ON CONFLICT(session_id) DO UPDATE SET revision=excluded.revision,snapshot_json=excluded.snapshot_json,workout_id=excluded.workout_id,updated_at=excluded.updated_at",(sid,current+1,json.dumps(snapshot,allow_nan=False),wid,datetime.now().isoformat(timespec='seconds')))
        con.commit()
    return root.jsonify(ok=True,revision=current+1)


@app.post('/api/workout-session/<sid>/close')
def workout_session_close(sid):
    try:session_id(sid)
    except ValueError as e:return root.jsonify(ok=False,error=str(e)),400
    x=root.request.get_json(silent=True) or {}
    if not isinstance(x,dict) or x.get('state') not in ('saved','discarded'):return root.jsonify(ok=False,error='Chiusura non valida'),400
    with closing(root.db()) as con:
        row=con.execute('SELECT workout_id FROM workout_drafts WHERE session_id=?',(sid,)).fetchone()
        wid=bound_workout(con,sid,row['workout_id'] if row else None)
    if x['state']=='discarded' and wid:
        # The last set may have committed while its response was lost on close.
        with closing(root.db()) as con:exists=con.execute('SELECT 1 FROM workouts WHERE id=?',(wid,)).fetchone()
        if exists:
            result=delete_workout_session(wid,session_to_discard=sid)
            if isinstance(result,tuple) or result.status_code>=300:return result
            if result.get_json().get('state')=='saved':return result
    with closing(root.db()) as con:close(con,sid,x['state']);con.commit()
    return root.jsonify(ok=True)


_finish=app.view_functions['coach_finish']
def finish_session():
    x=root.request.get_json(silent=True) or {};result=_finish()
    if not isinstance(result,tuple) and result.status_code<300:
        with closing(root.db()) as con:
            ids=[r['session_id'] for r in con.execute('SELECT session_id FROM workout_drafts WHERE workout_id=?',(x.get('workout_id'),))]
            if isinstance(x.get('session_id'),str):ids.append(x['session_id'])
            for sid in set(ids):close(con,sid,'saved')
            con.commit()
    return result
app.view_functions['coach_finish']=finish_session


def delete_workout_session(workout_id,session_to_discard=None):
    if session_to_discard is None:session_to_discard=root.request.args.get('session_id')
    if session_to_discard:
        try:session_id(session_to_discard)
        except ValueError as e:return root.jsonify(ok=False,error=str(e)),400
    with closing(root.db()) as con:
        con.execute('BEGIN IMMEDIATE')
        if session_to_discard:
            marker=con.execute('SELECT state FROM workout_session_closed WHERE session_id=?',(session_to_discard,)).fetchone()
            if marker and marker['state']=='saved' or con.execute('SELECT 1 FROM workout_finish WHERE workout_id=?',(workout_id,)).fetchone():
                close(con,session_to_discard,'saved');con.commit();return root.jsonify(ok=True,state='saved')
        if not con.execute('SELECT 1 FROM workouts WHERE id=?',(workout_id,)).fetchone():return root.jsonify(ok=False,error='Allenamento non trovato'),404
        for row in con.execute("SELECT session_id,workout_id FROM workout_drafts WHERE state='active'").fetchall():
            if bound_workout(con,row['session_id'],row['workout_id'])==workout_id:close(con,row['session_id'],'discarded')
        deleted={}
        for row in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall():
            table=row[0]
            if table=='workouts':continue
            if 'workout_id' not in {r[1] for r in con.execute(f'PRAGMA table_info("{table}")')}:continue
            count=con.execute(f'DELETE FROM "{table}" WHERE workout_id=?',(workout_id,)).rowcount
            if count:deleted[table]=count
        con.execute('DELETE FROM workouts WHERE id=?',(workout_id,));con.commit()
    return root.jsonify(ok=True,deleted_workout=workout_id,related_deleted=deleted)
app.view_functions['workout_delete_0933']=delete_workout_session

# Chat, connection test and workout generation share the same bounded retry transport.
training.config._gemini_request_092=training.request_ai
training.context93._gemini_request_093=training.request_ai


def ai_connection_test_01098():
    cfg=training.config._ai_config_092()
    if cfg['provider']=='none':return root.jsonify(ok=True,provider='none',connected=True,message='Coach locale attivo')
    try:
        schema={'type':'object','properties':{'connection':{'type':'string','enum':['ok']}},'required':['connection'],'additionalProperties':False}
        answer=training.request_ai('Esegui un test di connessione senza dati personali. Restituisci soltanto un oggetto JSON con connection uguale a ok.',{'training':{},'nutrition':{},'supplements':{}},timeout=20,schema=schema)
        if json.loads(answer)!={'connection':'ok'}:raise RuntimeError('Gemini non ha restituito il formato richiesto')
        return root.jsonify(ok=True,provider='gemini',model=cfg['model'],connected=True,message='Connessione Gemini attiva.',connection={**training.request_info(),'structured_output':True})
    except Exception as error:
        message=str(error) if isinstance(error,RuntimeError) else 'Risposta Gemini non utilizzabile'
        return root.jsonify(ok=False,provider='gemini',model=cfg['model'],connected=False,error=message,connection=training.request_info()),502
app.view_functions['ai_test_091']=ai_connection_test_01098
