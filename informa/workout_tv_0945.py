import health_rest_dashboard_0944 as base
import app as root

app = base.app
root.VERSION = "0.9.45"


@app.get('/api/workout-tv-0945-info')
def workout_tv_0945_info():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        landscape_auto=True,
        airplay_mirroring=True,
        phone_remote=True,
        workout_focus=True,
        recovery_timer=True,
    )


print("[INFORMHA_WORKOUT_TV] version=0.9.45 landscape_auto=1 airplay_mirroring=1 phone_remote=1 workout_focus=1 recovery_timer=1", flush=True)
