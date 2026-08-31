from datetime import datetime, date, timedelta
import coach_progression_068 as base

app = base.app
base.base.base.base.VERSION = "0.6.9"


def _now():
    return datetime.now().isoformat(timespec='seconds')


def _db():
    return base.base.base.base.db()


def coach_exercise_status_069():
    x = base.base.base.request.get_json(force=True) or {}
    workout_id = x.get('workout_id')
    exercise = str(x.get('exercise') or '').strip()
    if not exercise:
        return base.base.base.jsonify(ok=False, error='Esercizio mancante'), 400
    con = _db()
    row = con.execute(
        "SELECT id FROM exercise_status WHERE workout_id IS ? AND exercise=? ORDER BY id DESC LIMIT 1",
        (workout_id, exercise)
    ).fetchone()
    if row:
        con.execute(
            "UPDATE exercise_status SET ts=?,priority=?,status=?,notes=? WHERE id=?",
            (_now(), x.get('priority'), x.get('status'), x.get('notes'), row['id'])
        )
        mode = 'updated'
    else:
        con.execute(
            "INSERT INTO exercise_status(ts,workout_id,exercise,priority,status,notes) VALUES(?,?,?,?,?,?)",
            (_now(), workout_id, exercise, x.get('priority'), x.get('status'), x.get('notes'))
        )
        mode = 'inserted'
    con.commit(); con.close()
    return base.base.base.jsonify(ok=True, mode=mode)


def coach_finish_069():
    x = base.base.base.request.get_json(force=True) or {}
    workout_id = x.get('workout_id')
    con = _db()
    row = None
    if workout_id is not None:
        row = con.execute(
            "SELECT id FROM workout_finish WHERE workout_id=? ORDER BY id DESC LIMIT 1",
            (workout_id,)
        ).fetchone()
    if row:
        con.execute(
            "UPDATE workout_finish SET ts=?,reason=?,duration_min=?,useful_work=? WHERE id=?",
            (_now(), x.get('reason'), x.get('duration_min'), x.get('useful_work'), row['id'])
        )
        mode = 'updated'
    else:
        con.execute(
            "INSERT INTO workout_finish(ts,workout_id,reason,duration_min,useful_work) VALUES(?,?,?,?,?)",
            (_now(), workout_id, x.get('reason'), x.get('duration_min'), x.get('useful_work'))
        )
        mode = 'inserted'
    con.commit(); con.close()
    return base.base.base.jsonify(ok=True, mode=mode)


def coach_week_069():
    since = (date.today() - timedelta(days=6)).isoformat()
    con = _db()
    workouts = [dict(r) for r in con.execute(
        "SELECT * FROM workouts WHERE substr(ts,1,10)>=? ORDER BY id DESC", (since,)
    )]
    sets = [dict(r) for r in con.execute(
        "SELECT s.* FROM sets s LEFT JOIN workouts w ON w.id=s.workout_id WHERE substr(w.ts,1,10)>=? ORDER BY s.id DESC", (since,)
    )]
    cardio = [dict(r) for r in con.execute(
        "SELECT * FROM cardio WHERE substr(ts,1,10)>=? ORDER BY id DESC", (since,)
    )]
    statuses_raw = [dict(r) for r in con.execute(
        "SELECT * FROM exercise_status WHERE substr(ts,1,10)>=? ORDER BY id DESC", (since,)
    )]
    finishes_raw = [dict(r) for r in con.execute(
        "SELECT * FROM workout_finish WHERE substr(ts,1,10)>=? ORDER BY id DESC", (since,)
    )]
    con.close()

    latest_status = {}
    for row in statuses_raw:
        key = (row.get('workout_id'), row.get('exercise'))
        if key not in latest_status:
            latest_status[key] = row
    statuses = list(latest_status.values())

    latest_finish = {}
    for row in finishes_raw:
        key = row.get('workout_id') if row.get('workout_id') is not None else ('no_workout', row.get('id'))
        if key not in latest_finish:
            latest_finish[key] = row
    finishes = list(latest_finish.values())

    strength_days = {str(w.get('ts') or '')[:10] for w in workouts if w.get('ts')}
    cardio_days = {str(c.get('ts') or '')[:10] for c in cardio if c.get('ts')}
    training_days = strength_days | cardio_days
    cardio_only_days = cardio_days - strength_days
    cardio_minutes = round(sum(float(c.get('duration_min') or 0) for c in cardio), 1)

    summary = {
        'workouts': len(training_days),
        'strength_workouts': len(strength_days),
        'cardio_sessions': len(cardio),
        'cardio_only_sessions': len(cardio_only_days),
        'cardio_minutes': cardio_minutes,
        'sets': len(sets),
        'completed': sum(1 for s in statuses if s.get('status') == 'Completato'),
        'partial': sum(1 for s in statuses if s.get('status') == 'Parziale'),
        'skipped': sum(1 for s in statuses if s.get('status') == 'Saltato'),
        'finished_sessions': len(finishes),
        'window_days': 7,
    }
    return base.base.base.jsonify(
        ok=True, workouts=workouts, cardio=cardio, statuses=statuses,
        finishes=finishes, sets=sets, summary=summary
    )


# Replace legacy handlers without registering duplicate Flask URL rules.
app.view_functions['coach_exercise_status'] = coach_exercise_status_069
app.view_functions['coach_finish'] = coach_finish_069
app.view_functions['coach_week'] = coach_week_069
