import treadmill_progression_0970 as base
import app as root
from datetime import datetime, timedelta

app = base.app
def _measurement_rows(limit=50):
    con = root.db()
    rows = [dict(r) for r in con.execute(
        "SELECT * FROM body_measurements ORDER BY id DESC LIMIT ?", (int(limit),)
    )]
    con.close()
    return rows


def _notify_home_assistant():
    payload = {
        "title": "📏 InFormha · Misure corporee",
        "message": "Sono passati 30 giorni dall'ultima rilevazione. È il momento di riprendere e registrare le misure corporee in InFormha."
    }
    # Prefer the user's iPhone notifier; fall back to persistent notification.
    try:
        root.hass_request("services/notify/mobile_app_iphone_17pro_di", method="POST", payload=payload)
        return "mobile_app_iphone_17pro_di"
    except Exception:
        root.hass_request("services/persistent_notification/create", method="POST", payload={
            "title": payload["title"], "message": payload["message"], "notification_id": "informa_body_measurements"
        })
        return "persistent_notification"


def check_measurement_reminder():
    rows = _measurement_rows(1)
    if not rows:
        return {"due": True, "days": None, "last": None}
    last = rows[0]
    try:
        ts = datetime.fromisoformat(str(last.get("ts")))
        days = max(0, (datetime.now() - ts).days)
    except Exception:
        return {"due": False, "days": None, "last": last}
    return {"due": days >= 30, "days": days, "last": last}


@app.get('/api/measurements-0978')
def measurements_history_0978():
    rows = _measurement_rows(50)
    reminder = check_measurement_reminder()
    return root.jsonify(ok=True, items=rows, reminder=reminder)


@app.post('/api/measurements-0978')
def measurements_save_0978():
    x = root.request.get_json(force=True)
    fields = ('weight_kg','waist_cm','chest_cm','arm_r_cm','arm_l_cm','thigh_r_cm','thigh_l_cm')
    values = []
    for key in fields:
        v = x.get(key)
        if v in (None, ''):
            values.append(None)
            continue
        try:
            n = float(v)
            values.append(n if n > 0 else None)
        except Exception:
            return root.jsonify(ok=False, error=f'Valore non valido: {key}'), 400
    if not any(v is not None for v in values):
        return root.jsonify(ok=False, error='Inserisci almeno una misura'), 400
    con = root.db()
    con.execute(
        "INSERT INTO body_measurements (ts,weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm) VALUES(?,?,?,?,?,?,?,?)",
        (datetime.now().isoformat(timespec='seconds'), *values)
    )
    # Keep profile weight aligned when a weight was entered.
    if values[0] is not None:
        con.execute("UPDATE profile SET weight_kg=? WHERE id=1", (values[0],))
    con.commit(); con.close()
    return root.jsonify(ok=True, items=_measurement_rows(50), reminder=check_measurement_reminder())


@app.post('/api/measurements-0978/reminder-check')
def measurements_reminder_check_0978():
    state = check_measurement_reminder()
    if not state.get('due'):
        return root.jsonify(ok=True, due=False, notified=False, reminder=state)
    # One notification per due measurement cycle. Stored in HA persistent state is not reliable,
    # so keep a small local DB marker table.
    con = root.db()
    con.execute("CREATE TABLE IF NOT EXISTS informa_reminders(key TEXT PRIMARY KEY, value TEXT)")
    marker = con.execute("SELECT value FROM informa_reminders WHERE key='body_measurements_last_notified_for'").fetchone()
    last_id = str((state.get('last') or {}).get('id') or 'none')
    if marker and marker['value'] == last_id:
        con.close()
        return root.jsonify(ok=True, due=True, notified=False, already_notified=True, reminder=state)
    try:
        channel = _notify_home_assistant()
    except Exception as exc:
        con.close()
        return root.jsonify(ok=False, due=True, notified=False, error=str(exc), reminder=state), 502
    con.execute("INSERT OR REPLACE INTO informa_reminders(key,value) VALUES('body_measurements_last_notified_for',?)", (last_id,))
    con.commit(); con.close()
    return root.jsonify(ok=True, due=True, notified=True, channel=channel, reminder=state)


print('[INFORMHA_MEASUREMENTS] version=0.9.98 history=1 save_snapshot=1 reminder30d=1 ha_notify=1', flush=True)
