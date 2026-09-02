import warmup_stretching_0931 as base
import app as root

app = base.app
root.VERSION = "0.9.32"

print("[INFORMHA_WARMUP_UI] version=0.9.32 existing_checkin_injection=1", flush=True)

@app.get('/api/warmup-ui-fix-0932-info')
def warmup_ui_fix_info_0932():
    return root.jsonify(version=root.VERSION, existing_checkin_injection=True)
