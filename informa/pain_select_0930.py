import pain_detail_0929 as base
import app as root

app = base.app
root.VERSION = "0.9.30"

print("[INFORMHA_PAIN] version=0.9.30 pain_zone_selector=1", flush=True)

@app.get('/api/pain-select-0930-info')
def pain_select_info_0930():
    return root.jsonify(
        version=root.VERSION,
        pain_zone_selector=True,
    )
