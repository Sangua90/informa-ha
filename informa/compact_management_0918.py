import compact_management_0917 as base
import app as root

app = base.app
root.VERSION = "0.9.18"

print("[INFORMHA_COMPACT] version=0.9.18 legacy_disabled=1 forced_compact_menu=1", flush=True)

@app.get('/api/compact-management-0918-info')
def compact_management_info_0918():
    return root.jsonify(
        version=root.VERSION,
        compact=True,
        legacy_disabled=True,
        forced_compact_menu=True,
        photo_page='photo-manager-0917',
        exercise_page='exercise-manager-0917',
    )
