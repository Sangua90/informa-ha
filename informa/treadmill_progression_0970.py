import load_progression_0969 as base
import app as root
import json
from datetime import datetime
from flask import request

app = base.app
root.VERSION = "0.9.71"


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


def last_session():
    con=root.db();r=con.execute("SELECT * FROM treadmill_sessions ORDER BY id DESC LIMIT 1").fetchone();con.close()
    return dict(r) if r else None


def build_plan(duration, last=None):
    duration=max(5,int(round(duration)))
    base_speed=5.0
    peak_speed=6.0
    incline=0.0
    reason="Prima seduta: iCoach crea un profilo progressivo prudente e userà il risultato per la prossima."
    if last:
        base_speed=max(3.0,float(last.get('avg_speed_kmh') or 5.0))
        peak_speed=max(base_speed+0.5,float(last.get('max_speed_kmh') or base_speed+1.0))
        incline=max(0.0,float(last.get('avg_incline_pct') or 0.0))
        fat=str(last.get('fatigue') or 'Giusta')
        if fat=='Facile':
            peak_speed=round(peak_speed+0.2,1)
            reason="Ultima seduta facile: iCoach aumenta leggermente il tratto più veloce e lascia stabile l'inclinazione."
        elif fat in ('Dura','Al limite'):
            peak_speed=max(base_speed,round(peak_speed-0.2,1))
            reason="Ultima seduta impegnativa: iCoach alleggerisce il tratto più veloce."
        else:
            reason="Ultima seduta adeguata: iCoach consolida il livello prima di aumentare."
    warm=max(2,round(duration*0.20)); cool=max(2,round(duration*0.15)); work=duration-warm-cool
    if work<1: work=1; warm=max(2,duration-3); cool=max(1,duration-warm-work)
    first=work//2; second=work-first
    phases=[
      {'name':'Riscaldamento','minutes':warm,'speed_kmh':round(max(3.5,base_speed-0.7),1),'incline_pct':0},
      {'name':'Ritmo','minutes':first,'speed_kmh':round(base_speed,1),'incline_pct':round(incline,1)},
      {'name':'Progressione','minutes':second,'speed_kmh':round(peak_speed,1),'incline_pct':round(incline,1)},
      {'name':'Defaticamento','minutes':cool,'speed_kmh':round(max(3.5,base_speed-0.8),1),'incline_pct':0},
    ]
    return phases,reason


@app.get('/api/treadmill-0970/history')
def treadmill_history_0970():
    con=root.db();rows=[dict(r) for r in con.execute("SELECT * FROM treadmill_sessions ORDER BY id DESC LIMIT 12")];con.close()
    for r in rows:
        try:r['phases']=json.loads(r.pop('phases_json') or '[]')
        except Exception:r['phases']=[]
    return root.jsonify(ok=True,items=rows)


@app.get('/api/treadmill-0970/plan')
def treadmill_plan_0970():
    try:duration=float(request.args.get('minutes') or 0)
    except Exception:duration=0
    if duration<=0:return root.jsonify(ok=False,error='Durata non valida'),400
    phases,reason=build_plan(duration,last_session())
    return root.jsonify(ok=True,duration_min=int(round(duration)),phases=phases,reason=reason)


@app.post('/api/treadmill-0970')
def treadmill_save_0970():
    x=request.get_json(force=True);duration=float(x.get('duration_min') or 0)
    if duration<=0:return root.jsonify(ok=False,error='Durata non valida'),400
    phases=x.get('phases') or []
    con=root.db();con.execute("INSERT INTO treadmill_sessions(ts,duration_min,avg_speed_kmh,max_speed_kmh,avg_incline_pct,max_incline_pct,fatigue,phases_json) VALUES(?,?,?,?,?,?,?,?)",(datetime.now().isoformat(timespec='seconds'),duration,x.get('avg_speed_kmh'),x.get('max_speed_kmh'),x.get('avg_incline_pct'),x.get('max_incline_pct'),x.get('fatigue'),json.dumps(phases,ensure_ascii=False)));con.commit();con.close()
    return root.jsonify(ok=True)


@app.get('/api/treadmill-0970-info')
def treadmill_info_0970():return root.jsonify(version=root.VERSION,icoach_generated=True,saves_speed=True,saves_incline=True,saves_duration=True,saves_phases=True)

print('[INFORMHA_TREADMILL_ADAPTIVE] version=0.9.71 icoach_generated=1 multistage=1 history=1',flush=True)
