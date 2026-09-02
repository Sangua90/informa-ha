import compact_management_0916 as base
import app as root

app = base.app
root.VERSION = "0.9.17"

print("[INFORMHA_COMPACT] version=0.9.17 stable_submenus=1", flush=True)

@app.get('/api/compact-management-0917-info')
def compact_management_info_0917():
    return root.jsonify(
        version=root.VERSION,
        compact=True,
        stable_submenus=True,
        photo_page='photo-manager-0917',
        exercise_page='exercise-manager-0917',
    )
