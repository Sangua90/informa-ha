import json

import health_branding_0943 as base
import health_context_0939 as health_context
import health_rest_0942 as health_rest
import app as root

app = base.app
root.VERSION = "0.9.44"

_legacy_health_snapshot = root.healthsync_snapshot

ALIASES = {
    "steps": ("step_count",),
    "walking_running_distance": ("walking_running_distance",),
    "active_calories": ("active_energy",),
    "basal_energy": ("basal_energy_burned",),
    "exercise_time": ("apple_exercise_time",),
    "heart_rate": ("heart_rate_average", "heart_rate"),
    "resting_heart_rate": ("resting_heart_rate",),
    "hrv": ("heart_rate_variability",),
    "vo2_max": ("vo2_max",),
    "blood_oxygen": ("blood_oxygen_saturation",),
    "weight": ("body_mass",),
    "bmi": ("body_mass_index",),
    "body_fat": ("body_fat_percentage",),
    "lean_body_mass": ("lean_body_mass",),
    "sleep": ("sleep_analysis",),
}


def _sample_value(sample):
    for key in ("qty", "Avg", "avg", "average", "value", "Sum", "sum", "total", "Max", "max", "Min", "min"):
        value = sample.get(key)
        if value is not None and value != "":
            return value
    return None


def _rest_metric_rows():
    con = root.db()
    rows = con.execute(
        """SELECT metric_name,units,sample_ts,sample_json,received_at
           FROM health_rest_metrics
           WHERE id IN (
             SELECT MAX(id) FROM health_rest_metrics GROUP BY metric_name
           )
           ORDER BY metric_name"""
    ).fetchall()
    con.close()

    metrics = {}
    for row in rows:
        try:
            sample = json.loads(row["sample_json"])
        except (TypeError, ValueError, json.JSONDecodeError):
            continue
        if not isinstance(sample, dict):
            continue
        metrics[row["metric_name"]] = {
            "value": _sample_value(sample),
            "unit": row["units"] or sample.get("units") or sample.get("unit"),
            "last_updated": row["sample_ts"] or row["received_at"],
            "source": "rest",
        }
    return metrics


def _latest_rest_workout():
    con = root.db()
    row = con.execute(
        """SELECT name,start_ts,end_ts,duration_sec,payload_json,updated_at
           FROM health_rest_workouts
           ORDER BY COALESCE(start_ts,updated_at) DESC LIMIT 1"""
    ).fetchone()
    con.close()
    if not row:
        return {}
    try:
        payload = json.loads(row["payload_json"])
    except (TypeError, ValueError, json.JSONDecodeError):
        payload = {}
    return {
        "type": {"value": row["name"] or payload.get("name"), "unit": None, "last_updated": row["start_ts"] or row["updated_at"]},
        "duration": {"value": row["duration_sec"], "unit": "s", "last_updated": row["start_ts"] or row["updated_at"]},
    }


def _canonical_data(metrics, status):
    data = {}
    for output_key, candidates in ALIASES.items():
        for metric_name in candidates:
            if metric_name in metrics:
                data[output_key] = metrics[metric_name]
                break

    last = status.get("last_import") or {}
    if last.get("received_at"):
        data["last_sync"] = {
            "value": last["received_at"],
            "unit": None,
            "last_updated": last["received_at"],
            "source": "rest",
        }

    workout = _latest_rest_workout()
    if workout:
        data["last_workout_type"] = workout["type"]
        data["last_workout_duration"] = workout["duration"]
    return data


def _health_rest_snapshot_0944():
    status = health_rest._rest_status()
    rest_metrics = _rest_metric_rows()
    if rest_metrics:
        return {
            "connected": True,
            "found": len(rest_metrics),
            "source": "Health Auto Export",
            "transport": "rest",
            "data": _canonical_data(rest_metrics, status),
            "metrics": rest_metrics,
            "rest": status,
        }

    try:
        legacy = _legacy_health_snapshot()
    except Exception as exc:
        legacy = {"connected": False, "found": 0, "data": {}, "metrics": {}, "error": str(exc)}
    legacy["transport"] = "home_assistant"
    legacy["rest"] = status
    if status.get("imports"):
        legacy["connected"] = True
    return legacy


# The existing /api/healthsync route and AI context both resolve these functions
# at request time, so this upgrades them without adding duplicate endpoints.
root.healthsync_snapshot = _health_rest_snapshot_0944
health_context._health_auto_export_snapshot_0939 = _health_rest_snapshot_0944


@app.get('/api/health-rest-dashboard-0944-info')
def health_rest_dashboard_0944_info():
    snapshot = _health_rest_snapshot_0944()
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        transport=snapshot.get("transport"),
        found=snapshot.get("found", 0),
        rest=snapshot.get("rest", {}),
    )


print("[INFORMHA_HEALTH_REST_DASHBOARD] version=0.9.44 rest_metrics_ui=1 rest_workouts_ui=1 legacy_fallback=1", flush=True)
