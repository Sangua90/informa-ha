from datetime import date, datetime
import json
import remove_legacy_guide_manager_0922 as base
import app as root

app = base.app
root.VERSION = "0.9.23"


def _migrate_supplements_0923():
    con = root.db()
    cols = {r[1] for r in con.execute("PRAGMA table_info(supplements)")}
    if "type_text" not in cols:
        con.execute("ALTER TABLE supplements ADD COLUMN type_text TEXT")
    if "days_json" not in cols:
        con.execute("ALTER TABLE supplements ADD COLUMN days_json TEXT")
    con.commit()
    con.close()


_migrate_supplements_0923()


def _normalize_days(value):
    if value in (None, ""):
        return list(range(7))
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            value = []
    out = []
    for x in value or []:
        try:
            n = int(x)
        except Exception:
            continue
        if 0 <= n <= 6 and n not in out:
            out.append(n)
    return sorted(out) if out else list(range(7))


def _row_out(row):
    x = dict(row)
    x["days"] = _normalize_days(x.get("days_json"))
    return x


def _settings_rows():
    con = root.db()
    rows = [_row_out(r) for r in con.execute(
        "SELECT * FROM supplements ORDER BY active DESC, COALESCE(time_text,'99:99'), id"
    )]
    con.close()
    return rows


def _today_rows_0923():
    today = date.today()
    day_iso = today.isoformat()
    weekday = today.weekday()
    con = root.db()
    raw = [dict(r) for r in con.execute(
        """SELECT s.*, COALESCE(l.taken,0) AS taken, l.taken_ts
           FROM supplements s
           LEFT JOIN supplement_log l ON l.supplement_id=s.id AND l.day=?
           WHERE s.active=1
           ORDER BY COALESCE(s.time_text,'99:99'), s.id""",
        (day_iso,)
    )]
    con.close()
    rows = []
    for r in raw:
        days = _normalize_days(r.get("days_json"))
        if weekday in days:
            r["days"] = days
            rows.append(r)
    return rows


@app.get('/api/supplements/settings-v2')
def supplements_settings_0923():
    return root.jsonify(ok=True, items=_settings_rows())


@app.post('/api/supplements/settings-v2')
def supplements_settings_save_0923():
    x = root.request.get_json(silent=True) or {}
    name = str(x.get('name') or '').strip()
    if not name:
        return root.jsonify(ok=False, error='Nome integratore mancante'), 400

    raw_dose = x.get('dose')
    dose = None
    if raw_dose not in (None, ''):
        try:
            dose = float(str(raw_dose).replace(',', '.'))
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

    days = _normalize_days(x.get('days'))
    days_json = json.dumps(days)
    sid = x.get('id')
    active = 1 if x.get('active', True) else 0
    type_text = str(x.get('type_text') or '').strip() or None
    unit = str(x.get('unit') or '').strip() or None
    notes = str(x.get('notes') or '').strip() or None

    con = root.db()
    if sid:
        row = con.execute('SELECT id FROM supplements WHERE id=?', (sid,)).fetchone()
        if not row:
            con.close()
            return root.jsonify(ok=False, error='Integratore non trovato'), 404
        con.execute(
            """UPDATE supplements
               SET name=?, type_text=?, dose=?, unit=?, days_json=?, time_text=?, notes=?, active=?
               WHERE id=?""",
            (name, type_text, dose, unit, days_json, time_text, notes, active, sid)
        )
    else:
        cur = con.execute(
            """INSERT INTO supplements(name,type_text,dose,unit,days_json,time_text,notes,active,created_ts)
               VALUES(?,?,?,?,?,?,?,?,?)""",
            (name, type_text, dose, unit, days_json, time_text, notes, active,
             datetime.now().isoformat(timespec='seconds'))
        )
        sid = cur.lastrowid
    con.commit()
    con.close()
    return root.jsonify(ok=True, id=sid, items=_settings_rows())


@app.delete('/api/supplements/settings-v2/<int:sid>')
def supplements_settings_delete_0923(sid):
    con = root.db()
    row = con.execute('SELECT id FROM supplements WHERE id=?', (sid,)).fetchone()
    if not row:
        con.close()
        return root.jsonify(ok=False, error='Integratore non trovato'), 404
    con.execute('DELETE FROM supplement_log WHERE supplement_id=?', (sid,))
    con.execute('DELETE FROM supplements WHERE id=?', (sid,))
    con.commit()
    con.close()
    return root.jsonify(ok=True)


@app.get('/api/supplements/today-v2')
def supplements_today_0923():
    rows = _today_rows_0923()
    total = len(rows)
    taken = sum(1 for r in rows if int(r.get('taken') or 0) == 1)
    return root.jsonify(
        ok=True,
        day=date.today().isoformat(),
        weekday=date.today().weekday(),
        items=rows,
        total=total,
        taken=taken,
        remaining=total-taken,
        complete=(total == taken),
    )


print('[INFORMHA_SUPPLEMENTS] version=0.9.23 settings_daily_split=1 scheduled_days=1', flush=True)
