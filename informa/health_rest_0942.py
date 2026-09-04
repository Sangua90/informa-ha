import hashlib
import json
import threading
import time
from datetime import datetime

import websocket

import health_dashboard_0941 as base
import app as root

app = base.app
root.VERSION = "0.9.42"
EVENT_TYPE = "informha_health_auto_export"
_listener_started = False
_listener_lock = threading.Lock()


def _json_compact(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _hash(value):
    return hashlib.sha256(_json_compact(value).encode("utf-8")).hexdigest()


def _payload_data(payload):
    if not isinstance(payload, dict):
        return {}
    data = payload.get("data")
    return data if isinstance(data, dict) else payload


def _init_health_rest_db():
    con = root.db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS health_rest_imports(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      received_at TEXT NOT NULL,
      payload_hash TEXT NOT NULL UNIQUE,
      kind TEXT,
      metric_count INTEGER NOT NULL DEFAULT 0,
      workout_count INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS health_rest_metrics(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      units TEXT,
      sample_ts TEXT,
      sample_hash TEXT NOT NULL UNIQUE,
      sample_json TEXT NOT NULL,
      received_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_health_rest_metrics_name_ts
      ON health_rest_metrics(metric_name, sample_ts);
    CREATE TABLE IF NOT EXISTS health_rest_workouts(
      ext_id TEXT PRIMARY KEY,
      name TEXT,
      start_ts TEXT,
      end_ts TEXT,
      duration_sec REAL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_health_rest_workouts_start
      ON health_rest_workouts(start_ts);
    """)
    con.commit()
    con.close()


def _classify(data):
    has_metrics = isinstance(data.get("metrics"), list) and len(data.get("metrics") or []) > 0
    has_workouts = isinstance(data.get("workouts"), list) and len(data.get("workouts") or []) > 0
    if has_metrics and has_workouts:
        return "metrics+workouts"
    if has_metrics:
        return "metrics"
    if has_workouts:
        return "workouts"
    known = [k for k in ("stateOfMind", "medications", "symptoms", "cycleTracking", "ecg", "heartRateNotifications") if data.get(k)]
    return "+".join(known) if known else "other"


def _sample_timestamp(sample):
    if not isinstance(sample, dict):
        return None
    return sample.get("date") or sample.get("startDate") or sample.get("start") or sample.get("timestamp")


def _save_payload(payload):
    if not isinstance(payload, dict):
        raise ValueError("Payload JSON non valido")
    data = _payload_data(payload)
    metrics = data.get("metrics") if isinstance(data.get("metrics"), list) else []
    workouts = data.get("workouts") if isinstance(data.get("workouts"), list) else []
    received_at = datetime.now().isoformat(timespec="seconds")
    payload_hash = _hash(payload)
    kind = _classify(data)

    con = root.db()
    cur = con.execute(
        "INSERT OR IGNORE INTO health_rest_imports(received_at,payload_hash,kind,metric_count,workout_count,payload_json) VALUES(?,?,?,?,?,?)",
        (received_at, payload_hash, kind, len(metrics), len(workouts), _json_compact(payload)),
    )
    new_import = cur.rowcount > 0

    inserted_metrics = 0
    for metric in metrics:
        if not isinstance(metric, dict):
            continue
        name = str(metric.get("name") or "").strip()
        if not name:
            continue
        units = metric.get("units")
        samples = metric.get("data") if isinstance(metric.get("data"), list) else []
        for sample in samples:
            if not isinstance(sample, dict):
                continue
            sample_hash = _hash({"name": name, "units": units, "sample": sample})
            c = con.execute(
                "INSERT OR IGNORE INTO health_rest_metrics(metric_name,units,sample_ts,sample_hash,sample_json,received_at) VALUES(?,?,?,?,?,?)",
                (name, units, _sample_timestamp(sample), sample_hash, _json_compact(sample), received_at),
            )
            inserted_metrics += max(0, c.rowcount)

    upserted_workouts = 0
    for workout in workouts:
        if not isinstance(workout, dict):
            continue
        ext_id = str(workout.get("id") or "").strip()
        if not ext_id:
            ext_id = _hash({"name": workout.get("name"), "start": workout.get("start"), "end": workout.get("end")})
        con.execute(
            """INSERT INTO health_rest_workouts(ext_id,name,start_ts,end_ts,duration_sec,payload_json,updated_at)
               VALUES(?,?,?,?,?,?,?)
               ON CONFLICT(ext_id) DO UPDATE SET
                 name=excluded.name,start_ts=excluded.start_ts,end_ts=excluded.end_ts,
                 duration_sec=excluded.duration_sec,payload_json=excluded.payload_json,updated_at=excluded.updated_at""",
            (ext_id, workout.get("name"), workout.get("start"), workout.get("end"), workout.get("duration"), _json_compact(workout), received_at),
        )
        upserted_workouts += 1

    con.commit()
    con.close()
    return {
        "new_import": new_import,
        "kind": kind,
        "metrics_in_payload": len(metrics),
        "metric_samples_inserted": inserted_metrics,
        "workouts_in_payload": len(workouts),
        "workouts_upserted": upserted_workouts,
    }


def _rest_status():
    con = root.db()
    imports = con.execute("SELECT COUNT(*) c FROM health_rest_imports").fetchone()["c"]
    metric_samples = con.execute("SELECT COUNT(*) c FROM health_rest_metrics").fetchone()["c"]
    workouts = con.execute("SELECT COUNT(*) c FROM health_rest_workouts").fetchone()["c"]
    last = con.execute("SELECT received_at,kind,metric_count,workout_count FROM health_rest_imports ORDER BY id DESC LIMIT 1").fetchone()
    con.close()
    return {
        "imports": int(imports or 0),
        "metric_samples": int(metric_samples or 0),
        "workouts": int(workouts or 0),
        "last_import": dict(last) if last else None,
    }


def _listen_once():
    token = root.supervisor_token()
    if not token:
        raise RuntimeError("SUPERVISOR_TOKEN non disponibile")
    ws = websocket.create_connection("ws://supervisor/core/websocket", timeout=30)
    try:
        first = json.loads(ws.recv())
        if first.get("type") != "auth_required":
            raise RuntimeError("Handshake WebSocket Home Assistant inatteso")
        ws.send(json.dumps({"type": "auth", "access_token": token}))
        auth = json.loads(ws.recv())
        if auth.get("type") != "auth_ok":
            raise RuntimeError("Autenticazione WebSocket Home Assistant fallita")
        ws.send(json.dumps({"id": 942, "type": "subscribe_events", "event_type": EVENT_TYPE}))
        ack = json.loads(ws.recv())
        if ack.get("type") != "result" or not ack.get("success"):
            raise RuntimeError("Sottoscrizione evento Health Auto Export fallita")
        print("[INFORMHA_HEALTH_REST] websocket_subscribed event=informha_health_auto_export", flush=True)
        while True:
            msg = json.loads(ws.recv())
            if msg.get("type") != "event":
                continue
            event = msg.get("event") or {}
            if event.get("event_type") != EVENT_TYPE:
                continue
            payload = event.get("data") or {}
            try:
                result = _save_payload(payload)
                print(f"[INFORMHA_HEALTH_REST] received kind={result['kind']} metrics={result['metrics_in_payload']} workouts={result['workouts_in_payload']}", flush=True)
            except Exception as exc:
                print(f"[INFORMHA_HEALTH_REST] save_error={exc}", flush=True)
    finally:
        try:
            ws.close()
        except Exception:
            pass


def _listener_loop():
    while True:
        try:
            _listen_once()
        except Exception as exc:
            print(f"[INFORMHA_HEALTH_REST] listener_retry error={exc}", flush=True)
            time.sleep(5)


def _start_listener():
    global _listener_started
    with _listener_lock:
        if _listener_started:
            return
        _listener_started = True
        threading.Thread(target=_listener_loop, name="informha-health-rest", daemon=True).start()


@app.post('/api/health-auto-export/import')
def health_auto_export_import_0942():
    payload = root.request.get_json(silent=True)
    if not isinstance(payload, dict):
        return root.jsonify(ok=False, error="JSON non valido"), 400
    try:
        result = _save_payload(payload)
        return root.jsonify(ok=True, version=root.VERSION, **result)
    except Exception as exc:
        return root.jsonify(ok=False, error=str(exc)), 500


@app.get('/api/health-auto-export/rest-status')
def health_auto_export_rest_status_0942():
    return root.jsonify(ok=True, version=root.VERSION, event_type=EVENT_TYPE, **_rest_status())


_init_health_rest_db()
_start_listener()

print("[INFORMHA_HEALTH_REST] version=0.9.42 ha_event_bridge=1 raw_payload_archive=1 metric_history=1 workout_dedup=1", flush=True)
