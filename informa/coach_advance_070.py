from datetime import datetime, timedelta
import coach_week_069 as base

app = base.app
base.base.base.base.base.VERSION = "0.7.1"


def _db():
    return base.base.base.base.base.db()


@app.get('/api/coach/advance-context')
def coach_advance_context():
    con = _db()
    since_72 = (datetime.now() - timedelta(hours=72)).isoformat(timespec='seconds')
    since_36 = (datetime.now() - timedelta(hours=36)).isoformat(timespec='seconds')

    recent_72 = [dict(r) for r in con.execute(
        """SELECT s.exercise, MAX(w.ts) AS last_ts, COUNT(*) AS sets
           FROM sets s JOIN workouts w ON w.id=s.workout_id
           WHERE w.ts>=? GROUP BY s.exercise ORDER BY last_ts DESC""",
        (since_72,)
    )]
    recent_36 = [dict(r) for r in con.execute(
        """SELECT DISTINCT s.exercise
           FROM sets s JOIN workouts w ON w.id=s.workout_id
           WHERE w.ts>=?""",
        (since_36,)
    )]
    pending = [dict(r) for r in con.execute(
        "SELECT exercise_id,exercise_name,source_plan,priority FROM coach_pending WHERE status='pending' ORDER BY id"
    )]
    last_finish = con.execute(
        "SELECT ts,reason,duration_min FROM workout_finish ORDER BY id DESC LIMIT 1"
    ).fetchone()
    con.close()

    return base.base.base.base.jsonify(
        ok=True,
        recent_72h=recent_72,
        recent_36h=[r['exercise'] for r in recent_36],
        pending_essentials=pending,
        last_finish=dict(last_finish) if last_finish else None,
        recovery_hours=36,
    )
