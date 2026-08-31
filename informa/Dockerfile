FROM python:3.13-alpine

ARG BUILD_VERSION=0.6.5
ARG BUILD_ARCH=amd64

LABEL \
  io.hass.version="${BUILD_VERSION}" \
  io.hass.type="app" \
  io.hass.arch="${BUILD_ARCH}"

WORKDIR /app
RUN pip install --no-cache-dir flask==3.1.1 gunicorn==23.0.0 pillow==11.3.0

COPY app.py /app/app.py
COPY guide_patch.py /app/guide_patch.py
COPY coach_patch_060.py /app/coach_patch_060.py
COPY web /app/web
RUN cat /app/web/guides_034.js >> /app/web/app.js \
 && cat /app/web/guides_038.js >> /app/web/app.js \
 && cat /app/web/guides_039.js >> /app/web/app.js \
 && cat /app/web/guides_040.js >> /app/web/app.js \
 && cat /app/web/coach_full_050.js >> /app/web/app.js \
 && cat /app/web/fullbody_051.js >> /app/web/app.js \
 && cat /app/web/coach_controls_060.js >> /app/web/app.js \
 && cat /app/web/interface_061.js >> /app/web/app.js \
 && cat /app/web/interface_063.js >> /app/web/app.js

ENV PYTHONUNBUFFERED=1
EXPOSE 8099

CMD ["gunicorn", "--bind", "0.0.0.0:8099", "--workers", "1", "--threads", "4", "coach_patch_060:app"]
