from datetime import date, datetime, timedelta
import nutrition_080 as base
import app as root

app = base.app
root.VERSION = "0.8.1"


def _init_supplements_081():
    con = root.db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS supplements(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dose REAL,
      unit TEXT,
      time_text TEXT,
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_ts TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS supplement_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplement_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0,
      taken_ts TEXT,
      UNIQUE(supplement_id, day)
    );
    """)
    con.commit(); con.close()


_init_supplements_081()


def _supplements(active_only=False):
    con = root.db()
    sql = "SELECT * FROM supplements"
    if active_only:
        sql += " WHERE active=1"
    sql += " ORDER BY COALESCE(time_text,'99:99'), id"
    rows = [dict(r) for r in con.execute(sql)]
    con.close()
    return rows


def _today_rows():
    today = date.today().isoformat()
    con = root.db()
    rows = [dict(r) for r in con.execute(
        """SELECT s.*, COALESCE(l.taken,0) AS taken, l.taken_ts
           FROM supplements s
           LEFT JOIN supplement_log l ON l.supplement_id=s.id AND l.day=?
           WHERE s.active=1
           ORDER BY COALESCE(s.time_text,'99:99'), s.id""",
        (today,)
    )]
    con.close()
    return rows


@app.get('/api/supplements')
def supplements_list_081():
    return root.jsonify(ok=True, items=_supplements())


@app.post('/api/supplements')
def supplements_save_081():
    x = root.request.get_json(silent=True) or {}
    name = str(x.get('name') or '').strip()
    if not name:
        return root.jsonify(ok=False, error='Nome integratore mancante'), 400
    raw_dose = x.get('dose')
    dose = None
    if raw_dose not in (None, ''):
        try:
            dose = float(raw_dose)
        except (TypeError, ValueError):
            return root.jsonify(ok=False, error='Dose non valida'), 400
        if dose < 0:
            return root.jsonify(ok=False, error='Dose non valida'), 400
    time_text = str(x.get('time_text') or '').strip() or None
    if time_text:
        try:
            datetime.strptime(time_text, '%H:%M')
        except ValueError:
            return root.jsonify(ok=False, error='Orario non valido'), 400
    sid = x.get('id')
    active = 1 if x.get('active', True) else 0
    con = root.db()
    if sid:
        row = con.execute('SELECT id FROM supplements WHERE id=?', (sid,)).fetchone()
        if not row:
            con.close()
            return root.jsonify(ok=False, error='Integratore non trovato'), 404
        con.execute(
            'UPDATE supplements SET name=?,dose=?,unit=?,time_text=?,notes=?,active=? WHERE id=?',
            (name, dose, str(x.get('unit') or '').strip() or None, time_text,
             str(x.get('notes') or '').strip() or None, active, sid)
        )
    else:
        cur = con.execute(
            'INSERT INTO supplements(name,dose,unit,time_text,notes,active,created_ts) VALUES(?,?,?,?,?,?,?)',
            (name, dose, str(x.get('unit') or '').strip() or None, time_text,
             str(x.get('notes') or '').strip() or None, active,
             datetime.now().isoformat(timespec='seconds'))
        )
        sid = cur.lastrowid
    con.commit(); con.close()
    return root.jsonify(ok=True, id=sid, items=_supplements())


@app.delete('/api/supplements/<int:sid>')
def supplements_delete_081(sid):
    con = root.db()
    row = con.execute('SELECT id FROM supplements WHERE id=?', (sid,)).fetchone()
    if not row:
        con.close()
        return root.jsonify(ok=False, error='Integratore non trovato'), 404
    con.execute('DELETE FROM supplement_log WHERE supplement_id=?', (sid,))
    con.execute('DELETE FROM supplements WHERE id=?', (sid,))
    con.commit(); con.close()
    return root.jsonify(ok=True)


@app.get('/api/supplements/today')
def supplements_today_081():
    rows = _today_rows()
    total = len(rows)
    taken = sum(1 for r in rows if int(r.get('taken') or 0) == 1)
    return root.jsonify(ok=True, day=date.today().isoformat(), items=rows, total=total,
                        taken=taken, adherence=round((taken / total) * 100) if total else 100)


@app.post('/api/supplements/<int:sid>/taken')
def supplements_taken_081(sid):
    x = root.request.get_json(silent=True) or {}
    taken = 1 if x.get('taken', True) else 0
    today = date.today().isoformat()
    con = root.db()
    row = con.execute('SELECT id FROM supplements WHERE id=?', (sid,)).fetchone()
    if not row:
        con.close()
        return root.jsonify(ok=False, error='Integratore non trovato'), 404
    con.execute(
        """INSERT INTO supplement_log(supplement_id,day,taken,taken_ts)
           VALUES(?,?,?,?)
           ON CONFLICT(supplement_id,day) DO UPDATE SET taken=excluded.taken,taken_ts=excluded.taken_ts""",
        (sid, today, taken, datetime.now().isoformat(timespec='seconds') if taken else None)
    )
    con.commit(); con.close()
    return root.jsonify(ok=True)


@app.get('/api/supplements/due')
def supplements_due_081():
    now = datetime.now()
    due = []
    for row in _today_rows():
        if int(row.get('taken') or 0) == 1:
            continue
        t = row.get('time_text')
        overdue = False
        if t:
            try:
                hh, mm = [int(v) for v in t.split(':', 1)]
                overdue = now >= now.replace(hour=hh, minute=mm, second=0, microsecond=0)
            except Exception:
                overdue = False
        item = dict(row)
        item['overdue'] = overdue
        due.append(item)
    return root.jsonify(ok=True, checked_at=now.isoformat(timespec='seconds'), items=due,
                        overdue=sum(1 for x in due if x.get('overdue')))


@app.get('/api/supplements/week')
def supplements_week_081():
    start = date.today() - timedelta(days=6)
    active = _supplements(active_only=True)
    ids = [x['id'] for x in active]
    con = root.db()
    rows = []
    if ids:
        placeholders = ','.join('?' for _ in ids)
        rows = [dict(r) for r in con.execute(
            f"SELECT supplement_id,day,taken FROM supplement_log WHERE day>=? AND supplement_id IN ({placeholders})",
            (start.isoformat(), *ids)
        )]
    con.close()
    taken_map = {(r['supplement_id'], r['day']): int(r.get('taken') or 0) for r in rows}
    days = []
    expected_total = 0
    taken_total = 0
    for i in range(7):
        d = (start + timedelta(days=i)).isoformat()
        expected = len(active)
        taken = sum(taken_map.get((s['id'], d), 0) for s in active)
        expected_total += expected
        taken_total += taken
        days.append({'day': d, 'expected': expected, 'taken': taken,
                     'adherence': round((taken / expected) * 100) if expected else 100})
    return root.jsonify(ok=True, days=days, active_supplements=len(active),
                        adherence=round((taken_total / expected_total) * 100) if expected_total else 100)
