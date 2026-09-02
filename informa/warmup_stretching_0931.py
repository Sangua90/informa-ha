import pain_select_0930 as base
import app as root
import guide_patch
import exercise_toggle_0915 as toggles

app = base.app
root.VERSION = "0.9.31"

EXTRA_GUIDE_IDS = {
    "mobility_upper", "mobility_back", "mobility_hips", "mobility_ankles", "mobility_trunk",
    "stretch_chest", "stretch_back_lats", "stretch_shoulders_triceps",
    "stretch_biceps_forearms", "stretch_quads", "stretch_hamstrings_glutes",
    "stretch_calves", "stretch_trunk",
}

guide_patch.ALLOWED_GUIDES.update(EXTRA_GUIDE_IDS)
toggles.EXERCISE_IDS.update(EXTRA_GUIDE_IDS)

print(
    f"[INFORMHA_WARMUP] version=0.9.31 treadmill_modular=1 stretching_selective=1 "
    f"extra_ids={len(EXTRA_GUIDE_IDS)} toggle_aware=1 guide_ids_ready=1",
    flush=True,
)

@app.get('/api/warmup-stretching-0931-info')
def warmup_stretching_info_0931():
    return root.jsonify(
        version=root.VERSION,
        treadmill_modular=True,
        stretching_selective=True,
        extra_ids=sorted(EXTRA_GUIDE_IDS),
        toggle_aware=True,
        guide_ids_ready=True,
    )
