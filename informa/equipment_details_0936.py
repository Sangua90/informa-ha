import healthsync_relocate_0935 as base
import app as root

app = base.app
root.VERSION = "0.9.36"

print("[INFORMHA_EQUIPMENT] version=0.9.36 equipment_details=1 real_setup=1", flush=True)

@app.get('/api/equipment-0936-info')
def equipment_0936_info():
    return root.jsonify(version=root.VERSION, equipment_details=True, real_setup=True)
