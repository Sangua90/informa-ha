import calibration_mode_0938 as base
import ai_context_093 as ctx93
import ai_coach_090 as coach90
import ai_gemini_091 as gemini91
import ai_gemini_092 as gemini92
import app as root

app = base.app
root.VERSION = "0.9.39"

_old_enhanced_context = ctx93._enhanced_context_093
_old_safe_context = ctx93._safe_context_093


def _health_auto_export_snapshot_0939():
    states = root.hass_states()
    metrics = {}
    for item in states:
        entity_id = str(item.get("entity_id") or "")
        if not entity_id.startswith("hae.homeassistant_"):
            continue
        key = entity_id.split("hae.homeassistant_", 1)[1]
        metrics[key] = root.normalize_state(item)

    aliases = {
        "steps": "step_count",
        "walking_running_distance": "walking_running_distance",
        "active_calories": "active_energy",
        "basal_energy": "basal_energy_burned",
        "exercise_time": "apple_exercise_time",
        "resting_heart_rate": "resting_heart_rate",
        "heart_rate_min": "heart_rate_min",
        "heart_rate_average": "heart_rate_average",
        "heart_rate_max": "heart_rate_max",
        "hrv": "heart_rate_variability",
        "walking_heart_rate_average": "walking_heart_rate_average",
        "vo2_max": "vo2_max",
        "blood_oxygen": "blood_oxygen_saturation",
        "physical_effort": "physical_effort",
        "flights_climbed": "flights_climbed",
        "walking_speed": "walking_speed",
        "walking_step_length": "walking_step_length",
        "walking_double_support_percentage": "walking_double_support_percentage",
        "walking_asymmetry_percentage": "walking_asymmetry_percentage",
        "stand_hours": "apple_stand_hour",
        "stand_time": "apple_stand_time",
        "dietary_water": "dietary_water",
        "dietary_energy": "dietary_energy",
        "weight": "body_mass",
        "bmi": "body_mass_index",
        "body_fat": "body_fat_percentage",
        "lean_body_mass": "lean_body_mass",
        "sleep": "sleep_analysis",
    }

    canonical = {}
    for out_key, source_key in aliases.items():
        if source_key in metrics:
            canonical[out_key] = metrics[source_key]

    return {
        "connected": bool(metrics),
        "found": len(metrics),
        "source": "Health Auto Export",
        "data": canonical,
        "metrics": metrics,
    }


def _enhanced_context_0939():
    ctx = _old_enhanced_context()
    try:
        health = _health_auto_export_snapshot_0939()
    except Exception as exc:
        health = {"connected": False, "found": 0, "source": "Health Auto Export", "data": {}, "metrics": {}, "error": str(exc)}
    ctx["health"] = health
    return ctx


def _safe_context_0939(ctx):
    safe = _old_safe_context(ctx)
    health = ctx.get("health") or {}
    safe["health"] = {
        "source": health.get("source"),
        "connected": bool(health.get("connected")),
        "found": int(health.get("found") or 0),
        "data": health.get("data") or {},
        "metrics": health.get("metrics") or {},
    }
    return safe


# Upgrade the existing HealthSync endpoint to the Health Auto Export entities now in Home Assistant.
root.healthsync_snapshot = _health_auto_export_snapshot_0939

# Upgrade the context used by all existing local/Gemini coach handlers without adding duplicate routes.
ctx93._enhanced_context_093 = _enhanced_context_0939
ctx93._safe_context_093 = _safe_context_0939
coach90._coach_context_090 = _enhanced_context_0939
gemini91._safe_context = _safe_context_0939
gemini92._gemini_request_092 = ctx93._gemini_request_093


@app.get('/api/health-context-0939')
def health_context_0939():
    health = _health_auto_export_snapshot_0939()
    return root.jsonify(ok=True, version=root.VERSION, **health)


print("[INFORMHA_HEALTH_CONTEXT] version=0.9.39 hae_entities=1 coach_context=1 gemini_context=1", flush=True)
