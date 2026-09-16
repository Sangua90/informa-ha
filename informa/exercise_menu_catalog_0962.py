"""0.9.62 exercise-library UI layer.

Keeps the known-working 0.9.61 endpoint/navigation, switches the page to the
37-exercise metadata catalog, and deliberately shows no fixed prescription.
Guide images appear automatically as soon as their guide_id is installed.
"""
import html

from flask import Response

import app as root
import coach_library_0962
import exercise_menu_guides_0961 as base


app = base.app
root.VERSION = "0.9.62"


def _exercise_row(exercise):
    name = exercise["name"]
    guide_id = exercise["guide_id"]
    image = (
        '<img class="exercise-guide-image" '
        f'src="guide-local/{html.escape(guide_id)}?v=0962" '
        f'alt="Guida {html.escape(name)}" loading="lazy" '
        'style="display:block;width:100%;height:auto;margin:10px 0 12px;'
        'border-radius:16px;object-fit:contain;background:#111;" '
        'onerror="this.style.display=\'none\'">'
    )
    return (
        '<div class="exercise-library-row" style="padding:8px 0 12px">'
        '<div class="measure"><span>{}</span></div>{}</div>'
    ).format(html.escape(name), image)


def _standalone_library_0962():
    cards = []
    total = coach_library_0962.exercise_count()
    for group, exercises in coach_library_0962.GROUPS:
        rows = "".join(_exercise_row(exercise) for exercise in exercises)
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
        '<link rel="stylesheet" href="style.css?v=0962">'
        '</head><body><main class="app">'
        '<div class="top"><div class="brand"><span class="in">In</span>'
        '<span class="form">Form</span><span class="ha">Ha</span></div>'
        '<div class="avatar">E</div></div>'
        '<section class="page active" data-page="exercises-server">'
        '<div class="ey">Altro</div><h1>Esercizi</h1>'
        f'<div class="sub" style="margin-bottom:14px">Libreria completa InFormha · {total} esercizi</div>'
        + "".join(cards)
        + '<a class="btn secondary" href="./?v=0962">Indietro</a>'
        '</section></main></body></html>'
    )


# Same endpoint name and URL as the working 0.9.61 implementation.
app.view_functions["exercise_library_0958"] = lambda: Response(
    _standalone_library_0962(),
    content_type="text/html; charset=utf-8",
    headers={
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
    },
)


@app.get("/api/exercise-menu-catalog-0962-info")
def exercise_menu_catalog_info_0962():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        exercise_total=coach_library_0962.exercise_count(),
        fixed_prescriptions=False,
        guide_slots=len(coach_library_0962.guide_ids()),
        standalone_navigation_preserved=True,
    )


print(
    "[INFORMHA_EXERCISE_MENU_CATALOG] version=0.9.62 "
    f"exercises={coach_library_0962.exercise_count()} fixed_prescriptions=0",
    flush=True,
)
