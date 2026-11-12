"""Final write contracts: finite values, session identity and atomic confirmations."""
import json
import math
from datetime import datetime
import ai_training_01089 as base
import app as root

app = base.app


def init_audit_db():
    con = root.db()
    con.execute('CREATE TABLE IF NOT EXISTS mutation_requests(id TEXT PRIMARY KEY,kind TEXT NOT NULL,workout_id INTEGER,result_json TEXT NOT NULL)')
    for table, column, kind in [('workout_finish','effort','INTEGER'),('treadmill_sessions','workout_id','INTEGER')]:
        if column not in {r[1] for r in con.execute(f'PRAGMA table_info({table})')}:
            con.execute(f'ALTER TABLE {table} ADD COLUMN {column} {kind}')
    con.commit();con.close()


init_audit_db()


def numeric(value, key, *, minimum=0, positive=False, whole=False):
    if isinstance(value, bool) or not isinstance(value, (int,float,str)):
        raise ValueError('Valore non valido: '+key)
    try:
        result = float(value.replace(',','.') if isinstance(value,str) else value)
    except (TypeError,ValueError):
        raise ValueError('Valore non valido: '+key)
    if not math.isfinite(result) or result < minimum or positive and result == 0 or whole and (result != int(result) or result > 2147483647):
        raise ValueError('Valore non valido: '+key)
    return int(result) if whole else result


@app.before_request
def validate_writes_01091():
    p = root.request.path
    if root.request.method not in ('POST','PUT') or not p.startswith('/api/') or root.request.files:
        return
    rules = {
        '/api/set': ('weight','reps','set_no','rest_sec'),
        '/api/cardio': ('duration_min','avg_hr','max_hr','calories'),
        '/api/nutrition/water': ('ml',),
        '/api/nutrition/entry': ('quantity_g','calories','protein_g','carbs_g','fat_g','fiber_g','water_ml'),
        '/api/nutrition/goals': ('calories','protein_g','carbs_g','fat_g','fiber_g','water_ml'),
        '/api/measurement': ('weight_kg','waist_cm','chest_cm','arm_r_cm','arm_l_cm','thigh_r_cm','thigh_l_cm'),
        '/api/measurements-0978': ('weight_kg','waist_cm','chest_cm','arm_r_cm','arm_l_cm','thigh_r_cm','thigh_l_cm','height_cm','hip_cm','calf_cm'),
        '/api/treadmill-0970': ('duration_min','avg_speed_kmh','max_speed_kmh','avg_incline_pct','max_incline_pct'),
        '/api/coach/finish': ('duration_min',),
        '/api/exercise-effort-01089': ('effort',),
        '/api/workout-flow-0949/archive': ('workout_id',),
    }
    if p.startswith('/api/nutrition/entry/') and p.endswith('/update'):
        fields = rules['/api/nutrition/entry']
    else:
        fields = rules.get(p, ())
    if not fields and not p.startswith('/api/exercise-availability-01087/'):
        return
    # Several legacy handlers assume objects. Reject arrays/scalars before they can write.
    x = root.request.get_json(silent=True)
    if not isinstance(x,dict):
        return root.jsonify(ok=False,error='Richiesta JSON non valida'),400
    try:
        for key in fields:
            if key not in x:continue
            if x.get(key) in (None,''):
                x[key] = None
                continue
            measurement = p in ('/api/measurement','/api/measurements-0978')
            x[key] = numeric(x[key],key,positive=measurement or key in ('reps','set_no','duration_min','ml'),whole=key in ('reps','set_no','rest_sec'))
        for key in ({'/api/set':('reps','set_no'),'/api/cardio':('duration_min',),'/api/treadmill-0970':('duration_min',),'/api/nutrition/water':('ml',),'/api/coach/finish':('duration_min',)}.get(p,())):
            if x.get(key) is None:raise ValueError('Valore mancante: '+key)
        if p in ('/api/measurement','/api/measurements-0978') and not any(x.get(k) is not None for k in fields):
            raise ValueError('Inserisci almeno una misura')
        if p in ('/api/set','/api/nutrition/entry'):
            name=x.get('exercise' if p=='/api/set' else 'name')
            if not isinstance(name,str) or not name.strip():raise ValueError('Nome mancante')
        if p=='/api/set' and x.get('rep_type','reps') not in ('reps','seconds'):
            raise ValueError('Unità serie non valida')
        if x.get('request_id') is not None and (not isinstance(x['request_id'],str) or not 1<=len(x['request_id'])<=160):
            raise ValueError('Identificativo richiesta non valido')
        if x.get('workout_id') is not None:
            x['workout_id'] = numeric(x['workout_id'],'workout_id',positive=True,whole=True)
            con=root.db();exists=con.execute('SELECT 1 FROM workouts WHERE id=?',(x['workout_id'],)).fetchone()
            closed=p in ('/api/cardio','/api/workout-flow-0949/archive') and con.execute('SELECT 1 FROM workout_finish WHERE workout_id=?',(x['workout_id'],)).fetchone()
            con.close()
            if not exists:return root.jsonify(ok=False,error='Allenamento non trovato'),404
            if closed:return root.jsonify(ok=False,error='Seduta già chiusa: prepara un nuovo allenamento'),409
    except ValueError as e:
        return root.jsonify(ok=False,error=str(e)),400


def cached(con, x, kind):
    if not x.get('request_id'):return None
    row=con.execute('SELECT kind,result_json FROM mutation_requests WHERE id=?',(x['request_id'],)).fetchone()
    if row and row['kind']!=kind:raise ValueError('Identificativo richiesta già utilizzato')
    return json.loads(row['result_json']) if row else None


def remember(con,x,kind,result):
    if x.get('request_id'):
        con.execute('INSERT INTO mutation_requests(id,kind,workout_id,result_json) VALUES(?,?,?,?)',(x['request_id'],kind,result.get('workout_id'),json.dumps(result)))


def workout(con,x):
    wid=x.get('workout_id')
    if wid:
        if not con.execute('SELECT 1 FROM workouts WHERE id=?',(wid,)).fetchone():
            raise ValueError('Allenamento non trovato')
        if con.execute('SELECT 1 FROM workout_finish WHERE workout_id=?',(wid,)).fetchone():
            raise ValueError('Seduta già chiusa: prepara un nuovo allenamento')
        return wid
    return con.execute('INSERT INTO workouts(ts,title) VALUES(?,?)',(datetime.now().isoformat(timespec='seconds'),x.get('workout_title') or 'Seduta adattata')).lastrowid


def save_set_01091():
    x=root.request.get_json();con=root.db()
    try:
        con.execute('BEGIN IMMEDIATE')
        out=cached(con,x,'set')
        if not out:
            wid=workout(con,x)
            con.execute('INSERT INTO sets(workout_id,exercise,set_no,weight,reps,fatigue,rest_sec,rep_type) VALUES(?,?,?,?,?,?,?,?)',(wid,x['exercise'],x['set_no'],x.get('weight'),x['reps'],x.get('fatigue'),x.get('rest_sec') if x.get('rest_sec') is not None else 90,x.get('rep_type','reps')))
            out={'ok':True,'workout_id':wid,'saved_set':{k:x.get(k) for k in ('weight','reps','set_no')}}
            out['saved_set']['rep_type']=x.get('rep_type','reps');remember(con,x,'set',out)
        elif 'saved_set' not in out:
            # Requests saved by 0.10.91 did not include the persisted series values.
            row=con.execute('SELECT weight,reps,set_no,rep_type FROM sets WHERE workout_id=? AND exercise=? AND set_no=? ORDER BY id DESC LIMIT 1',(out['workout_id'],x['exercise'],x['set_no'])).fetchone()
            if row:out['saved_set']=dict(row)
        con.commit();return root.jsonify(out)
    except ValueError as e:
        con.rollback();return root.jsonify(ok=False,error=str(e)),409
    finally:con.close()


def archive_01092():
    x=root.request.get_json();name=x.get('exercise');status=x.get('status')
    if not isinstance(name,str) or not name.strip() or status not in ('Completato','Parziale','Saltato'):
        return root.jsonify(ok=False,error='Esercizio o stato non valido'),400
    name=name.strip();con=root.db()
    try:
        con.execute('BEGIN IMMEDIATE');out=cached(con,x,'archive')
        if not out:
            wid=workout(con,x)
            previous=con.execute('SELECT status FROM exercise_status WHERE workout_id=? AND exercise=? ORDER BY id DESC LIMIT 1',(wid,name)).fetchone()
            if previous and previous['status']!=status:
                raise ValueError('Esercizio già archiviato: lo stato salvato resta invariato')
            if not previous:
                con.execute('INSERT INTO exercise_status(ts,workout_id,exercise,priority,status,notes) VALUES(?,?,?,?,?,?)',(datetime.now().isoformat(timespec='seconds'),wid,name,x.get('priority'),status,x.get('notes')))
            out={'ok':True,'workout_id':wid,'exercise':name,'status':status,'mode':'existing' if previous else 'inserted'}
            remember(con,x,'archive',out)
        con.commit();return root.jsonify(out)
    except ValueError as e:
        con.rollback();return root.jsonify(ok=False,error=str(e)),409
    finally:con.close()


def treadmill_save_01091():
    x=root.request.get_json();con=root.db()
    try:
        con.execute('BEGIN IMMEDIATE');out=cached(con,x,'treadmill')
        if not out:
            wid=workout(con,x) if x.get('save_cardio') is True else None
            now=datetime.now().isoformat(timespec='seconds')
            con.execute('INSERT INTO treadmill_sessions(ts,duration_min,avg_speed_kmh,max_speed_kmh,avg_incline_pct,max_incline_pct,fatigue,phases_json,workout_id) VALUES(?,?,?,?,?,?,?,?,?)',(now,x['duration_min'],x.get('avg_speed_kmh'),x.get('max_speed_kmh'),x.get('avg_incline_pct'),x.get('max_incline_pct'),x.get('fatigue'),json.dumps(x.get('phases') or [],allow_nan=False),wid))
            if wid:
                con.execute('INSERT INTO cardio(workout_id,ts,activity,duration_min,notes) VALUES(?,?,?,?,?)',(wid,now,'Tapis roulant Fassi',x['duration_min'],'Programma iCoach · fatica '+str(x.get('fatigue') or 'Giusta')))
                con.execute('INSERT INTO exercise_status(ts,workout_id,exercise,priority,status) VALUES(?,?,?,?,?)',(now,wid,'Tapis roulant Fassi','Cardio','Completato'))
            out={'ok':True,'workout_id':wid};remember(con,x,'treadmill',out)
        con.commit();return root.jsonify(out)
    except ValueError as e:
        con.rollback();return root.jsonify(ok=False,error=str(e)),409
    finally:con.close()


def finish_01091():
    x=root.request.get_json();wid=x.get('workout_id')
    if not wid:return root.jsonify(ok=False,error='Nessun esercizio registrato: chiudi la prova senza salvare'),400
    try:effort=None if x.get('effort') in (None,0) else numeric(x['effort'],'sforzo',positive=True,whole=True)
    except ValueError as e:return root.jsonify(ok=False,error=str(e)),400
    if effort is not None and effort>5:return root.jsonify(ok=False,error='Sforzo non valido'),400
    con=root.db()
    try:
        con.execute('BEGIN IMMEDIATE');now=datetime.now().isoformat(timespec='seconds')
        row=con.execute('SELECT id FROM workout_finish WHERE workout_id=?',(wid,)).fetchone()
        if row:
            con.execute('UPDATE workout_finish SET reason=?,duration_min=?,useful_work=?,effort=? WHERE id=?',(x.get('reason'),x['duration_min'],x.get('useful_work'),effort,row['id']))
        else:
            con.execute('INSERT INTO workout_finish(ts,workout_id,reason,duration_min,useful_work,effort) VALUES(?,?,?,?,?,?)',(now,wid,x.get('reason'),x['duration_min'],x.get('useful_work'),effort))
        con.execute('UPDATE workouts SET duration_min=? WHERE id=?',(x['duration_min'],wid))
        # Preserve explicit archive decisions; record unfinished performed strength as partial.
        for r in con.execute('SELECT DISTINCT exercise FROM sets WHERE workout_id=?',(wid,)).fetchall():
            if not con.execute('SELECT 1 FROM exercise_status WHERE workout_id=? AND exercise=?',(wid,r['exercise'])).fetchone():
                con.execute('INSERT INTO exercise_status(ts,workout_id,exercise,priority,status) VALUES(?,?,?,?,?)',(now,wid,r['exercise'],'Utile','Parziale'))
        con.commit();return root.jsonify(ok=True,workout_id=wid)
    finally:con.close()


def nutrition_save_01091():
    x=root.request.get_json();con=root.db()
    try:
        con.execute('BEGIN IMMEDIATE');out=cached(con,x,'food')
        if not out:
            fields=('meal','source','product_id','barcode','name','brand','quantity_g','calories','protein_g','carbs_g','fat_g','fiber_g','water_ml','notes')
            values=[x.get(k) for k in fields];values[0]=values[0] or 'Spuntino';values[1]=values[1] or 'manual';values[4]=values[4].strip()
            entry=con.execute('INSERT INTO nutrition_entries(ts,'+','.join(fields)+') VALUES('+','.join('?' for _ in range(len(fields)+1))+')',(datetime.now().isoformat(timespec='seconds'),*values)).lastrowid
            out={'ok':True,'id':entry};remember(con,x,'food',out)
        con.commit()
    except ValueError as e:
        con.rollback();return root.jsonify(ok=False,error=str(e)),409
    finally:con.close()
    return root.jsonify(**out,today=root.nutrition_today())


app.view_functions['save_set']=save_set_01091
app.view_functions['treadmill_save_0970']=treadmill_save_01091
app.view_functions['coach_finish']=finish_01091
app.view_functions['nutrition_add_entry']=nutrition_save_01091
app.view_functions['workout_flow_archive_0949']=archive_01092
