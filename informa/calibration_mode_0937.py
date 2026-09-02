import equipment_details_0936 as base
import app as root

app = base.app
root.VERSION = "0.9.37"


def _calibration_status():
    con = root.db()
    row = con.execute(
        """SELECT COUNT(*) AS c FROM (
               SELECT w.id
               FROM workouts w
               JOIN sets s ON s.workout_id=w.id
               GROUP BY w.id
               HAVING COUNT(s.id) > 0
           )"""
    ).fetchone()
    con.close()
    valid = int(row["c"] if row else 0)
    target = 3
    adaptive = valid >= target
    return {
        "valid_workouts": valid,
        "target": target,
        "remaining": max(0, target - valid),
        "mode": "Adattiva" if adaptive else "Calibrazione",
        "adaptive": adaptive,
    }


@app.get('/api/calibration-0937')
def calibration_0937():
    return root.jsonify(ok=True, version=root.VERSION, **_calibration_status())


print("[INFORMHA_CALIBRATION] version=0.9.37 valid_workouts_target=3 adaptive_after=3", flush=True)
