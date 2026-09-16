import exercise_guides_catalog_0962 as base
import app as root

app = base.app
root.VERSION = "0.9.69"

FASSI_HINTS = (
    "chest press", "pec deck", "lat machine", "pull-down", "push-down", "cavo", "face pull", "leg extension"
)


def load_unit(exercise):
    name = (exercise or "").lower()
    return "piastre" if any(x in name for x in FASSI_HINTS) else "kg"


@app.get('/api/load-progression-0969/<path:exercise>')
def load_progression_0969(exercise):
    con = root.db()
    rows = [dict(r) for r in con.execute(
        """SELECT s.weight,s.reps,s.fatigue,s.set_no,w.ts
           FROM sets s LEFT JOIN workouts w ON w.id=s.workout_id
           WHERE lower(s.exercise)=lower(?) AND s.weight IS NOT NULL
           ORDER BY s.id DESC LIMIT 12""",
        (exercise,),
    )]
    con.close()
    unit = load_unit(exercise)
    if not rows:
        return root.jsonify(ok=True, exercise=exercise, unit=unit, minimum=1 if unit == "piastre" else 0, suggestion=None, reason="Nessuno storico: inserisci il carico usato oggi.")

    recent = rows[:3]
    weights = [float(r['weight']) for r in recent if r['weight'] is not None]
    last = weights[0] if weights else None
    fatigue = [str(r.get('fatigue') or 'Giusta') for r in recent]
    reps = [int(r['reps']) for r in recent if r.get('reps') is not None]
    suggestion = last
    reason = "Mantieni il carico e consolida serie e ripetizioni."

    if last is not None and len(recent) >= 2 and all(f == 'Facile' for f in fatigue[:2]):
        suggestion = last + 1 if unit == 'piastre' else last
        reason = "Le ultime serie risultano facili: iCoach propone un incremento prudente."
    elif last is not None and any(f == 'Al limite' for f in fatigue[:2]):
        suggestion = max(1, last - 1) if unit == 'piastre' else last
        reason = "Fatica molto alta recente: iCoach evita di aumentare il carico."
    elif last is not None and len(reps) >= 2 and fatigue[0] == 'Giusta':
        reason = "Carico recente adeguato: iCoach lo ripropone e valuterà la progressione dai nuovi dati."

    if unit == 'piastre':
        suggestion = max(1, round(suggestion or 1))
    return root.jsonify(ok=True, exercise=exercise, unit=unit, minimum=1 if unit == "piastre" else 0, suggestion=suggestion, last=last, recent=recent, reason=reason)


@app.get('/api/load-progression-0969-info')
def load_progression_info_0969():
    return root.jsonify(version=root.VERSION, history_loads=True, units=['kg','piastre'], fassi_min_plate=1, adaptive_progression=True)


print('[INFORMHA_LOAD_PROGRESSION] version=0.9.69 history=1 kg=1 plates=1 min_plate=1', flush=True)
