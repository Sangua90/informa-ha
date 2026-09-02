import supplements_split_0923 as base
import app as root

app = base.app
root.VERSION = "0.9.24"

print("[INFORMHA_SUPPLEMENTS] version=0.9.24 settings_nav_capture=1", flush=True)

@app.get('/api/supplements-0924-info')
def supplements_info_0924():
    return root.jsonify(version=root.VERSION, settings_nav_capture=True)
