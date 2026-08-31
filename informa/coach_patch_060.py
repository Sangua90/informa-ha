from datetime import datetime
import json
import guide_patch as base

app = base.app
base.base.VERSION = "0.6.3"


@app.after_request
def no_cache_ui(response):
    if base.request.path in ('/', '/app.js', '/style.css'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
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
    return base.jsonify(ok=True)
