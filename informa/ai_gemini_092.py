import json
import urllib.error
import urllib.request

import ai_gemini_091 as base
import app as root

app = base.app
root.VERSION = "0.9.2"

DEFAULT_MODEL = "gemini-3.6-flash"
LEGACY_MODELS = {"gemini-2.5-flash"}


def _ai_config_092():
    opts = base._options()
    provider = str(opts.get("ai_provider") or "none").strip().lower()
    model = str(opts.get("gemini_model") or DEFAULT_MODEL).strip() or DEFAULT_MODEL
    # Existing 0.9.1 installs keep their options.json after an update. Migrate the
    # obsolete default in memory so the user does not have to edit it manually.
    if model in LEGACY_MODELS:
        model = DEFAULT_MODEL
    key = str(opts.get("gemini_api_key") or "").strip()
    return {"provider": provider, "model": model, "api_key": key}


def _extract_interaction_text(data):
    texts = []
    for step in data.get("steps") or []:
        if step.get("type") != "model_output":
            continue
        for part in step.get("content") or []:
            if part.get("type") == "text" and part.get("text"):
                texts.append(str(part.get("text")).strip())
    return "\n".join(x for x in texts if x).strip()


def _gemini_request_092(question, ctx, timeout=35):
    cfg = _ai_config_092()
    if cfg["provider"] != "gemini":
        raise RuntimeError("Gemini non è selezionato nelle impostazioni")
    if not cfg["api_key"]:
        raise RuntimeError("API key Gemini non configurata")

    safe_ctx = base._safe_context(ctx)
    system_text = (
        "Sei il coach virtuale di InFormha. Rispondi in italiano, in modo pratico e conciso. "
        "Usa esclusivamente i dati riassunti forniti come contesto e non inventare valori mancanti. "
        "Per allenamento considera recupero, fatica, Essenziali sospesi e storico. "
        "Per alimentazione commenta solo obiettivi impostati e dati registrati. "
        "Non fare diagnosi, non prescrivere farmaci e non presentare consigli medici come certi. "
        "Se una domanda richiede dati che non ci sono, dillo chiaramente."
    )
    user_text = (
        "DOMANDA:\n" + str(question) + "\n\n"
        "CONTESTO INFORMHA (JSON RIASSUNTO):\n" +
        json.dumps(safe_ctx, ensure_ascii=False, separators=(",", ":"))
    )

    payload = {
        "model": cfg["model"],
        "input": user_text,
        "system_instruction": system_text,
        "store": False,
        "generation_config": {
            "max_output_tokens": 700,
            "thinking_level": "low"
        }
    }
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": cfg["api_key"],
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body)
            err = (parsed.get("error") or {}).get("message")
        except Exception:
            err = None
        raise RuntimeError(err or f"Gemini Interactions API HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Gemini non raggiungibile: {exc.reason}") from exc

    if str(data.get("status") or "").lower() == "failed":
        err = data.get("error") or {}
        raise RuntimeError(err.get("message") or "Interazione Gemini non riuscita")

    answer = _extract_interaction_text(data)
    if not answer:
        raise RuntimeError("Gemini non ha restituito testo")
    return answer


# The 0.9.1 Flask handlers resolve these names from their module at call time,
# therefore replacing them here upgrades test + chat without duplicate routes.
base.DEFAULT_MODEL = DEFAULT_MODEL
base._ai_config = _ai_config_092
base._gemini_request = _gemini_request_092
