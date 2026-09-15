import html

import app as root
import coach_library_096
import exercise_menu_fix_0957 as base


app = base.app
root.VERSION = "0.9.58"


def _standalone_library():
    cards = []
    total = 0
    for group, items in coach_library_096.GROUPS:
        total += len(items)
        rows = "".join(
            '<div class="measure"><span>{}</span><b>{}</b></div>'.format(
                html.escape(name), html.escape(prescription)
            )
            for name, prescription in items
        )
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
        '<link rel="stylesheet" href="style.css?v=0958">'
        '</head><body><main class="app">'
        '<div class="top"><div class="brand"><span class="in">In</span>'
        '<span class="form">Form</span><span class="ha">Ha</span></div>'
        '<div class="avatar">E</div></div>'
        '<section class="page active" data-page="exercises-server">'
        '<div class="ey">Altro</div><h1>Esercizi</h1>'
        f'<div class="sub" style="margin-bottom:14px">Libreria completa InFormha · {total} esercizi</div>'
        + "".join(cards)
        + '<a class="btn secondary" href="./?v=0958">Indietro</a>'
        '</section></main></body></html>'
    )


@app.get("/exercise-library-0958")
def exercise_library_0958():
    return root.Response(
        _standalone_library(),
        content_type="text/html; charset=utf-8",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


@app.get("/api/exercise-menu-fix-0958-info")
def exercise_menu_fix_info_0958():
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        server_navigation=True,
        javascript_independent=True,
        cache_busted_assets=True,
        exercise_total=sum(len(items) for _, items in coach_library_096.GROUPS),
    )


print(
    "[INFORMHA_EXERCISE_MENU_FIX] version=0.9.58 "
    "server_navigation=1 javascript_independent=1 cache_busted_assets=1 exercise_total=24",
    flush=True,
)
