FROM python:3.13-alpine

ARG BUILD_VERSION=0.9.10
ARG BUILD_ARCH=amd64
ARG INFORMA_CACHE_BUST=0.9.10-visible-36

LABEL \
  io.hass.version="${BUILD_VERSION}" \
  io.hass.type="app" \
  io.hass.arch="${BUILD_ARCH}"

WORKDIR /app
RUN pip install --no-cache-dir flask==3.1.1 gunicorn==23.0.0 pillow==11.3.0

COPY app.py /app/app.py
COPY guide_patch.py /app/guide_patch.py
COPY coach_patch_060.py /app/coach_patch_060.py
COPY coach_progression_068.py /app/coach_progression_068.py
COPY coach_week_069.py /app/coach_week_069.py
COPY coach_advance_070.py /app/coach_advance_070.py
COPY coach_resume_072.py /app/coach_resume_072.py
COPY coach_search_073.py /app/coach_search_073.py
COPY coach_guides_074.py /app/coach_guides_074.py
COPY coach_refine_075.py /app/coach_refine_075.py
COPY nutrition_080.py /app/nutrition_080.py
COPY supplements_081.py /app/supplements_081.py
COPY ai_coach_090.py /app/ai_coach_090.py
COPY ai_gemini_091.py /app/ai_gemini_091.py
COPY ai_gemini_092.py /app/ai_gemini_092.py
COPY ai_context_093.py /app/ai_context_093.py
COPY coach_library_094.py /app/coach_library_094.py
COPY coach_library_096.py /app/coach_library_096.py
COPY coach_diag_099.py /app/coach_diag_099.py
COPY web /app/web
RUN test "$(grep -c "^    \\['" /app/web/interface_063.js)" -eq 36 \
 && grep -Fq "build 0.9.10" /app/web/interface_063.js \
 && printf '%s\n' "InFormha 0.9.10 visible-library-36" > /app/BUILD_ID \
 && echo "$INFORMA_CACHE_BUST" >> /app/BUILD_ID
RUN cat /app/web/guides_034.js >> /app/web/app.js \
 && cat /app/web/guides_038.js >> /app/web/app.js \
 && cat /app/web/guides_039.js >> /app/web/app.js \
 && cat /app/web/guides_040.js >> /app/web/app.js \
 && cat /app/web/coach_full_050.js >> /app/web/app.js \
 && cat /app/web/fullbody_051.js >> /app/web/app.js \
 && cat /app/web/coach_controls_060.js >> /app/web/app.js \
 && cat /app/web/interface_061.js >> /app/web/app.js \
 && cat /app/web/interface_063.js >> /app/web/app.js \
 && cat /app/web/exercise_gallery_066.js >> /app/web/app.js \
 && cat /app/web/workout_ui_067.js >> /app/web/app.js \
 && cat /app/web/progression_068.js >> /app/web/app.js \
 && cat /app/web/week_069.js >> /app/web/app.js \
 && cat /app/web/advance_070.js >> /app/web/app.js \
 && cat /app/web/pain_071.js >> /app/web/app.js \
 && cat /app/web/resume_072.js >> /app/web/app.js \
 && cat /app/web/muscle_search_073.js >> /app/web/app.js \
 && cat /app/web/guide_ui_074.js >> /app/web/app.js \
 && cat /app/web/coach_refine_075.js >> /app/web/app.js \
 && cat /app/web/nutrition_080.js >> /app/web/app.js \
 && cat /app/web/supplements_081.js >> /app/web/app.js \
 && cat /app/web/ai_coach_090.js >> /app/web/app.js \
 && cat /app/web/ai_gemini_091.js >> /app/web/app.js \
 && cat /app/web/ai_context_093.js >> /app/web/app.js \
 && cat /app/web/library_094.js >> /app/web/app.js

ENV PYTHONUNBUFFERED=1
EXPOSE 8099

CMD ["gunicorn", "--bind", "0.0.0.0:8099", "--workers", "1", "--threads", "4", "coach_diag_099:app"]
