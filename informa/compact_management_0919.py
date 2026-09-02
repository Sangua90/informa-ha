import compact_management_0918 as base
import app as root

app = base.app
root.VERSION = "0.9.19"

print("[INFORMHA_COMPACT] version=0.9.19 direct_submenu_navigation=1", flush=True)

@app.get('/api/compact-management-0919-info')
def compact_management_info_0919():
    return root.jsonify(
        version=root.VERSION,
        compact=True,
        direct_submenu_navigation=True,
        photo_page='photo-manager-0919',
        exercise_page='exercise-manager-0919',
    )
