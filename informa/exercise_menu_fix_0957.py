import app as root
import exercise_navigation_fix_0956 as base


app = base.app
root.VERSION = "0.9.57"


@app.get("/api/exercise-menu-fix-0957-info")
def exercise_menu_fix_info_0957():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        canonical_page="exercises-static",
        server_button=True,
        exercise_total=24,
    )


print(
    "[INFORMHA_EXERCISE_MENU_FIX] version=0.9.57 "
    "canonical_page=exercises-static server_button=1 exercise_total=24",
    flush=True,
)
