from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import sqlite3
from datetime import datetime

app = Flask(__name__, static_folder=None)
DB = Path("/data/informa.db")
VERSION = "0.2.0"

def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    DB.parent.mkdir(parents=True, exist_ok=True)
    con = db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS profile(
      id INTEGER PRIMARY KEY CHECK(id=1),
      name TEXT NOT NULL DEFAULT 'Edoardo',
      height_cm REAL,
      weight_kg REAL,
      goal TEXT,
      level TEXT
    );
    CREATE TABLE IF NOT EXISTS body_measurements(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      weight_kg REAL,
      waist_cm REAL,
      chest_cm REAL,
      arm_r_cm REAL,
      arm_l_cm REAL,
      thigh_r_cm REAL,
      thigh_l_cm REAL
    );
    CREATE TABLE IF NOT EXISTS workouts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      title TEXT NOT NULL,
      duration_min INTEGER,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS sets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER,
      exercise TEXT NOT NULL,
      set_no INTEGER,
      weight REAL,
      reps INTEGER,
      fatigue TEXT,
      rest_sec INTEGER
    );
    CREATE TABLE IF NOT EXISTS cardio(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      activity TEXT,
      duration_min REAL,
      avg_hr REAL,
      max_hr REAL,
      calories REAL,
      notes TEXT
    );
    INSERT OR IGNORE INTO profile(id,name,height_cm,weight_kg,goal,level)
      VALUES(1,'Edoardo',187,121.4,'Dimagrimento + forza','Inizio guidato');
    """)
    count = con.execute("SELECT COUNT(*) c FROM body_measurements").fetchone()["c"]
    if count == 0:
        con.execute("""INSERT INTO body_measurements
        (ts,weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm)
        VALUES(?,?,?,?,?,?,?,?)""",
        (datetime.now().isoformat(timespec="seconds"),121.4,112,118,39.5,38.8,65,64.6))
    con.commit()
    con.close()

init_db()

@app.get("/")
def index():
    return send_from_directory("/app/web", "index.html")

@app.get("/app.js")
def js():
    return send_from_directory("/app/web", "app.js")

@app.get("/style.css")
def css():
    return send_from_directory("/app/web", "style.css")

@app.get("/api/state")
def state():
    con=db()
    profile=dict(con.execute("SELECT * FROM profile WHERE id=1").fetchone())
    measurement=con.execute("SELECT * FROM body_measurements ORDER BY id DESC LIMIT 1").fetchone()
    cardio=con.execute("SELECT * FROM cardio ORDER BY id DESC LIMIT 1").fetchone()
    result={"profile":profile,"measurement":dict(measurement) if measurement else None,"last_cardio":dict(cardio) if cardio else None,"version":VERSION}
    con.close()
    return jsonify(result)

@app.post("/api/measurement")
def measurement():
    x=request.get_json(force=True)
    con=db()
    con.execute("""INSERT INTO body_measurements
    (ts,weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm)
    VALUES(?,?,?,?,?,?,?,?)"",(
      datetime.now().isoformat(timespec="seconds"),x.get("weight_kg"),x.get("waist_cm"),x.get("chest_cm"),x.get("arm_r_cm"),x.get("arm_l_cm"),x.get("thigh_r_cm"),x.get("thigh_l_cm")
    ))
    con.commit(); con.close()
    return jsonify(ok=True)

@app.post("/api/cardio")
def cardio():
    x=request.get_json(force=True)
    con=db()
    con.execute("""INSERT INTO cardio(ts,activity,duration_min,avg_hr,max_hr,calories,notes)
      VALUES(?,?,?,?,?,?,?)"",(
      datetime.now().isoformat(timespec="seconds"),x.get("activity","Tapis roulant"),x.get("duration_min"),x.get("avg_hr"),x.get("max_hr"),x.get("calories"),x.get("notes")
    ))
    con.commit(); con.close()
    return jsonify(ok=True)

@app.post("/api/set")
def save_set():
    x=request.get_json(force=True)
    con=db()
    wid=x.get("workout_id")
    if not wid:
        cur=con.execute("INSERT INTO workouts(ts,title) VALUES(?,?)",(datetime.now().isoformat(timespec="seconds"), x.get("workout_title","Allenamento")))
        wid=cur.lastrowid
    con.execute("""INSERT INTO sets(workout_id,exercise,set_no,weight,reps,fatigue,rest_sec)
                   VALUES(?,?,?,?,?,?,?)"",(wid,x.get("exercise"),x.get("set_no"),x.get("weight"),x.get("reps"),x.get("fatigue"),x.get("rest_sec",90)))
    con.commit(); con.close()
    return jsonify(ok=True, workout_id=wid)

@app.get("/api/history")
def history():
    con=db()
    ms=[dict(r) for r in con.execute("SELECT * FROM body_measurements ORDER BY id DESC LIMIT 50")]
    cs=[dict(r) for r in con.execute("SELECT * FROM cardio ORDER BY id DESC LIMIT 50")]
    sets=[dict(r) for r in con.execute("SELECT * FROM sets ORDER BY id DESC LIMIT 100")]
    con.close()
    return jsonify(measurements=ms, cardio=cs, sets=sets)

@app.post("/api/health/import")
def health_import():
    payload=request.get_json(silent=True) or {}
    return jsonify(ok=True, received=True, keys=list(payload.keys())[:20])

@app.get("/health")
def health():
    return jsonify(status="ok", app="InFormha", version=VERSION)
