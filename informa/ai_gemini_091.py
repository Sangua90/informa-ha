import json
import os
import urllib.error
import urllib.parse
import urllib.request

import ai_coach_090 as base
import app as root

app = base.app
root.VERSION = "0.9.1"

OPTIONS_FILE = "/data/options.json"
DEFAULT_MODEL = "gemini-2.5-flash"


def _options():
    try:
        with open(OPTIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _ai_config():
    opts = _options()
    provider = str(opts.get("ai_provider") or "none").strip().lower()
    model = str(opts.get("gemini_model") or DEFAULT_MODEL).strip() or DEFAULT_MODEL
    key = str(opts.get("gemini_api_key") or "").strip()
    return {"provider": provider, "model": model, "api_key": key}


def _public_settings():
    cfg = _ai_config()
    return {
        "provider": cfg["provider"],
        "model": cfg["model"],
        "configured": cfg["provider"] == "gemini" and bool(cfg["api_key"]),
        "has_api_key": bool(cfg["api_key"]),
        "providers": [
            {"id": "none", "name": "Coach locale"},
            {"id": "gemini", "name": "Google Gemini"},
        ],
        "privacy_note": "Con Gemini attivo, InFormha invia a Google solo il contesto riassunto necessario a rispondere alla domanda. La chiave API non viene inviata al browser.",
    }


def _safe_context(ctx):
    # Minimise external disclosure: no name, no raw measurements, no raw diary rows.
    training = ctx.get("training") or {}
    nutrition = ctx.get("nutrition") or {}
    supplements = ctx.get("supplements") or {}
    return {
        "training": {
            "strength_days_7d": training.get("strength_days_7d"),
            "cardio_minutes_7d": training.get("cardio_minutes_7d"),
            "sets_72h": training.get("sets_72h"),
            "fatigue_72h": training.get("fatigue_72h"),
            "recent_exercises": training.get("recent_exercises"),
            "pending_essentials": training.get("pending_essentials"),
        },
        "nutrition": {
            "today": nutrition.get("today"),
            "goals": nutrition.get("goals"),
            "entries": nutrition.get("entries"),
        },
        "supplements": {
            "active": supplements.get("active"),
            "taken_today": supplements.get("taken_today"),
            "overdue": supplements.get("overdue"),
        },
    }


def _gemini_request(question, ctx, timeout=35):
    cfg = _ai_config()
    if cfg["provider"] != "gemini":
        raise RuntimeError("Gemini non è selezionato nelle impostazioni")
    if not cfg["api_key"]:
        raise RuntimeError("API key Gemini non configurata")

    model = urllib.parse.quote(cfg["model"], safe="-._")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    safe_ctx = _safe_context(ctx)
    system_text = (
        "Sei il coach virtuale di InFormha. Rispondi in italiano, in modo pratico e conciso. "
        "Usa esclusivamente i dati riassunti forniti come contesto e non inventare valori mancanti. "
        "Per allenamento considera recupero, fatica, Essenziali sospesi e storico. "
        "Per alimentazione commenta solo obiettivi impostati e dati registrati. "
        "Non fare diagnosi, non prescrivere farmaci e non presentare consigli medici come certi. "
        "Se una domanda richiede dati che non ci sono, dillo chiaramente."
    )
    user_text = (
        "DOMANDA:\n" + question + "\n\n"
        "CONTESTO INFORMHA (JSON RIASSUNTO):\n" + json.dumps(safe_ctx, ensure_ascii=False, separators=(",", ":"))
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_text}]},
        "contents": [{"role": "user", "parts": [{"text": user_text}]}],
        "generationConfig": {"temperature": 0.35, "maxOutputTokens": 700},
    }
    req = urllib.request.Request(
        url,
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
            err = json.loads(body).get("error", {}).get("message")
        except Exception:
            err = None
        raise RuntimeError(err or f"Gemini API HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Gemini non raggiungibile: {exc.reason}") from exc

    texts = []
    for candidate in data.get("candidates") or []:
        for part in ((candidate.get("content") or {}).get("parts") or []):
            text = part.get("text")
            if text:
                texts.append(str(text).strip())
    answer = "\n".join(x for x in texts if x).strip()
    if not answer:
        block = (data.get("promptFeedback") or {}).get("blockReason")
        raise RuntimeError(f"Gemini non ha restituito testo{': ' + str(block) if block else ''}")
    return answer


@app.get('/api/ai/settings')
def ai_settings_091():
    return root.jsonify(ok=True, **_public_settings())


@app.post('/api/ai/test')
def ai_test_091():
    cfg = _ai_config()
    if cfg["provider"] == "none":
        return root.jsonify(ok=True, provider="none", connected=True, message="Coach locale attivo")
    try:
        answer = _gemini_request(
            "Rispondi soltanto con: Connessione Gemini attiva.",
            {"training": {}, "nutrition": {}, "supplements": {}},
            timeout=20,
        )
        return root.jsonify(ok=True, provider="gemini", model=cfg["model"], connected=True, message=answer[:180])
    except Exception as exc:
        return root.jsonify(ok=False, provider="gemini", model=cfg["model"], connected=False, error=str(exc)), 502


# Replace the 0.9.0 ask handler while preserving the same route.
def ai_coach_ask_091():
    x = root.request.get_json(silent=True) or {}
    question = str(x.get("question") or "").strip()
    if not question:
        return root.jsonify(ok=False, error="Scrivi una domanda"), 400

    ctx = base._coach_context_090()
    cfg = _ai_config()
    if cfg["provider"] == "gemini" and cfg["api_key"]:
        try:
            answer = _gemini_request(question, ctx)
            return root.jsonify(
                ok=True,
                question=question,
                answer=answer,
                mode="gemini",
                provider="gemini",
                model=cfg["model"],
                llm_connected=True,
                fallback=False,
                context_generated_at=ctx["generated_at"],
            )
        except Exception as exc:
            # Keep InFormha usable if the external provider is unavailable.
            local = base._build_advice_090(ctx)
            q = question.lower()
            if any(k in q for k in ("allen", "palestra", "eserc", "recuper", "forza")):
                relevant = [p for p in local["priorities"] if p["area"] in ("Allenamento", "Essenziali")]
            elif any(k in q for k in ("mang", "aliment", "calor", "protein", "carbo", "grassi", "acqua")):
                relevant = [p for p in local["priorities"] if p["area"] in ("Alimentazione", "Idratazione")]
            elif any(k in q for k in ("integr", "creatina", "supplement")):
                relevant = [p for p in local["priorities"] if p["area"] == "Integratori"]
            else:
                relevant = local["priorities"][:3]
            local_answer = " ".join(p["text"] for p in relevant) if relevant else local["headline"]
            return root.jsonify(
                ok=True,
                question=question,
                answer=local_answer,
                mode="local_fallback",
                provider="gemini",
                model=cfg["model"],
                llm_connected=False,
                fallback=True,
                provider_error=str(exc),
                context_generated_at=ctx["generated_at"],
            )

    # Local coach when no external provider is selected/configured.
    local = base._build_advice_090(ctx)
    q = question.lower()
    if any(k in q for k in ("allen", "palestra", "eserc", "recuper", "forza")):
        relevant = [p for p in local["priorities"] if p["area"] in ("Allenamento", "Essenziali")]
    elif any(k in q for k in ("mang", "aliment", "calor", "protein", "carbo", "grassi", "acqua")):
        relevant = [p for p in local["priorities"] if p["area"] in ("Alimentazione", "Idratazione")]
    elif any(k in q for k in ("integr", "creatina", "supplement")):
        relevant = [p for p in local["priorities"] if p["area"] == "Integratori"]
    else:
        relevant = local["priorities"][:3]
    answer = " ".join(p["text"] for p in relevant) if relevant else local["headline"]
    return root.jsonify(
        ok=True,
        question=question,
        answer=answer,
        mode="local_adaptive_engine",
        provider="none",
        llm_connected=False,
        fallback=False,
        context_generated_at=ctx["generated_at"],
    )


app.view_functions['ai_coach_ask_090'] = ai_coach_ask_091
