import management_accordion_0921 as base
import app as root

app = base.app
root.VERSION = "0.9.22"

print("[INFORMHA_GUIDES_UI] version=0.9.22 legacy_upload_manager_removed=1 accordion_preserved=1", flush=True)

@app.get('/api/management-0922-info')
def management_info_0922():
    return root.jsonify(
        version=root.VERSION,
        legacy_upload_manager_removed=True,
        accordion_preserved=True,
    )
