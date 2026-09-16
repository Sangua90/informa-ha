"""Register all guide IDs used by the 0.9.62 exercise catalog.

This is intentionally additive: existing /data/guides images are preserved.
New guide slots can receive their approved images later through the existing
/api/guides/<guide_id> upload endpoint.
"""
import app as root
import coach_library_0962
import exercise_menu_catalog_0962 as base
import guide_patch


app = base.app
root.VERSION = "0.9.62"

CATALOG_GUIDES = frozenset(coach_library_0962.guide_ids())

# Extend, never replace, the historical set. This keeps old/custom guide IDs
# valid while making every 0.9.62 exercise immediately upload-ready.
guide_patch.ALLOWED_GUIDES.update(CATALOG_GUIDES)


def _guide_state():
    out = {}
    for guide_id in sorted(CATALOG_GUIDES):
        path = guide_patch._user_guide_path(guide_id)
        out[guide_id] = {
            "installed": bool(path),
            "filename": path.name if path else None,
            "size": path.stat().st_size if path else 0,
        }
    return out


@app.get("/api/exercise-guides-catalog-0962-info")
def exercise_guides_catalog_info_0962():
    guides = _guide_state()
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        exercise_total=coach_library_0962.exercise_count(),
        registered_guide_ids=len(CATALOG_GUIDES),
        installed=sum(1 for item in guides.values() if item["installed"]),
        missing=sum(1 for item in guides.values() if not item["installed"]),
        preserves_existing=True,
        upload_endpoint="/api/guides/<guide_id>",
        guides=guides,
    )


print(
    "[INFORMHA_EXERCISE_GUIDES_CATALOG] version=0.9.62 "
    f"registered={len(CATALOG_GUIDES)} preserves_existing=1",
    flush=True,
)
