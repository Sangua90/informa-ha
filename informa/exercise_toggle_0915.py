from pathlib import Path
import json
import threading
from flask import request

import guide_manager_0914 as base
import app as root

app = base.app
root.VERSION = "0.9.15"

EXERCISE_IDS = set(base.GUIDE_IDS_36)
STATE_FILE = Path("/data/exercise_enabled.json")
_LOCK = threading.Lock()


def _default_state():
    return {exercise_id: True for exercise_id in sorted(EXERCISE_IDS)}


def _load_state():
    state = _default_state()
    if STATE_FILE.exists():
        try:
            saved = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            if isinstance(saved, dict):
                for exercise_id in EXERCISE_IDS:
                    if exercise_id in saved:
                        state[exercise_id] = bool(saved[exercise_id])
        except Exception:
            pass
    return state


def _save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(STATE_FILE)


with _LOCK:
    if not STATE_FILE.exists():
        _save_state(_default_state())


@app.get("/api/exercise-enabled")
def exercise_enabled_status_0915():
    with _LOCK:
        state = _load_state()
    return root.jsonify(
        ok=True,
        version=root.VERSION,
        total=len(EXERCISE_IDS),
        enabled=sum(1 for value in state.values() if value),
        exercises=state,
    )


@app.post("/api/exercise-enabled/<exercise_id>")
def exercise_enabled_set_0915(exercise_id):
    if exercise_id not in EXERCISE_IDS:
        return root.jsonify(ok=False, error="Esercizio non valido"), 404
    payload = request.get_json(force=True, silent=True) or {}
    if "enabled" not in payload:
        return root.jsonify(ok=False, error="Campo enabled mancante"), 400
    enabled = bool(payload.get("enabled"))
    with _LOCK:
        state = _load_state()
        state[exercise_id] = enabled
        _save_state(state)
    return root.jsonify(
        ok=True,
        exercise=exercise_id,
        enabled=enabled,
        enabled_count=sum(1 for value in state.values() if value),
        total=len(EXERCISE_IDS),
    )


print(
    f"[INFORMHA_EXERCISES] version={root.VERSION} total={len(EXERCISE_IDS)} persistent_toggle=1",
    flush=True,
)
