import ai_context_093 as base
import app as root
import guide_patch as guides

app = base.app
root.VERSION = "0.9.4"

EXTRA_GUIDES = {
    "lat_close", "lat_reverse", "straight_arm_pulldown", "row_one_arm", "row_mid",
    "triceps_bar", "triceps_overhead", "triceps_one_arm",
    "curl_hammer", "curl_one_arm", "reverse_curl",
    "upright_row", "front_raise_cable",
    "leg_extension", "standing_leg_curl", "cable_squat", "cable_rdl", "glute_kickback",
    "cable_calf_raise", "cable_crunch"
}

guides.ALLOWED_GUIDES.update(EXTRA_GUIDES)
