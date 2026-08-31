from pathlib import Path
from flask import Response
import app as base

base.VERSION = "0.3.7"
app = base.app
GUIDE_DIR = Path("/app/web/guides")

@app.get("/guides/<path:filename>")
def guide_asset(filename):
    safe = Path(filename).name
    path = GUIDE_DIR / safe
    if not path.exists() or path.suffix.lower() != ".svg":
        return Response("Not found", status=404)
    text = path.read_text(encoding="utf-8")
    if "xmlns:xlink=" not in text:
        text = text.replace(
            '<svg xmlns="http://www.w3.org/2000/svg"',
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
            1,
        )
    text = text.replace(
        '<image href="',
        '<image width="300" height="400" preserveAspectRatio="xMidYMid meet" xlink:href="',
        1,
    )
    return Response(text, mimetype="image/svg+xml", headers={"Cache-Control": "no-store"})
