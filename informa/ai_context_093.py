import json
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta

import ai_gemini_092 as gemini92
import ai_gemini_091 as gemini91
import ai_coach_090 as coach90
import app as root

app = gemini92.app
root.VERSION = "0.9.3"


def _num(value, default=0.0):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def _iso(ts):
    try:
        return datetime.fromisoformat(str(ts))
    except Exception:
        return None


def _hours_since(ts):
    d = _iso(ts)
    if not d:
        return None
    return round(max(0, (datetime.now() - d).total_seconds() / 3600), 1)


def _enhanced_context_093():
    now = datetime.now()
    today = date.today()
    since7 = (today - timedelta(days=6)).isoformat()
    since14 = (today - timedelta(days=13)).isoformat()
    since30 = (today - timedelta(days=29)).isoformat()

    con = root.db()
    profile_row = con.execute("SELECT goal,level FROM profile WHERE id=1").fetchone()
    profile = dict(profile_row) if profile_row else {}

    workout_rows = [dict(r) for r in con.execute(
        "SELECT id,ts,title,duration_min,notes FROM workouts WHERE substr(ts,1,10)>=? ORDER BY id DESC LIMIT 12",
        (since14,)
    )]
    workout_ids = [w['id'] for w in workout_rows]
    sets = []
    if workout_ids:
        ph = ','.join('?' for _ in workout_ids)
        sets = [dict(r) for r in con.execute(
            f"SELECT id,workout_id,exercise,set_no,weight,reps,fatigue,rest_sec FROM sets WHERE workout_id IN ({ph}) ORDER BY id DESC",
            tuple(workout_ids)
        )]

    finish_rows = []
    status_rows = []
    try:
        finish_rows = [dict(r) for r in con.execute(
            "SELECT workout_id,ts,reason,duration_min,useful_work FROM workout_finish WHERE substr(ts,1,10)>=? ORDER BY id DESC",
            (since14,)
        )]
        status_rows = [dict(r) for r in con.execute(
            "SELECT workout_id,exercise,priority,status,notes,ts FROM exercise_status WHERE substr(ts,1,10)>=? ORDER BY id DESC",
            (since14,)
        )]
    except Exception:
        pass

    pending = []
    try:
        pending = [dict(r) for r in con.execute(
            "SELECT exercise_id,exercise_name,source_plan,priority FROM coach_pending WHERE status='pending' ORDER BY id"
        )]
    except Exception:
        pass

    cardio = [dict(r) for r in con.execute(
        "SELECT ts,activity,duration_min,avg_hr,max_hr,calories FROM cardio WHERE substr(ts,1,10)>=? ORDER BY id DESC",
        (since14,)
    )]

    nutrition_rows = [dict(r) for r in con.execute(
        "SELECT substr(ts,1,10) day,calories,protein_g,carbs_g,fat_g,fiber_g,water_ml FROM nutrition_entries WHERE substr(ts,1,10)>=?",
        (since7,)
    )]
    goals_row = None
    try:
        goals_row = con.execute("SELECT calories,protein_g,carbs_g,fat_g,fiber_g,water_ml FROM nutrition_goals WHERE id=1").fetchone()
    except Exception:
        pass
    goals = dict(goals_row) if goals_row else {}

    supplements = []
    try:
        supplements = [dict(r) for r in con.execute(
            """SELECT s.name,s.time_text,COALESCE(l.taken,0) taken
               FROM supplements s LEFT JOIN supplement_log l
               ON l.supplement_id=s.id AND l.day=? WHERE s.active=1
               ORDER BY COALESCE(s.time_text,'99:99'),s.id""",
            (today.isoformat(),)
        )]
    except Exception:
        pass

    measurements = [dict(r) for r in con.execute(
        "SELECT ts,weight_kg,waist_cm FROM body_measurements WHERE substr(ts,1,10)>=? ORDER BY id DESC LIMIT 8",
        (since30,)
    )]
    con.close()

    by_workout = {}
    for s in reversed(sets):
        by_workout.setdefault(s.get('workout_id'), []).append(s)

    finishes_by_workout = {}
    for f in finish_rows:
        wid = f.get('workout_id')
        if wid is not None and wid not in finishes_by_workout:
            finishes_by_workout[wid] = f

    status_latest = {}
    for s in status_rows:
        key = (s.get('workout_id'), s.get('exercise'))
        if key not in status_latest:
            status_latest[key] = s

    recent_sessions = []
    for w in workout_rows[:5]:
        ws = by_workout.get(w['id'], [])
        exercises = {}
        for s in ws:
            name = str(s.get('exercise') or '').strip()
            if not name:
                continue
            ex = exercises.setdefault(name, {'sets': 0, 'reps': [], 'levels': [], 'fatigue': []})
            if int(s.get('reps') or 0) > 0:
                ex['sets'] += 1
                ex['reps'].append(int(s.get('reps') or 0))
            if s.get('weight') is not None:
                ex['levels'].append(s.get('weight'))
            if s.get('fatigue'):
                ex['fatigue'].append(str(s.get('fatigue')))
        ex_summary = []
        for name, ex in exercises.items():
            ex_summary.append({
                'exercise': name,
                'completed_sets': ex['sets'],
                'reps': ex['reps'][-5:],
                'level_or_load': ex['levels'][-1] if ex['levels'] else None,
                'fatigue': ex['fatigue'][-3:],
            })
        finish = finishes_by_workout.get(w['id'])
        recent_sessions.append({
            'when': w.get('ts'),
            'hours_ago': _hours_since(w.get('ts')),
            'title': w.get('title'),
            'duration_min': (finish or {}).get('duration_min') or w.get('duration_min'),
            'finish_reason': (finish or {}).get('reason'),
            'exercises': ex_summary,
        })

    exercise_history = {}
    for w in workout_rows:
        for s in by_workout.get(w['id'], []):
            name = str(s.get('exercise') or '').strip()
            if not name:
                continue
            ex = exercise_history.setdefault(name, {'last_ts': w.get('ts'), 'sessions': {}, 'fatigue': []})
            ex['sessions'].setdefault(w['id'], {'ts': w.get('ts'), 'sets': 0, 'reps': [], 'level_or_load': None})
            sess = ex['sessions'][w['id']]
            if int(s.get('reps') or 0) > 0:
                sess['sets'] += 1
                sess['reps'].append(int(s.get('reps') or 0))
            if s.get('weight') is not None:
                sess['level_or_load'] = s.get('weight')
            if s.get('fatigue'):
                ex['fatigue'].append(str(s.get('fatigue')))

    exercise_trends = []
    for name, ex in exercise_history.items():
        sessions = list(ex['sessions'].values())[:4]
        latest = sessions[0] if sessions else {}
        hard = sum(1 for f in ex['fatigue'][:8] if f in ('Dura', 'Al limite'))
        easy = sum(1 for f in ex['fatigue'][:8] if f == 'Facile')
        if hard >= 2:
            trend = 'hold_or_reduce'
        elif easy >= 2 and int(latest.get('sets') or 0) >= 2:
            trend = 'possible_progression'
        else:
            trend = 'consolidate'
        exercise_trends.append({
            'exercise': name,
            'hours_since_last': _hours_since(ex.get('last_ts')),
            'recent_sessions': sessions,
            'trend': trend,
        })
    exercise_trends.sort(key=lambda x: x['hours_since_last'] if x['hours_since_last'] is not None else 99999)

    strength_days_7d = len({str(w.get('ts') or '')[:10] for w in workout_rows if str(w.get('ts') or '')[:10] >= since7})
    cardio_7d = [c for c in cardio if str(c.get('ts') or '')[:10] >= since7]
    cardio_minutes_7d = round(sum(_num(c.get('duration_min')) for c in cardio_7d), 1)

    nutrition_by_day = {}
    for r in nutrition_rows:
        d = r.get('day')
        out = nutrition_by_day.setdefault(d, {'calories': 0, 'protein_g': 0, 'carbs_g': 0, 'fat_g': 0, 'fiber_g': 0, 'water_ml': 0, 'entries': 0})
        out['entries'] += 1
        for k in ('calories','protein_g','carbs_g','fat_g','fiber_g','water_ml'):
            out[k] += _num(r.get(k))
    today_nutrition = nutrition_by_day.get(today.isoformat(), {'calories': 0, 'protein_g': 0, 'carbs_g': 0, 'fat_g': 0, 'fiber_g': 0, 'water_ml': 0, 'entries': 0})
    active_days = [v for v in nutrition_by_day.values() if v.get('entries', 0) > 0]
    nutrition_avg = {}
    for k in ('calories','protein_g','carbs_g','fat_g','fiber_g','water_ml'):
        nutrition_avg[k] = round(sum(_num(v.get(k)) for v in active_days) / len(active_days), 1) if active_days else 0

    overdue = []
    taken_today = 0
    for s in supplements:
        if int(s.get('taken') or 0) == 1:
            taken_today += 1
            continue
        t = str(s.get('time_text') or '')
        if t:
            try:
                hh, mm = [int(v) for v in t.split(':', 1)]
                if now >= now.replace(hour=hh, minute=mm, second=0, microsecond=0):
                    overdue.append(s.get('name'))
            except Exception:
                pass

    weight_trend = None
    if measurements:
        latest = measurements[0]
        oldest = measurements[-1]
        if latest.get('weight_kg') is not None and oldest.get('weight_kg') is not None:
            weight_trend = {
                'latest_kg': latest.get('weight_kg'),
                'change_30d_or_available_kg': round(_num(latest.get('weight_kg')) - _num(oldest.get('weight_kg')), 1),
                'measurements_count': len(measurements),
            }

    return {
        'generated_at': now.isoformat(timespec='seconds'),
        'goal': profile.get('goal'),
        'training': {
            'strength_days_7d': strength_days_7d,
            'cardio_minutes_7d': cardio_minutes_7d,
            'recent_sessions': recent_sessions,
            'exercise_trends': exercise_trends[:14],
            'pending_essentials': pending,
            'completion_status': list(status_latest.values())[:20],
        },
        'nutrition': {
            'today': today_nutrition,
            'goals': goals,
            'average_active_days_7d': nutrition_avg,
            'logged_days_7d': len(active_days),
        },
        'supplements': {
            'active': len(supplements),
            'taken_today': taken_today,
            'overdue': overdue,
        },
        'body_progress': weight_trend,
    }


def _safe_context_093(ctx):
    # Already summarised and non-identifying. Keep only fields useful to coaching.
    return {
        'goal': ctx.get('goal'),
        'training': ctx.get('training') or {},
        'nutrition': ctx.get('nutrition') or {},
        'supplements': ctx.get('supplements') or {},
        'body_progress': ctx.get('body_progress'),
    }


def _gemini_request_093(question, ctx, timeout=40):
    cfg = gemini92._ai_config_092()
    if cfg['provider'] != 'gemini':
        raise RuntimeError('Gemini non è selezionato nelle impostazioni')
    if not cfg['api_key']:
        raise RuntimeError('API key Gemini non configurata')

    system_text = (
        "Sei il coach virtuale di InFormha. Rispondi in italiano, con tono pratico e diretto. "
        "Il tuo compito è trasformare i dati registrati in una decisione utile per oggi. "
        "Non inventare pesi, livelli macchina, calorie, ripetizioni, diagnosi o dati mancanti. "
        "Per la forza considera insieme: ore dall'ultima esposizione, ultime 2-4 sedute, serie completate, ripetizioni, fatica/RIR e trend. "
        "Se il recupero è breve o la fatica recente è Dura/Al limite, non proporre aumenti. "
        "Se ci sono Essenziali sospesi, valutali prima di aggiungere volume opzionale, senza creare debito di allenamento. "
        "Per macchine con pacco pesi parla di livello/pin se il dato non rappresenta kg reali. "
        "Per alimentazione usa solo obiettivi impostati e registrazioni disponibili; se il diario è incompleto dichiaralo. "
        "Per integratori limita la risposta a promemoria e aderenza, senza prescrizioni. "
        "Per dolore o sintomi non fare diagnosi: suggerisci di interrompere movimenti che peggiorano il dolore e, se importante/persistente, una valutazione professionale. "
        "Quando la domanda riguarda cosa fare oggi, struttura la risposta in massimo quattro parti: DECISIONE, PERCHÉ, COSA FARE, COSA REGISTRARE. "
        "Se mancano dati indispensabili, scrivi chiaramente DATO MANCANTE e chiedi solo il dato strettamente necessario."
    )
    safe_ctx = _safe_context_093(ctx)
    user_text = (
        'DOMANDA:\n' + str(question) + '\n\n'
        'CONTESTO INFORMHA RIASSUNTO:\n' + json.dumps(safe_ctx, ensure_ascii=False, separators=(',', ':'))
    )
    payload = {
        'model': cfg['model'],
        'input': user_text,
        'system_instruction': system_text,
        'store': False,
        'generation_config': {'max_output_tokens': 900, 'thinking_level': 'low'},
    }
    req = urllib.request.Request(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        data=json.dumps(payload).encode('utf-8'),
        method='POST',
        headers={'Content-Type': 'application/json', 'x-goog-api-key': cfg['api_key']},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode('utf-8')
            data = json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        try:
            err = (json.loads(body).get('error') or {}).get('message')
        except Exception:
            err = None
        raise RuntimeError(err or f'Gemini Interactions API HTTP {exc.code}') from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f'Gemini non raggiungibile: {exc.reason}') from exc

    if str(data.get('status') or '').lower() == 'failed':
        err = data.get('error') or {}
        raise RuntimeError(err.get('message') or 'Interazione Gemini non riuscita')
    answer = gemini92._extract_interaction_text(data)
    if not answer:
        raise RuntimeError('Gemini non ha restituito testo')
    return answer


@app.get('/api/ai-coach/context-summary')
def ai_coach_context_summary_093():
    ctx = _enhanced_context_093()
    return root.jsonify(ok=True, summary={
        'recent_sessions': len((ctx.get('training') or {}).get('recent_sessions') or []),
        'exercise_trends': len((ctx.get('training') or {}).get('exercise_trends') or []),
        'pending_essentials': len((ctx.get('training') or {}).get('pending_essentials') or []),
        'nutrition_logged_days_7d': (ctx.get('nutrition') or {}).get('logged_days_7d', 0),
        'supplements_active': (ctx.get('supplements') or {}).get('active', 0),
        'body_progress_available': bool(ctx.get('body_progress')),
    })


# Upgrade the context used by the existing 0.9.x handlers without duplicate routes.
coach90._coach_context_090 = _enhanced_context_093
gemini91._safe_context = _safe_context_093
gemini91._gemini_request = _gemini_request_093
gemini92._gemini_request_092 = _gemini_request_093
