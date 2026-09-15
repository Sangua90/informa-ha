import html

from flask import Response

import app as root
import coach_library_096
import exercise_menu_fix_0960 as base


app = base.app
root.VERSION = "0.9.61"

# First incremental restoration: keep the working standalone navigation and
# only add guide images for exercises that already have a guide ID.
GUIDE_BY_EXERCISE = {
    "Chest press alla macchina": "chest",
    "Aperture / pec deck alla macchina": "pec_fly",
    "Lat machine al petto": "lat",
    "Shoulder press": "shoulder_press",
    "Alzate laterali": "lateral_raise",
    "Face pull con corda": "face_pull",
    "Push-down tricipiti con corda": "pushdown",
    "Goblet squat a box/panca": "goblet_squat",
    "Stacco rumeno con manubri": "romanian_deadlift",
    "Ponte glutei su panca": "glute_bridge",
    "Calf raise in piedi": "calf_raise",
    "Plank": "plank",
    "Tapis roulant Fassi": "treadmill",
    "Mini stepper": "stepper",
}


def _exercise_row(name, prescription):
    guide_id = GUIDE_BY_EXERCISE.get(name)
    image = ""
    if guide_id:
        image = (
            '<img class="exercise-guide-image" '
            f'src="guide-local/{html.escape(guide_id)}?v=0961" '
            f'alt="Guida {html.escape(name)}" loading="lazy" '
            'style="display:block;width:100%;height:auto;margin:10px 0 12px;'
            'border-radius:16px;object-fit:contain;background:#111;" '
            'onerror="this.style.display=\'none\'">'
        )
    return (
        '<div class="exercise-library-row" style="padding:8px 0 12px">'
        '<div class="measure"><span>{}</span><b>{}</b></div>{}</div>'
    ).format(html.escape(name), html.escape(prescription), image)


def _standalone_library_with_guides():
    cards = []
    total = 0
    guide_count = 0
    for group, items in coach_library_096.GROUPS:
        total += len(items)
        guide_count += sum(1 for name, _ in items if name in GUIDE_BY_EXERCISE)
        rows = "".join(_exercise_row(name, prescription) for name, prescription in items)
        cards.append(
            '<div class="card"><div class="ey">{}</div>{}</div>'.format(
                html.escape(group), rows
            )
        )
    return (
        '<!doctype html><html lang="it"><head>'
        '<meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#08090b">'
        '<title>Esercizi · InFormha</title>'
        '<link rel="stylesheet" href="style.css?v=0961">'
        '</head><body><main class="app">'
        '<div class="top"><div class="brand"><span class="in">In</span>'
        '<span class="form">Form</span><span class="ha">Ha</span></div>'
        '<div class="avatar">E</div></div>'
        '<section class="page active" data-page="exercises-server">'
        '<div class="ey">Altro</div><h1>Esercizi</h1>'
        f'<div class="sub" style="margin-bottom:14px">Libreria completa InFormha · {total} esercizi</div>'
        + "".join(cards)
        + '<a class="btn secondary" href="./?v=0961">Indietro</a>'
        '</section></main></body></html>'
    )


# Replace only the existing standalone endpoint's view function. The URL stays
# unchanged so the navigation fix from 0.9.58/0.9.60 is preserved.
app.view_functions["exercise_library_0958"] = lambda: Response(
    _standalone_library_with_guides(),
    content_type="text/html; charset=utf-8",
    headers={
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
    },
)


@app.get("/api/exercise-menu-guides-0961-info")
def exercise_menu_guides_info_0961():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        standalone_navigation_preserved=True,
        exercise_total=sum(len(items) for _, items in coach_library_096.GROUPS),
        mapped_guides=len(GUIDE_BY_EXERCISE),
        guide_route="guide-local",
    )


print(
    "[INFORMHA_EXERCISE_MENU_GUIDES] version=0.9.61 "
    f"standalone_navigation_preserved=1 mapped_guides={len(GUIDE_BY_EXERCISE)}",
    flush=True,
)
