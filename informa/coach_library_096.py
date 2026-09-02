import coach_library_094 as base
import app as root

app = base.app
root.VERSION = "0.9.8"

# Remove the legacy backend HTML injector from coach_patch_060.
for scope, funcs in list(app.after_request_funcs.items()):
    app.after_request_funcs[scope] = [
        fn for fn in funcs if getattr(fn, "__name__", "") != "force_exercises_menu"
    ]

GROUPS = [
    ("Petto", [
        ("Chest press alla macchina", "3 × 10"),
        ("Aperture / pec deck alla macchina", "3 × 12"),
    ]),
    ("Schiena", [
        ("Lat machine al petto", "3 × 10"),
        ("Lat machine presa stretta", "3 × 10"),
        ("Lat machine presa inversa", "3 × 10"),
        ("Pull-down a braccia tese", "3 × 12"),
        ("Rematore al cavo basso", "3 × 10"),
        ("Rematore monobraccio al cavo basso", "3 × 10"),
        ("Rematore al cavo medio", "3 × 10"),
    ]),
    ("Spalle", [
        ("Shoulder press", "3 × 10"),
        ("Alzate laterali", "3 × 12"),
        ("Face pull con corda", "3 × 12"),
        ("Tirata al mento al cavo basso", "3 × 12"),
        ("Alzata frontale al cavo basso", "3 × 12"),
    ]),
    ("Tricipiti", [
        ("Push-down tricipiti con corda", "3 × 12"),
        ("Push-down tricipiti con barra", "3 × 12"),
        ("Estensione tricipiti sopra la testa", "3 × 12"),
        ("Push-down tricipiti monobraccio", "3 × 12"),
    ]),
    ("Bicipiti e avambracci", [
        ("Curl bicipiti al cavo basso", "3 × 12"),
        ("Hammer curl con corda", "3 × 12"),
        ("Curl bicipiti monobraccio", "3 × 12"),
        ("Reverse curl al cavo basso", "3 × 12"),
    ]),
    ("Gambe", [
        ("Goblet squat a box/panca", "3 × 10"),
        ("Leg extension alla macchina", "3 × 12"),
        ("Squat al cavo basso", "3 × 10"),
    ]),
    ("Catena posteriore", [
        ("Stacco rumeno con manubri", "3 × 10"),
        ("Leg curl in piedi al cavo", "3 × 12"),
        ("Stacco rumeno al cavo basso", "3 × 10"),
    ]),
    ("Glutei", [
        ("Ponte glutei su panca", "3 × 12"),
        ("Glute kickback al cavo basso", "3 × 12"),
    ]),
    ("Polpacci", [
        ("Calf raise in piedi", "3 × 15"),
        ("Calf raise al cavo basso", "3 × 15"),
    ]),
    ("Core", [
        ("Plank", "3 × 30 sec"),
        ("Crunch al cavo alto", "3 × 12"),
    ]),
    ("Cardio", [
        ("Tapis roulant Fassi", "20 min"),
        ("Mini stepper", "10 min"),
    ]),
]


def _exercise_page():
    cards = []
    total = 0
    for group, items in GROUPS:
        total += len(items)
        rows = "".join(
            f'<div class="measure"><span>{name}</span><b>{prescription}</b></div>'
            for name, prescription in items
        )
        cards.append(f'<div class="card"><div class="ey">{group}</div>{rows}</div>')
    return (
        '<section class="page" data-page="exercises-static">'
        '<div class="ey">Altro</div><h1>Esercizi</h1>'
        f'<div class="sub" style="margin-bottom:14px">Libreria completa InFormha · {total} esercizi · build 0.9.8</div>'
        + "".join(cards)
        + '<button class="btn secondary" onclick="go(\'profile\')">Indietro</button></section>'
    )


EXERCISES_PAGE_096 = _exercise_page()


@app.after_request
def exercises_backend_096(response):
    try:
        if "text/html" in response.headers.get("Content-Type", ""):
            html = response.get_data(as_text=True)
            start = html.find('<section class="page" data-page="exercises-static">')
            if start >= 0:
                end = html.find('</section>', start)
                if end >= 0:
                    html = html[:start] + html[end + len('</section>'):]
            marker = '<section class="page" data-page="profiledata">'
            html = html.replace(marker, EXERCISES_PAGE_096 + "\n" + marker, 1)
            html = html.replace("go('exercises')", "go('exercises-static')")
            html = html.replace("go(\"exercises\")", "go(\"exercises-static\")")
            response.set_data(html)
        if root.request.path in ("/", "/app.js", "/style.css"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
    except Exception:
        pass
    return response
