import app as root
import workout_flow_0949 as base

app = base.app
root.VERSION = "0.9.50"


@app.get("/api/workout-focus-0950-info")
def workout_focus_info_0950():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        single_exercise=True,
        timer_auto_advance=True,
        next_set_focus=True,
        archive_flow_preserved=True,
    )


print("[INFORMHA_WORKOUT_FOCUS] version=0.9.50 single_exercise=1 timer_auto_advance=1 next_set_focus=1 archive_flow_preserved=1", flush=True)
