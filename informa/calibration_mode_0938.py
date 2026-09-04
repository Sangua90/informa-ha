import calibration_mode_0937 as base
import app as root

app = base.app
root.VERSION = "0.9.38"


@app.get('/api/calibration-0938')
def calibration_0938():
    status = base._calibration_status()
    return root.jsonify(ok=True, version=root.VERSION, **status)


print("[INFORMHA_CALIBRATION_FIX] version=0.9.38 persistent_home_counter=1", flush=True)
