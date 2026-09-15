import app as root
import exercise_guides_0953 as base
import exercise_toggle_0915
import guide_manager_0914
import guide_patch


app = base.app
root.VERSION = "0.9.54"

REMOVED_LOW_CABLE_IDS = {
    "seated_row",
    "row_one_arm",
    "upright_row",
    "front_raise_cable",
    "curl_hammer",
    "curl_one_arm",
    "reverse_curl",
    "cable_squat",
    "standing_leg_curl",
    "cable_rdl",
    "glute_kickback",
    "cable_calf_raise",
}
KEPT_LOW_CABLE_ID = "curl"

# The removed exercises are no longer selectable, generated, or exposed as guides.
guide_patch.ALLOWED_GUIDES.difference_update(REMOVED_LOW_CABLE_IDS)
guide_manager_0914.GUIDE_IDS_36.difference_update(REMOVED_LOW_CABLE_IDS)
exercise_toggle_0915.EXERCISE_IDS.difference_update(REMOVED_LOW_CABLE_IDS)


def guide_library_info_0954():
    expected = len(guide_manager_0914.GUIDE_IDS_36)
    return root.jsonify(
        version=root.VERSION,
        allowed_guides=len(guide_patch.ALLOWED_GUIDES),
        expected=expected,
        complete=(len(guide_patch.ALLOWED_GUIDES) == expected),
    )


# Keep the original URL but make its diagnostic count reflect the reduced catalog.
app.view_functions["guide_library_info_0914"] = guide_library_info_0954


@app.get("/api/exercise-catalog-0954-info")
def exercise_catalog_info_0954():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        removed_low_cable=sorted(REMOVED_LOW_CABLE_IDS),
        removed_count=len(REMOVED_LOW_CABLE_IDS),
        kept_low_cable=KEPT_LOW_CABLE_ID,
        exercise_total=len(exercise_toggle_0915.EXERCISE_IDS),
    )


print(
    "[INFORMHA_EXERCISE_CATALOG] version=0.9.54 "
    f"removed_low_cable={len(REMOVED_LOW_CABLE_IDS)} "
    f"kept_low_cable={KEPT_LOW_CABLE_ID} "
    "preacher_support=1",
    flush=True,
)
