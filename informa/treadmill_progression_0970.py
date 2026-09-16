import load_progression_0969 as base
import app as root
import json
from datetime import datetime
from flask import request

app = base.app
root.VERSION = "0.9.70"


def ensure_table():
    con = root.db()
    con.execute("""CREATE TABLE IF NOT EXISTS treadmill_sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      duration_min REAL NOT NULL,
      avg_speed_kmh REAL,
      max_speed_kmh REAL,
      avg_incline_pct REAL,
      max_incline_pct REAL,
      fatigue TEXT,
      phases_json TEXT
    )""")
    con.commit(); con.close()

ensure_table()


@app.get('/api/treadmill-0970/history')
def treadmill_history_0970():
    con=root.db();rows=[dict(r) for r in con.execute("SELECT * FROM treadmill_sessions ORDER BY id DESC LIMIT 12")];con.close()
    for r in rows:
        try:r['phases']=json.loads(r.pop('phases_json') or '[]')
        except Exception:r['phases']=[]
    return root.jsonify(ok=True,items=rows)


@app.get('/api/treadmill-0970/suggestion')
def treadmill_suggestion_0970():
    con=root.db();r=con.execute("SELECT * FROM treadmill_sessions ORDER BY id DESC LIMIT 1").fetchone();con.close()
    if not r:return root.jsonify(ok=True,suggestion=None,reason="Nessuno storico: inserisci velocità e inclinazione realmente utilizzate.")
    r=dict(r);speed=float(r.get('avg_speed_kmh') or 0);incl=float(r.get('avg_incline_pct') or 0);fat=str(r.get('fatigue') or 'Giusta')
    suggested_speed=speed;suggested_incline=incl;reason="Ripropongo i valori dell'ultima seduta e valuterò la progressione dai nuovi dati."
    if fat=='Facile' and speed>0:suggested_speed=round(speed+0.2,1);reason="Ultima seduta facile: piccolo aumento della velocità media, senza aumentare anche l'inclinazione."
    elif fat in ('Dura','Al limite'):reason="Ultima seduta impegnativa: mantengo i parametri senza aumentare."
    return root.jsonify(ok=True,suggestion={'speed_kmh':suggested_speed,'incline_pct':suggested_incline,'duration_min':r.get('duration_min')},last=r,reason=reason)


@app.post('/api/treadmill-0970')
def treadmill_save_0970():
    x=request.get_json(force=True);duration=float(x.get('duration_min') or 0)
    if duration<=0:return root.jsonify(ok=False,error='Durata non valida'),400
    phases=x.get('phases') or []
    con=root.db();con.execute("INSERT INTO treadmill_sessions(ts,duration_min,avg_speed_kmh,max_speed_kmh,avg_incline_pct,max_incline_pct,fatigue,phases_json) VALUES(?,?,?,?,?,?,?,?)",(datetime.now().isoformat(timespec='seconds'),duration,x.get('avg_speed_kmh'),x.get('max_speed_kmh'),x.get('avg_incline_pct'),x.get('max_incline_pct'),x.get('fatigue'),json.dumps(phases,ensure_ascii=False)));con.commit();con.close()
    return root.jsonify(ok=True)


@app.get('/api/treadmill-0970-info')
def treadmill_info_0970():return root.jsonify(version=root.VERSION,adaptive=True,saves_speed=True,saves_incline=True,saves_duration=True,saves_phases=True)

print('[INFORMHA_TREADMILL_ADAPTIVE] version=0.9.70 speed=1 incline=1 history=1 progression=1',flush=True)
