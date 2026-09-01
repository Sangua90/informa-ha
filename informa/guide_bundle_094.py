from pathlib import Path
import shutil
import ai_context_093 as base
import app as root

app = base.app
root.VERSION = "0.9.4"

BUNDLED = Path('/app/web/guides_default')
TARGET = Path('/data/guides')
MARKER = TARGET / '.bundle_094_installed'


def install_bundle_094():
    TARGET.mkdir(parents=True, exist_ok=True)
    if MARKER.exists():
        return
    for name in ('chest','lat','curl','pushdown'):
        src = BUNDLED / f'{name}.webp'
        if not src.exists():
            continue
        for ext in ('.jpg','.jpeg','.png','.webp'):
            old = TARGET / f'{name}{ext}'
            if old.exists():
                old.unlink()
        shutil.copyfile(src, TARGET / f'{name}.webp')
    MARKER.write_text('0.9.4', encoding='utf-8')

install_bundle_094()
