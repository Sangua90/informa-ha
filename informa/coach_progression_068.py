from collections import defaultdict
import coach_patch_060 as base

app = base.app
base.base.base.VERSION = "0.6.8"


@app.get('/api/coach/progression/<path:exercise>')
def coach_progression(exercise):
    con = base.base.base.db()
    rows = [dict(r) for r in con.execute(
        "SELECT id,workout_id,exercise,set_no,weight,reps,fatigue,rest_sec FROM sets WHERE exercise=? ORDER BY id DESC LIMIT 18",
        (exercise,)
    )]
    con.close()
    if not rows:
        return base.base.jsonify(ok=True, calibrated=False, sessions=0, recommendation='Prima seduta: scegli un livello prudente e lascia 2–3 ripetizioni di margine.')
    sessions = defaultdict(list)
    for row in rows:
        sessions[row.get('workout_id')].append(row)
    latest = next(iter(sessions.values()))
    comparable = len(sessions)
    reps = [int(r.get('reps') or 0) for r in latest]
    fatigue = [str(r.get('fatigue') or '') for r in latest]
    target_ok = len(reps) >= 2 and min(reps or [0]) > 0
    if any(x == 'Al limite' for x in fatigue) or not target_ok:
        action = 'hold_or_reduce'
        text = 'Non aumentare: mantieni il livello. Se tecnica o ripetizioni peggiorano, riduci di 1 livello.'
    elif fatigue and all(x == 'Facile' for x in fatigue) and len(latest) >= 2:
        action = 'increase_one_level'
        text = 'Hai chiuso con molto margine: alla prossima seduta puoi provare +1 livello, mantenendo tecnica pulita.'
    elif fatigue and all(x in ('Facile','Giusta') for x in fatigue) and len(latest) >= 3:
        action = 'consider_increase'
        text = 'Seduta solida: se completi ancora tutte le serie con RIR 2–3, prova +1 livello.'
    else:
        action = 'hold'
        text = 'Mantieni il livello e consolida serie e ripetizioni prima di aumentare.'
    return base.base.jsonify(ok=True, calibrated=comparable >= 2, sessions=comparable, action=action, recommendation=text, last_sets=latest[:6])
