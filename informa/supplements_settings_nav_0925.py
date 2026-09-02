import supplements_settings_nav_0924 as base
import app as root

app = base.app
root.VERSION = "0.9.25"

print("[INFORMHA_SUPPLEMENTS] version=0.9.25 profile_integratori_anywhere=1 direct_onclick=1", flush=True)

@app.get('/api/supplements-settings-nav-0925-info')
def supplements_settings_nav_info_0925():
    return root.jsonify(
        version=root.VERSION,
        profile_integratori_anywhere=True,
        direct_onclick=True,
    )
