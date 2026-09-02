import coach_diag_099 as base
import guide_patch
import app as root

app = base.app
root.VERSION = "0.9.14"

GUIDE_IDS_36 = {
    "chest", "lat", "pushdown", "curl", "seated_row", "pec_fly",
    "shoulder_press", "lateral_raise", "goblet_squat", "romanian_deadlift",
    "glute_bridge", "calf_raise", "face_pull", "plank", "treadmill", "stepper",
    "lat_close", "lat_reverse", "straight_arm_pulldown", "row_one_arm", "row_mid",
    "triceps_bar", "triceps_overhead", "triceps_one_arm", "curl_hammer", "curl_one_arm",
    "reverse_curl", "upright_row", "front_raise_cable", "leg_extension",
    "standing_leg_curl", "cable_squat", "cable_rdl", "glute_kickback",
    "cable_calf_raise", "cable_crunch"
}

guide_patch.ALLOWED_GUIDES.update(GUIDE_IDS_36)

print(
    f"[INFORMHA_GUIDES] version={root.VERSION} allowed_guides={len(guide_patch.ALLOWED_GUIDES)}",
    flush=True,
)

@app.get('/api/guide-library-info')
def guide_library_info_0914():
    return root.jsonify(
        version=root.VERSION,
        allowed_guides=len(guide_patch.ALLOWED_GUIDES),
        expected=36,
        complete=(len(guide_patch.ALLOWED_GUIDES) == 36),
    )
