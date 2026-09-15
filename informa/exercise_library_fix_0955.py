import app as root
import exercise_catalog_0954 as base


app = base.app
root.VERSION = "0.9.55"


@app.get("/api/exercise-library-fix-0955-info")
def exercise_library_fix_info_0955():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        legacy_page_preserved=True,
        filtered_catalog=True,
    )


print(
    "[INFORMHA_EXERCISE_LIBRARY_FIX] version=0.9.55 "
    "legacy_page_preserved=1 filtered_catalog=1",
    flush=True,
)
