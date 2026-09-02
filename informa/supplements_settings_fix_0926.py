import supplements_split_0923 as base
import app as root

app = base.app
root.VERSION = "0.9.26"

print("[INFORMHA_SUPPLEMENTS] version=0.9.26 settings_page_dom_fix=1 single_supplements_frontend=1", flush=True)

@app.get('/api/supplements-settings-0926-info')
def supplements_settings_info_0926():
    return root.jsonify(
        version=root.VERSION,
        settings_page_dom_fix=True,
        single_supplements_frontend=True,
    )
