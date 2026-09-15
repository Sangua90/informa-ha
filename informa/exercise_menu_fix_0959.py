import app as root
import exercise_menu_fix_0958 as base


app = base.app
root.VERSION = "0.9.59"


@app.get("/api/exercise-menu-fix-0959-info")
def exercise_menu_fix_info_0959():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        early_click_capture=True,
        all_exercise_buttons=True,
        target="exercise-library-0958",
    )


print(
    "[INFORMHA_EXERCISE_MENU_FIX] version=0.9.59 "
    "early_click_capture=1 all_exercise_buttons=1 target=exercise-library-0958",
    flush=True,
)
