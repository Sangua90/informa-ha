from datetime import datetime
import json
import guide_patch as base

app = base.app
base.base.VERSION = "0.6.5"

EXERCISES_PAGE = '''
<section class="page" data-page="exercises-static">
  <div class="ey">Altro</div><h1>Esercizi</h1>
  <div class="sub" style="margin-bottom:14px">Libreria degli esercizi disponibili in InFormha.</div>
  <div class="card"><div class="ey">Petto</div><div class="measure"><span>Chest press alla macchina</span><b>3 × 10</b></div><div class="measure"><span>Aperture / pec deck alla macchina</span><b>3 × 12</b></div></div>
  <div class="card"><div class="ey">Schiena</div><div class="measure"><span>Lat machine al petto</span><b>3 × 10</b></div><div class="measure"><span>Rematore al cavo basso</span><b>3 × 10</b></div></div>
  <div class="card"><div class="ey">Spalle</div><div class="measure"><span>Shoulder press</span><b>3 × 10</b></div><div class="measure"><span>Alzate laterali</span><b>3 × 12</b></div><div class="measure"><span>Face pull con corda</span><b>3 × 12</b></div></div>
  <div class="card"><div class="ey">Braccia</div><div class="measure"><span>Push-down tricipiti con corda</span><b>3 × 12</b></div><div class="measure"><span>Curl bicipiti al cavo basso</span><b>3 × 12</b></div></div>
  <div class="card"><div class="ey">Gambe e glutei</div><div class="measure"><span>Goblet squat a box/panca</span><b>3 × 10</b></div><div class="measure"><span>Stacco rumeno con manubri</span><b>3 × 10</b></div><div class="measure"><span>Ponte glutei su panca</span><b>3 × 12</b></div><div class="measure"><span>Calf raise in piedi</span><b>3 × 15</b></div></div>
  <div class="card"><div class="ey">Core</div><div class="measure"><span>Plank</span><b>3 × 30 sec</b></div></div>
  <div class="card"><div class="ey">Cardio</div><div class="measure"><span>Tapis roulant Fassi</span><b>20 min</b></div><div class="measure"><span>Mini stepper</span><b>10 min</b></div></div>
  <button class="btn secondary" onclick="go('profile')">Indietro</button>
</section>
'''


@app.after_request
def force_exercises_menu(response):
    try:
        if 'text/html' in response.headers.get('Content-Type', ''):
            html = response.get_data(as_text=True)
            if 'data-page="exercises-static"' not in html:
                marker = '<section class="page" data-page="profiledata">'
                html = html.replace(marker, EXERCISES_PAGE + '\n' + marker, 1)
            if 'id="exercisesStaticButton"' not in html:
                marker = '<button class="btn secondary" onclick="go(\'coach\')">Settimana e Coach</button>'
                button = '<button id="exercisesStaticButton" class="btn secondary" onclick="go(\'exercises\')">🏋️ Esercizi</button>'
                html = html.replace(marker, button + marker, 1)
            else:
                html = html.replace("go('exercises-static')", "go('exercises')")
            response.set_data(html)
        if base.request.path in ('/', '/app.js', '/style.css'):
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
    except Exception:
        pass
    return response


def init_state_db():
    con = base.base.db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS coach_pending(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_ts TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      source_plan TEXT,
      priority TEXT NOT NULL DEFAULT 'Essenziale',
      status TEXT NOT NULL DEFAULT 'pending',
      resolved_ts TEXT
    );
    CREATE TABLE IF NOT EXISTS coach_state(
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_ts TEXT NOT NULL
    );
    """)
    con.commit(); con.close()


init_state_db()

@app.get('/api/coach/pending')
def pending_get():
    con = base.base.db()
    rows = [dict(r) for r in con.execute("SELECT * FROM coach_pending WHERE status='pending' ORDER BY id")]
    con.close()
    return base.jsonify(ok=True, items=rows)

@app.post('/api/coach/pending')
def pending_add():
    x = base.request.get_json(force=True) or {}
    items = x.get('items') or []
    con = base.base.db()
    added = 0
    for item in items:
        if (item.get('priority') or '') != 'Essenziale':
            continue
        exercise_id = str(item.get('id') or '').strip()
        name = str(item.get('name') or '').strip()
        if not exercise_id or not name:
            continue
        exists = con.execute("SELECT id FROM coach_pending WHERE status='pending' AND exercise_id=? LIMIT 1", (exercise_id,)).fetchone()
        if exists:
            continue
        con.execute("INSERT INTO coach_pending(created_ts,exercise_id,exercise_name,source_plan,priority,status) VALUES(?,?,?,?,?,'pending')", (
            datetime.now().isoformat(timespec='seconds'), exercise_id, name, x.get('source_plan'), 'Essenziale'))
        added += 1
    con.commit(); con.close()
    return base.jsonify(ok=True, added=added)

@app.post('/api/coach/pending/resolve')
def pending_resolve():
    x = base.request.get_json(force=True) or {}
    ids = [str(v) for v in (x.get('exercise_ids') or [])]
    if not ids:
        return base.jsonify(ok=True, resolved=0)
    con = base.base.db(); resolved = 0
    for exercise_id in ids:
        cur = con.execute("UPDATE coach_pending SET status='resolved', resolved_ts=? WHERE status='pending' AND exercise_id=?", (
            datetime.now().isoformat(timespec='seconds'), exercise_id))
        resolved += cur.rowcount
    con.commit(); con.close()
    return base.jsonify(ok=True, resolved=resolved)

@app.get('/api/coach/state')
def coach_state_get():
    con = base.base.db()
    rows = con.execute('SELECT key,value FROM coach_state').fetchall(); con.close()
    out = {}
    for row in rows:
        try: out[row['key']] = json.loads(row['value'])
        except Exception: out[row['key']] = row['value']
    return base.jsonify(ok=True, state=out)

@app.post('/api/coach/state')
def coach_state_set():
    x = base.request.get_json(force=True) or {}
    con = base.base.db(); now = datetime.now().isoformat(timespec='seconds')
    for key, value in x.items():
        con.execute("INSERT INTO coach_state(key,value,updated_ts) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_ts=excluded.updated_ts", (
            str(key), json.dumps(value, ensure_ascii=False), now))
    con.commit(); con.close()
    return base.jsonify(ok=True, state=x)
