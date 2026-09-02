import os
import coach_library_096 as base
import app as root

app = base.app
root.VERSION = "0.9.13"

EXERCISE_COUNT = sum(len(items) for _, items in base.GROUPS)
BUILD_ID = "InFormha-0.9.13-equipment-load-fields"

print(
    f"[INFORMHA_DIAG] version={root.VERSION} module=coach_diag_099 "
    f"exercises={EXERCISE_COUNT} build_id={BUILD_ID} pid={os.getpid()}",
    flush=True,
)

@app.get('/api/build-info')
def build_info_099():
    return root.jsonify(
        version=root.VERSION,
        module='coach_diag_099',
        exercises=EXERCISE_COUNT,
        build_id=BUILD_ID,
    )
