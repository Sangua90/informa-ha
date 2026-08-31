from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import sqlite3
from datetime import datetime, date
import json
import os
import urllib.error
import urllib.parse
import urllib.request
import uuid

app = Flask(__name__, static_folder=None)
DB = Path("/data/informa.db")
PHOTO_DIR = Path("/data/meal_photos")
VERSION = "0.3.2"


def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB.parent.mkdir(parents=True, exist_ok=True)
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
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
    CREATE TABLE IF NOT EXISTS nutrition_entries(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      meal TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      product_id TEXT,
      barcode TEXT,
      name TEXT NOT NULL,
      brand TEXT,
      quantity_g REAL,
      calories REAL,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      fiber_g REAL,
      water_ml REAL,
      photo_name TEXT,
      notes TEXT
    );
    INSERT OR IGNORE INTO profile(id,name,height_cm,weight_kg,goal,level)
      VALUES(1,'Edoardo',187,121.4,'Dimagrimento + forza','Inizio guidato');
    """)
    count = con.execute("SELECT COUNT(*) c FROM body_measurements").fetchone()["c"]
    if count == 0:
        con.execute(
            "INSERT INTO body_measurements "
            "(ts,weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm) "
            "VALUES(?,?,?,?,?,?,?,?)",
            (datetime.now().isoformat(timespec="seconds"),121.4,112,118,39.5,38.8,65,64.6)
        )
    con.commit()
    con.close()


init_db()


def supervisor_token():
    return os.environ.get("SUPERVISOR_TOKEN")


def hass_request(path, method="GET", payload=None, timeout=20):
    token = supervisor_token()
    if not token:
        raise RuntimeError("SUPERVISOR_TOKEN non disponibile")
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        f"http://supervisor/core/api/{path.lstrip('/')}",
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Home Assistant API {exc.code}: {body[:500]}") from exc


def hass_states():
    token = supervisor_token()
    if not token:
        return []
    req = urllib.request.Request(
        "http://supervisor/core/api/states",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_state(item):
    state = item.get("state")
    attrs = item.get("attributes", {}) or {}
    if state in (None, "unknown", "unavailable", ""):
        value = None
    else:
        try:
            value = float(state)
            if value.is_integer():
                value = int(value)
        except (TypeError, ValueError):
            value = state
    return {"value": value, "unit": attrs.get("unit_of_measurement"), "entity_id": item.get("entity_id"), "name": attrs.get("friendly_name"), "last_updated": item.get("last_updated")}


def healthsync_snapshot():
    states = hass_states()
    by_name = {}
    for item in states:
        name = str((item.get("attributes") or {}).get("friendly_name", "")).strip().lower()
        if name:
            by_name[name] = item
    wanted = {
        "steps": "steps today", "active_calories": "active calories today", "exercise_time": "exercise time today",
        "heart_rate": "heart rate", "resting_heart_rate": "resting heart rate", "hrv": "heart rate variability",
        "weight": "weight", "body_fat": "body fat percentage", "bmi": "body mass index",
        "lean_body_mass": "lean body mass", "vo2_max": "vo2 max", "walking_running_distance": "walking + running distance today",
        "sleep": "sleep last night", "last_sync": "last sync", "last_workout_type": "last workout type",
        "last_workout_duration": "last workout duration", "last_workout_calories": "last workout calories", "last_workout_distance": "last workout distance",
    }
    data, found = {}, 0
    for key, friendly_name in wanted.items():
        item = by_name.get(friendly_name)
        data[key] = normalize_state(item) if item else None
        found += 1 if item else 0
    return {"connected": found > 0, "found": found, "data": data}


def nutrition_today():
    con = db()
    prefix = date.today().isoformat() + "%"
    rows = [dict(r) for r in con.execute("SELECT * FROM nutrition_entries WHERE ts LIKE ? ORDER BY id DESC", (prefix,))]
    con.close()
    totals = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "water_ml": 0}
    for row in rows:
        for key in totals:
            totals[key] += float(row.get(key) or 0)
    return {"entries": rows, "totals": totals}


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
    con = db()
    profile = dict(con.execute("SELECT * FROM profile WHERE id=1").fetchone())
    measurement = con.execute("SELECT * FROM body_measurements ORDER BY id DESC LIMIT 1").fetchone()
    cardio = con.execute("SELECT * FROM cardio ORDER BY id DESC LIMIT 1").fetchone()
    result = {"profile": profile, "measurement": dict(measurement) if measurement else None, "last_cardio": dict(cardio) if cardio else None, "version": VERSION}
    con.close()
    return jsonify(result)

@app.get("/api/healthsync")
def healthsync():
    try:
        return jsonify(healthsync_snapshot())
    except Exception as exc:
        return jsonify(connected=False, found=0, data={}, error=str(exc)), 200

@app.get("/api/nutrition/today")
def nutrition_get_today():
    return jsonify(nutrition_today())

@app.post("/api/nutrition/entry")
def nutrition_add_entry():
    x = request.get_json(force=True)
    name = str(x.get("name") or "").strip()
    if not name:
        return jsonify(ok=False, error="Nome alimento mancante"), 400
    con = db()
    cur = con.execute(
        "INSERT INTO nutrition_entries (ts,meal,source,product_id,barcode,name,brand,quantity_g,calories,protein_g,carbs_g,fat_g,fiber_g,water_ml,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (datetime.now().isoformat(timespec="seconds"), x.get("meal", "Spuntino"), x.get("source", "manual"), x.get("product_id"), x.get("barcode"), name, x.get("brand"), x.get("quantity_g"), x.get("calories"), x.get("protein_g"), x.get("carbs_g"), x.get("fat_g"), x.get("fiber_g"), x.get("water_ml"), x.get("notes"))
    )
    con.commit(); entry_id = cur.lastrowid; con.close()
    return jsonify(ok=True, id=entry_id, today=nutrition_today())

@app.post("/api/nutrition/water")
def nutrition_add_water():
    x = request.get_json(silent=True) or {}
    ml = float(x.get("ml") or 0)
    if ml <= 0:
        return jsonify(ok=False, error="Quantità acqua non valida"), 400
    con = db()
    con.execute("INSERT INTO nutrition_entries (ts,meal,source,name,water_ml) VALUES(?,?,?,?,?)", (datetime.now().isoformat(timespec="seconds"), "Acqua", "quick", "Acqua", ml))
    con.commit(); con.close()
    return jsonify(ok=True, today=nutrition_today())

@app.post("/api/nutrition/plate-photo")
def nutrition_plate_photo():
    if "photo" not in request.files:
        return jsonify(ok=False, error="Foto mancante"), 400
    photo = request.files["photo"]
    suffix = Path(photo.filename or "meal.jpg").suffix.lower()
    if suffix not in (".jpg", ".jpeg", ".png", ".webp", ".heic"):
        suffix = ".jpg"
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{suffix}"
    path = PHOTO_DIR / filename
    photo.save(path)
    return jsonify(ok=True, filename=filename, status="saved", ai_status="pending", message="Foto salvata. Il riconoscimento AI verrà collegato nella fase successiva.")

@app.get("/api/homestock/status")
def homestock_status():
    try:
        data = hass_request("food_scanner/informha/catalog")
        return jsonify(connected=True, ready=True, source="HomeStock", domain="food_scanner", count=data.get("count", len(data.get("items", []))))
    except Exception as exc:
        return jsonify(connected=False, ready=True, source="HomeStock", domain="food_scanner", count=0, error=str(exc)), 200

@app.get("/api/homestock/catalog")
def homestock_catalog():
    try:
        return jsonify(hass_request("food_scanner/informha/catalog"))
    except Exception as exc:
        return jsonify(source="HomeStock", domain="food_scanner", count=0, items=[], error=str(exc)), 502

@app.get("/api/homestock/barcode/<barcode>")
def homestock_barcode(barcode):
    code = "".join(ch for ch in str(barcode or "") if ch.isdigit())
    if not code:
        return jsonify(found=False, error="Barcode non valido"), 400
    try:
        return jsonify(hass_request(f"food_scanner/informha/barcode/{urllib.parse.quote(code)}"))
    except Exception as exc:
        return jsonify(found=False, barcode=code, error=str(exc)), 502

@app.post("/api/homestock/scan")
def homestock_scan():
    payload = request.get_json(silent=True) or {}
    try:
        return jsonify(hass_request("food_scanner/informha/scan", method="POST", payload=payload, timeout=70))
    except Exception as exc:
        return jsonify(found=False, error=str(exc)), 502

@app.post("/api/measurement")
def measurement():
    x = request.get_json(force=True)
    con = db()
    con.execute("INSERT INTO body_measurements (ts,weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm) VALUES(?,?,?,?,?,?,?,?)", (datetime.now().isoformat(timespec="seconds"),x.get("weight_kg"),x.get("waist_cm"),x.get("chest_cm"),x.get("arm_r_cm"),x.get("arm_l_cm"),x.get("thigh_r_cm"),x.get("thigh_l_cm")))
    con.commit(); con.close()
    return jsonify(ok=True)

@app.post("/api/cardio")
def cardio():
    x = request.get_json(force=True)
    con = db()
    con.execute("INSERT INTO cardio(ts,activity,duration_min,avg_hr,max_hr,calories,notes) VALUES(?,?,?,?,?,?,?)", (datetime.now().isoformat(timespec="seconds"),x.get("activity","Tapis roulant"),x.get("duration_min"),x.get("avg_hr"),x.get("max_hr"),x.get("calories"),x.get("notes")))
    con.commit(); con.close()
    return jsonify(ok=True)

@app.post("/api/set")
def save_set():
    x = request.get_json(force=True)
    con = db(); wid = x.get("workout_id")
    if not wid:
        cur = con.execute("INSERT INTO workouts(ts,title) VALUES(?,?)", (datetime.now().isoformat(timespec="seconds"), x.get("workout_title", "Allenamento")))
        wid = cur.lastrowid
    con.execute("INSERT INTO sets(workout_id,exercise,set_no,weight,reps,fatigue,rest_sec) VALUES(?,?,?,?,?,?,?)", (wid,x.get("exercise"),x.get("set_no"),x.get("weight"),x.get("reps"),x.get("fatigue"),x.get("rest_sec",90)))
    con.commit(); con.close()
    return jsonify(ok=True, workout_id=wid)

@app.get("/api/history")
def history():
    con = db()
    ms = [dict(r) for r in con.execute("SELECT * FROM body_measurements ORDER BY id DESC LIMIT 50")]
    cs = [dict(r) for r in con.execute("SELECT * FROM cardio ORDER BY id DESC LIMIT 50")]
    sets = [dict(r) for r in con.execute("SELECT * FROM sets ORDER BY id DESC LIMIT 100")]
    foods = [dict(r) for r in con.execute("SELECT * FROM nutrition_entries ORDER BY id DESC LIMIT 200")]
    con.close()
    return jsonify(measurements=ms, cardio=cs, sets=sets, nutrition=foods)

@app.post("/api/health/import")
def health_import():
    payload = request.get_json(silent=True) or {}
    return jsonify(ok=True, received=True, keys=list(payload.keys())[:20])

@app.get("/health")
def health():
    return jsonify(status="ok", app="InFormha", version=VERSION)
