FROM python:3.13-alpine

ARG BUILD_VERSION=0.3.5
ARG BUILD_ARCH=amd64

LABEL \
  io.hass.version="${BUILD_VERSION}" \
  io.hass.type="app" \
  io.hass.arch="${BUILD_ARCH}"

WORKDIR /app
RUN pip install --no-cache-dir flask==3.1.1 gunicorn==23.0.0

COPY app.py /app/app.py
COPY web /app/web
RUN sed -i 's/VERSION = "0.3.2"/VERSION = "0.3.5"/' /app/app.py \
 && for f in /app/web/guides/*.svg; do \
      sed -i 's#<svg xmlns="http://www.w3.org/2000/svg"#<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"#; s#<image href="#<image width="300" height="400" preserveAspectRatio="xMidYMid meet" xlink:href="#' "$f"; \
    done \
 && cat /app/web/guides_034.js >> /app/web/app.js

ENV PYTHONUNBUFFERED=1
EXPOSE 8099

CMD ["gunicorn", "--bind", "0.0.0.0:8099", "--workers", "1", "--threads", "4", "app:app"]
