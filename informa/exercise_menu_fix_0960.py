import app as root
import exercise_menu_fix_0959 as base


app = base.app
root.VERSION = "0.9.60"


@app.get("/api/exercise-menu-fix-0960-info")
def exercise_menu_fix_info_0960():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        response_import_fixed=True,
        exercise_library_endpoint="exercise-library-0958",
    )


print(
    "[INFORMHA_EXERCISE_MENU_FIX] version=0.9.60 "
    "response_import_fixed=1 exercise_library_endpoint=exercise-library-0958",
    flush=True,
)
