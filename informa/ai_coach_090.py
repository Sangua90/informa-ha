from datetime import datetime, date, timedelta
import supplements_081 as base
import app as root

app = base.app
root.VERSION = "0.9.0"


def _num(value, default=0.0):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def _coach_context_090():
    now = datetime.now()
    today = date.today().isoformat()
    since7 = (date.today() - timedelta(days=6)).isoformat()
    since72 = (now - timedelta(hours=72)).isoformat(timespec='seconds')
    con = root.db()

    profile_row = con.execute('SELECT * FROM profile WHERE id=1').fetchone()
    profile = dict(profile_row) if profile_row else {}
    measurement_row = con.execute('SELECT * FROM body_measurements ORDER BY id DESC LIMIT 1').fetchone()
    measurement = dict(measurement_row) if measurement_row else None

    workouts = [dict(r) for r in con.execute(
        'SELECT * FROM workouts WHERE substr(ts,1,10)>=? ORDER BY id DESC', (since7,)
    )]
    recent_sets = [dict(r) for r in con.execute(
        """SELECT s.*,w.ts FROM sets s JOIN workouts w ON w.id=s.workout_id
           WHERE w.ts>=? ORDER BY s.id DESC""", (since72,)
    )]
    cardio = [dict(r) for r in con.execute(
        'SELECT * FROM cardio WHERE substr(ts,1,10)>=? ORDER BY id DESC', (since7,)
    )]

    pending = []
    try:
        pending = [dict(r) for r in con.execute(
            "SELECT exercise_id,exercise_name,source_plan,priority FROM coach_pending WHERE status='pending' ORDER BY id"
        )]
    except Exception:
        pending = []

    nutrition = [dict(r) for r in con.execute(
        'SELECT * FROM nutrition_entries WHERE substr(ts,1,10)=? ORDER BY id DESC', (today,)
    )]
    goals_row = None
    try:
        goals_row = con.execute('SELECT * FROM nutrition_goals WHERE id=1').fetchone()
    except Exception:
        goals_row = None
    goals = dict(goals_row) if goals_row else {}

    supplements = []
    try:
        supplements = [dict(r) for r in con.execute(
            """SELECT s.*,COALESCE(l.taken,0) AS taken,l.taken_ts
               FROM supplements s LEFT JOIN supplement_log l
               ON l.supplement_id=s.id AND l.day=?
               WHERE s.active=1 ORDER BY COALESCE(s.time_text,'99:99'),s.id""", (today,)
        )]
    except Exception:
        supplements = []
    con.close()

    nutrition_totals = {
        'calories': sum(_num(x.get('calories')) for x in nutrition),
        'protein_g': sum(_num(x.get('protein_g')) for x in nutrition),
        'carbs_g': sum(_num(x.get('carbs_g')) for x in nutrition),
        'fat_g': sum(_num(x.get('fat_g')) for x in nutrition),
        'fiber_g': sum(_num(x.get('fiber_g')) for x in nutrition),
        'water_ml': sum(_num(x.get('water_ml')) for x in nutrition),
    }

    fatigue_counts = {'Facile': 0, 'Giusta': 0, 'Dura': 0, 'Al limite': 0}
    last_exercise = {}
    for row in recent_sets:
        f = str(row.get('fatigue') or '')
        if f in fatigue_counts:
            fatigue_counts[f] += 1
        ex = str(row.get('exercise') or '')
        if ex and ex not in last_exercise:
            last_exercise[ex] = row.get('ts')

    strength_days = len({str(w.get('ts') or '')[:10] for w in workouts if w.get('ts')})
    cardio_minutes = round(sum(_num(c.get('duration_min')) for c in cardio), 1)
    overdue_supplements = []
    for item in supplements:
        if int(item.get('taken') or 0) == 1:
            continue
        time_text = item.get('time_text')
        overdue = False
        if time_text:
            try:
                hh, mm = [int(v) for v in str(time_text).split(':', 1)]
                overdue = now >= now.replace(hour=hh, minute=mm, second=0, microsecond=0)
            except Exception:
                overdue = False
        if overdue:
            overdue_supplements.append(item)

    return {
        'generated_at': now.isoformat(timespec='seconds'),
        'profile': profile,
        'measurement': measurement,
        'training': {
            'strength_days_7d': strength_days,
            'cardio_minutes_7d': cardio_minutes,
            'sets_72h': len(recent_sets),
            'fatigue_72h': fatigue_counts,
            'recent_exercises': last_exercise,
            'pending_essentials': pending,
        },
        'nutrition': {'today': nutrition_totals, 'goals': goals, 'entries': len(nutrition)},
        'supplements': {
            'active': len(supplements),
            'taken_today': sum(1 for x in supplements if int(x.get('taken') or 0) == 1),
            'overdue': [x.get('name') for x in overdue_supplements],
        },
    }


def _build_advice_090(ctx):
    training = ctx['training']
    nutrition = ctx['nutrition']
    supp = ctx['supplements']
    priorities = []
    reasons = []

    hard = int(training['fatigue_72h'].get('Dura') or 0) + int(training['fatigue_72h'].get('Al limite') or 0)
    if hard >= 2:
        priorities.append({'area': 'Allenamento', 'level': 'recupero', 'text': 'Oggi evita di inseguire aumenti di livello: nelle ultime 72 ore risultano più serie dure o al limite.'})
        reasons.append('fatica recente elevata')
    elif training['sets_72h'] == 0:
        priorities.append({'area': 'Allenamento', 'level': 'pronto', 'text': 'Non risultano serie di forza nelle ultime 72 ore: se ti senti bene puoi affrontare una seduta completa.'})
        reasons.append('nessun lavoro di forza recente')
    else:
        priorities.append({'area': 'Allenamento', 'level': 'normale', 'text': 'Hai lavoro recente registrato: usa il check-in di oggi e lascia che Portami avanti eviti sovrapposizioni inutili.'})
        reasons.append('storico recente disponibile')

    pending = training.get('pending_essentials') or []
    if pending:
        names = ', '.join(str(x.get('exercise_name') or x.get('exercise_id')) for x in pending[:3])
        priorities.append({'area': 'Essenziali', 'level': 'priorità', 'text': f'Hai {len(pending)} essenzial{("e" if len(pending)==1 else "i")} da valutare prima del lavoro opzionale: {names}.'})
        reasons.append('essenziali sospesi')

    totals = nutrition.get('today') or {}
    goals = nutrition.get('goals') or {}
    protein_goal = _num(goals.get('protein_g'))
    protein = _num(totals.get('protein_g'))
    water_goal = _num(goals.get('water_ml'))
    water = _num(totals.get('water_ml'))
    calories_goal = _num(goals.get('calories'))
    calories = _num(totals.get('calories'))

    if protein_goal > 0 and protein < protein_goal * 0.6:
        priorities.append({'area': 'Alimentazione', 'level': 'attenzione', 'text': f'Proteine registrate: {round(protein)} g su {round(protein_goal)} g. Nei prossimi pasti dai priorità a una fonte proteica.'})
    elif calories_goal > 0 and calories > calories_goal * 1.1:
        priorities.append({'area': 'Alimentazione', 'level': 'attenzione', 'text': 'Le calorie registrate hanno già superato il target giornaliero impostato: evita di compensare con restrizioni drastiche e usa il dato come riferimento.'})
    elif nutrition.get('entries', 0) == 0:
        priorities.append({'area': 'Alimentazione', 'level': 'dati', 'text': 'Oggi non hai ancora registrato alimenti: il coach non può valutare il bilancio nutrizionale con precisione.'})
    else:
        priorities.append({'area': 'Alimentazione', 'level': 'ok', 'text': 'Il diario alimentare di oggi è attivo; continua a registrare i pasti per rendere i consigli più affidabili.'})

    if water_goal > 0 and water < water_goal * 0.5:
        priorities.append({'area': 'Idratazione', 'level': 'attenzione', 'text': f'Acqua registrata: {round(water)} ml su {round(water_goal)} ml. Aumentala gradualmente durante la giornata.'})

    if supp.get('overdue'):
        priorities.append({'area': 'Integratori', 'level': 'promemoria', 'text': 'Non risultano ancora segnati come presi: ' + ', '.join(supp['overdue'][:4]) + '.'})

    headline = priorities[0]['text'] if priorities else 'Continua a registrare i dati: il coach si adatta allo storico reale.'
    return {
        'headline': headline,
        'priorities': priorities,
        'reasoning_summary': reasons,
        'mode': 'local_adaptive_engine',
        'llm_connected': False,
        'disclaimer': 'Il coach usa i dati registrati per suggerimenti di allenamento e abitudini; non sostituisce valutazioni mediche o nutrizionali professionali.'
    }


@app.get('/api/ai-coach/context')
def ai_coach_context_090():
    return root.jsonify(ok=True, context=_coach_context_090())


@app.get('/api/ai-coach/today')
def ai_coach_today_090():
    ctx = _coach_context_090()
    return root.jsonify(ok=True, context=ctx, advice=_build_advice_090(ctx))


@app.post('/api/ai-coach/ask')
def ai_coach_ask_090():
    x = root.request.get_json(silent=True) or {}
    question = str(x.get('question') or '').strip()
    if not question:
        return root.jsonify(ok=False, error='Scrivi una domanda'), 400
    ctx = _coach_context_090()
    advice = _build_advice_090(ctx)
    q = question.lower()
    if any(k in q for k in ('allen', 'palestra', 'eserc', 'recuper', 'forza')):
        relevant = [p for p in advice['priorities'] if p['area'] in ('Allenamento', 'Essenziali')]
    elif any(k in q for k in ('mang', 'aliment', 'calor', 'protein', 'carbo', 'grassi', 'acqua')):
        relevant = [p for p in advice['priorities'] if p['area'] in ('Alimentazione', 'Idratazione')]
    elif any(k in q for k in ('integr', 'creatina', 'supplement')):
        relevant = [p for p in advice['priorities'] if p['area'] == 'Integratori']
    else:
        relevant = advice['priorities'][:3]
    answer = ' '.join(p['text'] for p in relevant) if relevant else advice['headline']
    return root.jsonify(ok=True, question=question, answer=answer, mode='local_adaptive_engine', llm_connected=False, context_generated_at=ctx['generated_at'])
