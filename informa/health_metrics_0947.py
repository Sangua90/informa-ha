import json
from collections import defaultdict

import app as root
import health_context_0939 as health_context
import health_rest_0942 as health_rest
import health_rest_dashboard_0944 as health_base
import workout_tv_layout_0946 as base

app = base.app
root.VERSION = "0.9.47"


SUM_METRICS = {
    "step_count",
    "walking_running_distance",
    "cycling_distance",
    "swimming_distance",
    "wheelchair_distance",
    "active_energy",
    "basal_energy_burned",
    "dietary_energy",
    "dietary_water",
    "apple_exercise_time",
    "apple_move_time",
    "apple_stand_time",
    "apple_stand_hour",
    "flights_climbed",
    "push_count",
    "swimming_stroke_count",
    "time_in_daylight",
}

AVERAGE_METRICS = {
    "walking_speed",
    "walking_step_length",
    "walking_asymmetry_percentage",
    "walking_double_support_percentage",
    "stair_speed_up",
    "stair_speed_down",
    "running_speed",
    "running_power",
    "running_ground_contact_time",
    "running_stride_length",
    "running_vertical_oscillation",
    "cycling_speed",
    "cycling_power",
    "cycling_cadence",
    "physical_effort",
    "heart_rate_variability",
    "blood_oxygen_saturation",
    "respiratory_rate",
    "environmental_audio_exposure",
    "headphone_audio_exposure",
}

COUNT_METRICS = {
    "step_count",
    "flights_climbed",
    "push_count",
    "swimming_stroke_count",
    "apple_stand_hour",
}

ENERGY_METRICS = {"active_energy", "basal_energy_burned", "dietary_energy"}


def _number(value):
    if isinstance(value, bool) or value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _sample_number(sample, keys=("qty", "Sum", "sum", "total", "Avg", "avg", "average", "value")):
    for key in keys:
        value = _number(sample.get(key))
        if value is not None:
            return value
    return None


def _latest_day_rows():
    con = root.db()
    rows = con.execute(
        """WITH latest_days AS (
             SELECT metric_name,
                    MAX(substr(COALESCE(sample_ts,received_at),1,10)) AS day
             FROM health_rest_metrics
             GROUP BY metric_name
           )
           SELECT m.id,m.metric_name,m.units,m.sample_ts,m.sample_json,m.received_at,d.day
           FROM health_rest_metrics m
           JOIN latest_days d ON d.metric_name=m.metric_name
             AND substr(COALESCE(m.sample_ts,m.received_at),1,10)=d.day
           ORDER BY m.metric_name,m.id"""
    ).fetchall()
    con.close()
    return rows


def _metric_samples():
    # Repeated rolling exports may resend a bucket with an updated value. Keep
    # only the newest database row for each metric/timestamp before aggregating.
    deduplicated = {}
    days = {}
    units = {}
    for row in _latest_day_rows():
        try:
            sample = json.loads(row["sample_json"])
        except (TypeError, ValueError, json.JSONDecodeError):
            continue
        if not isinstance(sample, dict):
            continue
        name = row["metric_name"]
        timestamp = row["sample_ts"] or row["received_at"]
        deduplicated[(name, timestamp)] = (timestamp, sample)
        days[name] = row["day"]
        units[name] = row["units"] or sample.get("units") or sample.get("unit")

    grouped = defaultdict(list)
    for (name, _timestamp), item in deduplicated.items():
        grouped[name].append(item)
    for samples in grouped.values():
        samples.sort(key=lambda item: item[0] or "")
    return grouped, days, units


def _convert_energy(metric_name, value, unit):
    if metric_name not in ENERGY_METRICS or value is None:
        return value, unit
    normalized = str(unit or "").lower()
    if normalized == "kj":
        return value / 4.184, "kcal"
    if normalized == "j":
        return value / 4184.0, "kcal"
    return value, unit


def _rounded(metric_name, value, unit):
    if value is None:
        return None
    if metric_name in COUNT_METRICS or unit == "count":
        return int(round(value))
    if unit in ("%", "bpm", "ms", "kcal"):
        value = round(value, 1)
    elif unit in ("km/hr", "m/s"):
        value = round(value, 2)
    elif unit == "km":
        value = round(value, 3)
    else:
        value = round(value, 2)
    return int(value) if float(value).is_integer() else value


def _normalized_unit(unit):
    return "bpm" if str(unit or "").lower() in ("count/min", "count/minute") else unit


def _standard_metric(name, samples, day, unit):
    values = []
    for _timestamp, sample in samples:
        value = _sample_number(sample)
        if value is not None:
            values.append(value)
    if not values:
        return None
    if name in SUM_METRICS:
        value, aggregation = sum(values), "daily_sum"
    elif name in AVERAGE_METRICS:
        value, aggregation = sum(values) / len(values), "daily_average"
    else:
        value, aggregation = values[-1], "latest_value"
    unit = _normalized_unit(unit)
    value, unit = _convert_energy(name, value, unit)
    return {
        "value": _rounded(name, value, unit),
        "unit": unit,
        "last_updated": samples[-1][0],
        "source": "rest",
        "aggregation": aggregation,
        "day": day,
        "samples": len(values),
    }


def _heart_metrics(samples, day, unit):
    minimums, averages, maximums = [], [], []
    for _timestamp, sample in samples:
        fallback = _sample_number(sample, ("qty", "value"))
        minimum = _sample_number(sample, ("Min", "min"))
        average = _sample_number(sample, ("Avg", "avg", "average"))
        maximum = _sample_number(sample, ("Max", "max"))
        if minimum is not None or fallback is not None:
            minimums.append(minimum if minimum is not None else fallback)
        if average is not None or fallback is not None:
            averages.append(average if average is not None else fallback)
        if maximum is not None or fallback is not None:
            maximums.append(maximum if maximum is not None else fallback)
    if not averages:
        return {}
    unit = _normalized_unit(unit) or "bpm"
    timestamp = samples[-1][0]

    def item(value, aggregation):
        return {
            "value": _rounded("heart_rate", value, unit),
            "unit": unit,
            "last_updated": timestamp,
            "source": "rest",
            "aggregation": aggregation,
            "day": day,
            "samples": len(averages),
        }

    return {
        "heart_rate_min": item(min(minimums), "daily_minimum"),
        "heart_rate_average": item(sum(averages) / len(averages), "daily_average"),
        "heart_rate_max": item(max(maximums), "daily_maximum"),
    }


def _normalized_rest_metrics():
    grouped, days, units = _metric_samples()
    metrics = {}
    for name, samples in grouped.items():
        if name == "heart_rate":
            metrics.update(_heart_metrics(samples, days.get(name), units.get(name)))
            continue
        metric = _standard_metric(name, samples, days.get(name), units.get(name))
        if metric:
            metrics[name] = metric
    return metrics, len(grouped)


def _health_metrics_snapshot_0947():
    status = health_rest._rest_status()
    metrics, raw_metric_types = _normalized_rest_metrics()
    if not metrics:
        return health_base._health_rest_snapshot_0944()
    return {
        "connected": True,
        "found": len(metrics),
        "raw_metric_types": raw_metric_types,
        "source": "Health Auto Export",
        "transport": "rest",
        "data": health_base._canonical_data(metrics, status),
        "metrics": metrics,
        "rest": status,
    }


root.healthsync_snapshot = _health_metrics_snapshot_0947
health_context._health_auto_export_snapshot_0939 = _health_metrics_snapshot_0947


@app.get('/api/health-metrics-0947-info')
def health_metrics_0947_info():
    snapshot = _health_metrics_snapshot_0947()
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        raw_metric_types=snapshot.get("raw_metric_types", 0),
        displayed_values=snapshot.get("found", 0),
        daily_aggregation=True,
        heart_min_avg_max=True,
        energy_kcal=True,
        rounded_values=True,
    )


print("[INFORMHA_HEALTH_METRICS] version=0.9.47 daily_aggregation=1 heart_min_avg_max=1 energy_kcal=1 rounded_values=1", flush=True)
