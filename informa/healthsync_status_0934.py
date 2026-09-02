import workout_history_0933 as base
import app as root

app = base.app
root.VERSION = "0.9.34"

print("[INFORMHA_HEALTHSYNC] version=0.9.34 status_ui=1 existing_backend=1", flush=True)

@app.get('/api/healthsync-0934-info')
def healthsync_0934_info():
    return root.jsonify(version=root.VERSION, status_ui=True, existing_backend=True)
