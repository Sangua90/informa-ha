from pathlib import Path
from flask import Response, send_from_directory
import base64
import re
import app as base

base.VERSION = "0.3.9"
app = base.app
GUIDE_DIR = Path("/app/web/guides")
GUIDE_HD_DIR = Path("/app/web/guides_hd")

@app.get("/guide-image/<name>.jpg")
def guide_jpeg(name):
    safe = Path(name).name
    if safe not in {"chest", "lat", "pushdown", "curl"}:
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
    safe = Path(name).name
    if safe not in {"chest", "lat", "pushdown", "curl"}:
        return Response("Not found", status=404)
    return send_from_directory(GUIDE_HD_DIR, f"{safe}.svg", mimetype="image/svg+xml", max_age=0)
