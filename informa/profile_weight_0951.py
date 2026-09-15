from datetime import datetime

import app as root
import workout_focus_0950 as base

app = base.app
root.VERSION = "0.9.51"


def _number(value):
    if isinstance(value, bool) or value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _weight_kg(value, unit):
    value = _number(value)
    normalized = str(unit or "kg").strip().lower()
    if value is None:
        return None
    if normalized in ("lb", "lbs", "pound", "pounds"):
        value *= 0.45359237
    elif normalized not in ("", "kg", "kilogram", "kilograms"):
        return None
    value = round(value, 2)
    return value if 20 <= value <= 400 else None


def _apple_weight():
    try:
        snapshot = root.healthsync_snapshot() or {}
    except Exception:
        return None
    data = snapshot.get("data") if isinstance(snapshot.get("data"), dict) else {}
    metrics = snapshot.get("metrics") if isinstance(snapshot.get("metrics"), dict) else {}
    item = data.get("weight") or metrics.get("body_mass")
    if not isinstance(item, dict):
        return None
    value = _weight_kg(item.get("value"), item.get("unit"))
    if value is None:
        return None
    return {
        "value": value,
        "unit": "kg",
        "last_updated": item.get("last_updated") or item.get("day"),
        "source": "Apple Salute · Health Auto Export",
    }


def _init_profile_weight_db():
    con = root.db()
    con.execute(
        """CREATE TABLE IF NOT EXISTS health_profile_weight(
             id INTEGER PRIMARY KEY CHECK(id=1),
             weight_kg REAL NOT NULL,
             source_ts TEXT,
             synced_at TEXT NOT NULL
           )"""
    )
    con.commit()
    con.close()


def _sync_apple_weight():
    apple = _apple_weight()
    if not apple:
        return {"available": False, "synced": False, "source": "manual"}

    now = datetime.now().isoformat(timespec="seconds")
    con = root.db()
    previous = con.execute(
        "SELECT weight_kg,source_ts,synced_at FROM health_profile_weight WHERE id=1"
    ).fetchone()
    changed = previous is None or abs(float(previous["weight_kg"]) - apple["value"]) >= 0.01

    con.execute("UPDATE profile SET weight_kg=? WHERE id=1", (apple["value"],))
    if changed:
        latest = con.execute(
            """SELECT weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm
               FROM body_measurements ORDER BY id DESC LIMIT 1"""
        ).fetchone()
        latest_weight = _number(latest["weight_kg"]) if latest else None
        if latest_weight is None or abs(latest_weight - apple["value"]) >= 0.01:
            con.execute(
                """INSERT INTO body_measurements(
                     ts,weight_kg,waist_cm,chest_cm,arm_r_cm,arm_l_cm,thigh_r_cm,thigh_l_cm
                   ) VALUES(?,?,?,?,?,?,?,?)""",
                (
                    apple["last_updated"] or now,
                    apple["value"],
                    latest["waist_cm"] if latest else None,
                    latest["chest_cm"] if latest else None,
                    latest["arm_r_cm"] if latest else None,
                    latest["arm_l_cm"] if latest else None,
                    latest["thigh_r_cm"] if latest else None,
                    latest["thigh_l_cm"] if latest else None,
                ),
            )

    con.execute(
        """INSERT INTO health_profile_weight(id,weight_kg,source_ts,synced_at)
           VALUES(1,?,?,?)
           ON CONFLICT(id) DO UPDATE SET
             weight_kg=excluded.weight_kg,
             source_ts=excluded.source_ts,
             synced_at=excluded.synced_at""",
        (apple["value"], apple["last_updated"], now),
    )
    con.commit()
    con.close()
    return {"available": True, "synced": changed, **apple, "synced_at": now}


_init_profile_weight_db()
_original_state = app.view_functions.get("state")


if _original_state:
    def state_with_apple_weight_0951():
        _sync_apple_weight()
        return _original_state()

    app.view_functions["state"] = state_with_apple_weight_0951


@app.get("/api/profile-weight-0951-info")
def profile_weight_info_0951():
    return root.jsonify(ok=True, version=root.VERSION, **_sync_apple_weight())


print("[INFORMHA_PROFILE_WEIGHT] version=0.9.51 apple_weight_profile=1 weight_history_dedup=1 manual_fallback=1", flush=True)
