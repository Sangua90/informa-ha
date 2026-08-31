from datetime import date, timedelta
import coach_refine_075 as base
import app as root

app = base.app
root.VERSION = "0.8.0"


def _init_nutrition_080():
    con = root.db()
    con.execute("""
        CREATE TABLE IF NOT EXISTS nutrition_goals(
          id INTEGER PRIMARY KEY CHECK(id=1),
          calories REAL,
          protein_g REAL,
          carbs_g REAL,
          fat_g REAL,
          fiber_g REAL,
          water_ml REAL
        )
    """)
    con.execute("INSERT OR IGNORE INTO nutrition_goals(id) VALUES(1)")
    con.commit(); con.close()


_init_nutrition_080()


def _goals():
    con = root.db()
    row = con.execute("SELECT calories,protein_g,carbs_g,fat_g,fiber_g,water_ml FROM nutrition_goals WHERE id=1").fetchone()
    con.close()
    return dict(row) if row else {}


@app.get('/api/nutrition/goals')
def nutrition_goals_get_080():
    return root.jsonify(ok=True, goals=_goals())


@app.post('/api/nutrition/goals')
def nutrition_goals_save_080():
    x = root.request.get_json(silent=True) or {}
    keys = ('calories','protein_g','carbs_g','fat_g','fiber_g','water_ml')
    values = []
    for key in keys:
        raw = x.get(key)
        if raw in (None, ''):
            values.append(None)
            continue
        try:
            value = float(raw)
        except (TypeError, ValueError):
            return root.jsonify(ok=False, error=f'Valore non valido: {key}'), 400
        if value < 0:
            return root.jsonify(ok=False, error=f'Valore non valido: {key}'), 400
        values.append(value)
    con = root.db()
    con.execute(
        "UPDATE nutrition_goals SET calories=?,protein_g=?,carbs_g=?,fat_g=?,fiber_g=?,water_ml=? WHERE id=1",
        values
    )
    con.commit(); con.close()
    return root.jsonify(ok=True, goals=_goals())


@app.delete('/api/nutrition/entry/<int:entry_id>')
def nutrition_delete_entry_080(entry_id):
    con = root.db()
    row = con.execute("SELECT id FROM nutrition_entries WHERE id=?", (entry_id,)).fetchone()
    if not row:
        con.close()
        return root.jsonify(ok=False, error='Registrazione non trovata'), 404
    con.execute("DELETE FROM nutrition_entries WHERE id=?", (entry_id,))
    con.commit(); con.close()
    return root.jsonify(ok=True, today=root.nutrition_today())


@app.get('/api/nutrition/week')
def nutrition_week_080():
    start = date.today() - timedelta(days=6)
    con = root.db()
    rows = [dict(r) for r in con.execute(
        """SELECT substr(ts,1,10) AS day,
                  COUNT(*) AS entries,
                  COALESCE(SUM(calories),0) AS calories,
                  COALESCE(SUM(protein_g),0) AS protein_g,
                  COALESCE(SUM(carbs_g),0) AS carbs_g,
                  COALESCE(SUM(fat_g),0) AS fat_g,
                  COALESCE(SUM(fiber_g),0) AS fiber_g,
                  COALESCE(SUM(water_ml),0) AS water_ml
           FROM nutrition_entries
           WHERE substr(ts,1,10)>=?
           GROUP BY substr(ts,1,10)
           ORDER BY day""",
        (start.isoformat(),)
    )]
    con.close()
    by_day = {r['day']: r for r in rows}
    days = []
    for i in range(7):
        d = (start + timedelta(days=i)).isoformat()
        days.append(by_day.get(d, {
            'day': d, 'entries': 0, 'calories': 0, 'protein_g': 0,
            'carbs_g': 0, 'fat_g': 0, 'fiber_g': 0, 'water_ml': 0
        }))
    active = [d for d in days if int(d.get('entries') or 0) > 0]
    averages = {}
    for key in ('calories','protein_g','carbs_g','fat_g','fiber_g','water_ml'):
        averages[key] = round(sum(float(d.get(key) or 0) for d in active) / len(active), 1) if active else 0
    return root.jsonify(ok=True, days=days, active_days=len(active), averages=averages, goals=_goals())
