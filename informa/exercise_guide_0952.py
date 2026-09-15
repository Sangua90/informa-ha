from pathlib import Path
import shutil

import app as root
import guide_patch
import profile_weight_0951 as base

app = base.app
root.VERSION = "0.9.52"

GUIDE_ID = "goblet_squat"
BUNDLED_GUIDE = Path(__file__).resolve().parent / "web" / "guides_default" / "goblet_squat.webp"


def install_goblet_guide():
    existing = guide_patch._user_guide_path(GUIDE_ID)
    if existing:
        return {"installed": True, "created": False, "filename": existing.name}
    if not BUNDLED_GUIDE.exists():
        return {"installed": False, "created": False, "filename": None}
    target = guide_patch.USER_GUIDE_DIR / BUNDLED_GUIDE.name
    shutil.copyfile(BUNDLED_GUIDE, target)
    return {"installed": True, "created": True, "filename": target.name}


_guide_status = install_goblet_guide()


@app.get("/api/exercise-guide-0952-info")
def exercise_guide_info_0952():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        guide=GUIDE_ID,
        preserves_custom=True,
        **install_goblet_guide(),
    )


print(
    "[INFORMHA_EXERCISE_GUIDE] version=0.9.52 guide=goblet_squat "
    f"auto_install=1 preserves_custom=1 installed={int(_guide_status['installed'])}",
    flush=True,
)
