import healthsync_status_0934 as base
import app as root

app = base.app
root.VERSION = "0.9.35"

print("[INFORMHA_HEALTHSYNC] version=0.9.35 relocated_to_apple_card=1 duplicate_removed=1", flush=True)

@app.get('/api/healthsync-0935-info')
def healthsync_0935_info():
    return root.jsonify(version=root.VERSION, relocated_to_apple_card=True, duplicate_removed=True)
