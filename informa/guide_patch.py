from pathlib import Path
from flask import Response, jsonify, request, send_from_directory
import base64
import re
import app as base

base.VERSION = "0.4.1"
app = base.app
GUIDE_DIR = Path("/app/web/guides")
GUIDE_HD_DIR = Path("/app/web/guides_hd")
USER_GUIDE_DIR = Path("/data/guides")
USER_GUIDE_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_GUIDES = {"chest", "lat", "pushdown", "curl"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MIMES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def _safe_guide(name):
    safe = Path(str(name or "")).name
    return safe if safe in ALLOWED_GUIDES else None


def _user_guide_path(name):
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        p = USER_GUIDE_DIR / f"{name}{ext}"
        if p.exists():
            return p
    return None

@app.get("/guide-image/<name>.jpg")
def guide_jpeg(name):
    safe = _safe_guide(name)
    if not safe:
        return Response("Not found", status=404)
    path = GUIDE_DIR / f"{safe}.svg"
    if not path.exists():
        return Response("Not found", status=404)
    text = path.read_text(encoding="utf-8")
    match = re.search(r"data:image/jpeg;base64,([^\"']+)", text)
    if not match:
        return Response("Image data missing", status=500)
    try:
        data = base64.b64decode(match.group(1), validate=False)
    except Exception:
        return Response("Invalid image data", status=500)
    return Response(data, mimetype="image/jpeg", headers={"Cache-Control": "no-store"})

@app.get("/guide-hd/<name>.svg")
def guide_hd(name):
    safe = _safe_guide(name)
    if not safe:
        return Response("Not found", status=404)
    return send_from_directory(GUIDE_HD_DIR, f"{safe}.svg", mimetype="image/svg+xml", max_age=0)

@app.get("/guide-local/<name>")
def guide_local(name):
    safe = _safe_guide(name)
    if not safe:
        return Response("Not found", status=404)
    path = _user_guide_path(safe)
    if not path:
        return Response("Guida personalizzata non caricata", status=404)
    return send_from_directory(USER_GUIDE_DIR, path.name, mimetype=MIMES.get(path.suffix.lower(), "application/octet-stream"), max_age=0)

@app.get("/api/guides")
def guide_status():
    out = {}
    for name in sorted(ALLOWED_GUIDES):
        path = _user_guide_path(name)
        out[name] = {
            "installed": bool(path),
            "filename": path.name if path else None,
            "size": path.stat().st_size if path else 0,
        }
    return jsonify(ok=True, guides=out)

@app.post("/api/guides/<name>")
def guide_upload(name):
    safe = _safe_guide(name)
    if not safe:
        return jsonify(ok=False, error="Guida non valida"), 404
    if "image" not in request.files:
        return jsonify(ok=False, error="Immagine mancante"), 400
    f = request.files["image"]
    ext = Path(f.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        return jsonify(ok=False, error="Usa JPG, PNG o WebP"), 400
    for old_ext in ALLOWED_EXTS:
        old = USER_GUIDE_DIR / f"{safe}{old_ext}"
        if old.exists():
            old.unlink()
    target = USER_GUIDE_DIR / f"{safe}{ext}"
    f.save(target)
    return jsonify(ok=True, guide=safe, filename=target.name, size=target.stat().st_size)

@app.delete("/api/guides/<name>")
def guide_delete(name):
    safe = _safe_guide(name)
    if not safe:
        return jsonify(ok=False, error="Guida non valida"), 404
    path = _user_guide_path(safe)
    if path:
        path.unlink()
    return jsonify(ok=True, guide=safe)
