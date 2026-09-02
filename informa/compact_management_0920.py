import compact_management_0919 as base
import app as root

app = base.app
root.VERSION = "0.9.20"

print("[INFORMHA_COMPACT] version=0.9.20 single_ui_manager=1 submenu_capture_navigation=1", flush=True)

@app.get('/api/compact-management-0920-info')
def compact_management_info_0920():
    return root.jsonify(
        version=root.VERSION,
        compact=True,
        single_ui_manager=True,
        submenu_capture_navigation=True,
        photo_page='photo-manager-0920',
        exercise_page='exercise-manager-0920',
    )
