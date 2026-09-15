import app as root
import exercise_library_fix_0955 as base


app = base.app
root.VERSION = "0.9.56"


@app.get("/api/exercise-navigation-fix-0956-info")
def exercise_navigation_fix_info_0956():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        direct_library_navigation=True,
        profile_button_capture=True,
    )


print(
    "[INFORMHA_EXERCISE_NAVIGATION_FIX] version=0.9.56 "
    "direct_library_navigation=1 profile_button_capture=1",
    flush=True,
)
