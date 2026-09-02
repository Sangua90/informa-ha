import exercise_toggle_0915 as base
import app as root

app = base.app
root.VERSION = "0.9.16"

print("[INFORMHA_COMPACT] version=0.9.16 photo_menu=1 exercise_menu=1", flush=True)

@app.get('/api/compact-management-info')
def compact_management_info_0916():
    return root.jsonify(
        version=root.VERSION,
        photo_menu=True,
        exercise_menu=True,
        compact=True,
    )
