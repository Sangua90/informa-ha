import warmup_ui_fix_0932 as base
import app as root
from flask import request

app = base.app
root.VERSION = "0.9.33"


def _workout_rows():
    con = root.db()
    rows = [dict(r) for r in con.execute(
        """SELECT w.id,w.ts,w.title,w.duration_min,w.notes,
                  COUNT(s.id) AS set_count,
                  COUNT(DISTINCT s.exercise) AS exercise_count
           FROM workouts w
           LEFT JOIN sets s ON s.workout_id=w.id
           GROUP BY w.id
           ORDER BY w.id DESC
           LIMIT 200"""
    )]
    con.close()
    return rows


@app.get('/api/workouts-0933')
def workouts_0933():
    return root.jsonify(ok=True, version=root.VERSION, items=_workout_rows())


@app.get('/api/workouts-0933/<int:workout_id>')
def workout_detail_0933(workout_id):
    con = root.db()
    workout = con.execute(
        "SELECT id,ts,title,duration_min,notes FROM workouts WHERE id=?",
        (workout_id,),
    ).fetchone()
    if not workout:
        con.close()
        return root.jsonify(ok=False, error="Allenamento non trovato"), 404
    sets = [dict(r) for r in con.execute(
        """SELECT id,exercise,set_no,weight,reps,fatigue,rest_sec
           FROM sets WHERE workout_id=? ORDER BY id""",
        (workout_id,),
    )]
    con.close()
    return root.jsonify(ok=True, workout=dict(workout), sets=sets)


@app.delete('/api/workouts-0933/<int:workout_id>')
def workout_delete_0933(workout_id):
    con = root.db()
    exists = con.execute("SELECT id FROM workouts WHERE id=?", (workout_id,)).fetchone()
    if not exists:
        con.close()
        return root.jsonify(ok=False, error="Allenamento non trovato"), 404

    deleted = {}
    tables = [r[0] for r in con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )]
    for table in tables:
        if table == 'workouts':
            continue
        try:
            cols = {r[1] for r in con.execute(f'PRAGMA table_info("{table}")')}
            if 'workout_id' not in cols:
                continue
            cur = con.execute(f'DELETE FROM "{table}" WHERE workout_id=?', (workout_id,))
            if cur.rowcount:
                deleted[table] = cur.rowcount
        except Exception:
            continue
    con.execute("DELETE FROM workouts WHERE id=?", (workout_id,))
    con.commit()
    con.close()
    return root.jsonify(ok=True, deleted_workout=workout_id, related_deleted=deleted)


print("[INFORMHA_HISTORY] version=0.9.33 workout_history=1 workout_delete=1 related_cleanup=1", flush=True)


@app.get('/api/workout-history-0933-info')
def workout_history_info_0933():
    return root.jsonify(
        version=root.VERSION,
        workout_history=True,
        workout_delete=True,
        related_cleanup=True,
    )
