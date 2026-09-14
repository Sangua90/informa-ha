from datetime import datetime

from flask import request

import app as root
import health_metrics_0947 as base

app = base.app
root.VERSION = "0.9.49"

ALLOWED_STATUSES = {"Completato", "Parziale", "Saltato"}


def _init_workout_flow_db():
    con = root.db()
    con.execute("""
        CREATE TABLE IF NOT EXISTS exercise_status(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts TEXT NOT NULL,
          workout_id INTEGER,
          exercise TEXT NOT NULL,
          priority TEXT,
          status TEXT,
          notes TEXT
        )
    """)
    con.commit()
    con.close()


_init_workout_flow_db()


@app.post("/api/workout-flow-0949/archive")
def workout_flow_archive_0949():
    payload = request.get_json(force=True) or {}
    exercise = str(payload.get("exercise") or "").strip()
    status = str(payload.get("status") or "").strip()
    if not exercise:
        return root.jsonify(ok=False, error="Esercizio mancante"), 400
    if status not in ALLOWED_STATUSES:
        return root.jsonify(ok=False, error="Stato esercizio non valido"), 400

    now = datetime.now().isoformat(timespec="seconds")
    workout_id = payload.get("workout_id")
    con = root.db()
    if not workout_id:
        cursor = con.execute(
            "INSERT INTO workouts(ts,title) VALUES(?,?)",
            (now, str(payload.get("workout_title") or "Seduta adattata")),
        )
        workout_id = cursor.lastrowid

    previous = con.execute(
        "SELECT id FROM exercise_status WHERE workout_id=? AND exercise=? ORDER BY id DESC LIMIT 1",
        (workout_id, exercise),
    ).fetchone()
    if previous:
        con.execute(
            "UPDATE exercise_status SET ts=?,priority=?,status=?,notes=? WHERE id=?",
            (now, payload.get("priority"), status, payload.get("notes"), previous["id"]),
        )
        mode = "updated"
    else:
        con.execute(
            "INSERT INTO exercise_status(ts,workout_id,exercise,priority,status,notes) VALUES(?,?,?,?,?,?)",
            (now, workout_id, exercise, payload.get("priority"), status, payload.get("notes")),
        )
        mode = "inserted"
    con.commit()
    con.close()
    return root.jsonify(ok=True, workout_id=workout_id, exercise=exercise, status=status, mode=mode)


@app.get("/api/workout-flow-0949-info")
def workout_flow_info_0949():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        exercise_state_persistent=True,
        archive_before_replace=True,
        start_gate=True,
        timer_auto_advance=False,
    )


print("[INFORMHA_WORKOUT_FLOW] version=0.9.49 exercise_state_persistent=1 archive_before_replace=1 start_gate=1 timer_auto_advance=0", flush=True)
