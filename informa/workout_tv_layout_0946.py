import workout_tv_0945 as base
import app as root

app = base.app
root.VERSION = "0.9.46"


@app.get('/api/workout-tv-layout-0946-info')
def workout_tv_layout_0946_info():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        full_width=True,
        compact_stage=True,
        compact_sets=True,
        duplicate_title_hidden=True,
    )


print("[INFORMHA_WORKOUT_TV_LAYOUT] version=0.9.46 full_width=1 compact_stage=1 compact_sets=1 duplicate_title_hidden=1", flush=True)
