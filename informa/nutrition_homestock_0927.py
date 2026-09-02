import supplements_settings_fix_0926 as base
import app as root

app = base.app
root.VERSION = "0.9.27"

print("[INFORMHA_NUTRITION] version=0.9.27 homestock_catalog=1 nutrition_targets_settings=1", flush=True)

@app.get('/api/nutrition-0927-info')
def nutrition_info_0927():
    return root.jsonify(
        version=root.VERSION,
        homestock_catalog=True,
        nutrition_targets_settings=True,
    )
