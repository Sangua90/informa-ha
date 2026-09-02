import nutrition_homestock_0927 as base
import app as root

app = base.app
root.VERSION = "0.9.28"

print("[INFORMHA_WORKOUT] version=0.9.28 home_preparation_unlock=1 finish_relock=1", flush=True)

@app.get('/api/workout-activation-0928-info')
def workout_activation_info_0928():
    return root.jsonify(
        version=root.VERSION,
        home_preparation_unlock=True,
        finish_relock=True,
    )
