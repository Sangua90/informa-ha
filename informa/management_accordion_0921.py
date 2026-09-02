import compact_management_0920 as base
import app as root

app = base.app
root.VERSION = "0.9.21"

print("[INFORMHA_MANAGEMENT] version=0.9.21 native_accordion=1 single_frontend=1", flush=True)

@app.get('/api/management-0921-info')
def management_info_0921():
    return root.jsonify(
        version=root.VERSION,
        native_accordion=True,
        single_frontend=True,
    )
