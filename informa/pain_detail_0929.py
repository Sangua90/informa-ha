import workout_activation_0928 as base
import app as root

app = base.app
root.VERSION = "0.9.29"

print("[INFORMHA_PAIN] version=0.9.29 pain_detail=1 checkin_payload=1", flush=True)

@app.get('/api/pain-detail-0929-info')
def pain_detail_info_0929():
    return root.jsonify(
        version=root.VERSION,
        pain_detail=True,
        checkin_payload=True,
    )
