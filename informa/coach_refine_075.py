from datetime import datetime, timedelta
import coach_guides_074 as base
import app as root

app = base.app
root.VERSION = "0.7.5"


def _parse_ts(ts):
    try:
        return datetime.fromisoformat(str(ts))
    except Exception:
        return None


@app.get('/api/coach/advice/<path:exercise>')
def coach_advice_075(exercise):
    con = root.db()
    rows = [dict(r) for r in con.execute(
        """SELECT s.id,s.workout_id,s.exercise,s.set_no,s.weight,s.reps,s.fatigue,s.rest_sec,w.ts
           FROM sets s JOIN workouts w ON w.id=s.workout_id
           WHERE s.exercise=? ORDER BY s.id DESC LIMIT 24""",
        (exercise,)
    )]
    con.close()
    if not rows:
        return root.jsonify(ok=True, calibrated=False, action='calibrate', recovery='unknown', recommendation='Prima seduta: scegli un livello prudente e mantieni circa 2–3 ripetizioni di margine.')

    sessions = {}
    for row in rows:
        sessions.setdefault(row.get('workout_id'), []).append(row)
    latest = next(iter(sessions.values()))
    latest_ts = max((_parse_ts(r.get('ts')) for r in latest), default=None)
    hours = None
    if latest_ts:
        hours = max(0, (datetime.now() - latest_ts).total_seconds() / 3600)

    fatigues = [str(r.get('fatigue') or '') for r in latest]
    reps = [int(r.get('reps') or 0) for r in latest]
    completed_sets = sum(1 for r in reps if r > 0)
    hard = any(f in ('Dura', 'Al limite') for f in fatigues)
    easy = fatigues and all(f == 'Facile' for f in fatigues)
    solid = fatigues and all(f in ('Facile', 'Giusta') for f in fatigues) and completed_sets >= 3

    if hours is not None and hours < 36:
        action = 'recover'
        recovery = 'recent'
        text = f'Ultimo lavoro circa {round(hours)} ore fa: evita di inseguire la progressione oggi. Dai priorità al recupero e mantieni margine.'
    elif hard:
        action = 'hold_or_reduce'
        recovery = 'ready' if hours is None or hours >= 36 else 'recent'
        text = 'L’ultima seduta è risultata dura/al limite: non aumentare. Mantieni il livello e riduci di 1 livello se tecnica o ripetizioni peggiorano.'
    elif easy and completed_sets >= 2:
        action = 'increase_one_level'
        recovery = 'ready'
        text = 'Recupero sufficiente e molto margine nell’ultima seduta: puoi provare +1 livello, mantenendo tecnica pulita e RIR circa 2–3.'
    elif solid:
        action = 'consider_increase'
        recovery = 'ready'
        text = 'Seduta solida e recupero sufficiente: mantieni ancora se vuoi consolidare; se chiudi di nuovo con RIR 2–3, prova +1 livello.'
    else:
        action = 'hold'
        recovery = 'ready' if hours is None or hours >= 36 else 'recent'
        text = 'Mantieni il livello e consolida serie, ripetizioni e tecnica prima di aumentare.'

    return root.jsonify(
        ok=True,
        calibrated=len(sessions) >= 2,
        sessions=len(sessions),
        hours_since_last=round(hours, 1) if hours is not None else None,
        recovery=recovery,
        action=action,
        recommendation=text,
        last_sets=latest[:6]
    )
