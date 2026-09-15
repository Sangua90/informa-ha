from pathlib import Path
import shutil

import app as root
import exercise_guide_0952 as base
import guide_patch

app = base.app
root.VERSION = "0.9.53"

GUIDE_IDS = (
    "plank",
    "glute_bridge",
    "calf_raise",
    "shoulder_press",
    "lateral_raise",
    "romanian_deadlift",
)
BUNDLED_DIR = Path(__file__).resolve().parent / "web" / "guides_default"


def install_approved_guides():
    results = {}
    for guide_id in GUIDE_IDS:
        existing = guide_patch._user_guide_path(guide_id)
        if existing:
            results[guide_id] = {
                "installed": True,
                "created": False,
                "filename": existing.name,
            }
            continue
        source = BUNDLED_DIR / f"{guide_id}.webp"
        if not source.exists():
            results[guide_id] = {
                "installed": False,
                "created": False,
                "filename": None,
            }
            continue
        target = guide_patch.USER_GUIDE_DIR / source.name
        shutil.copyfile(source, target)
        results[guide_id] = {
            "installed": True,
            "created": True,
            "filename": target.name,
        }
    return results


_guide_status = install_approved_guides()


@app.get("/api/exercise-guides-0953-info")
def exercise_guides_info_0953():
    guides = install_approved_guides()
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        approved_guides=len(GUIDE_IDS),
        installed=sum(1 for item in guides.values() if item["installed"]),
        preserves_custom=True,
        guides=guides,
    )


print(
    "[INFORMHA_EXERCISE_GUIDES] version=0.9.53 approved_guides=6 "
    "auto_install=1 preserves_custom=1 "
    f"installed={sum(1 for item in _guide_status.values() if item['installed'])}",
    flush=True,
)
