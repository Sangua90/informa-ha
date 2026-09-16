FROM python:3.13-alpine

ARG BUILD_VERSION=0.9.63
ARG BUILD_ARCH=amd64
ARG INFORMA_CACHE_BUST=0.9.63-guide-manager-37

LABEL \
  io.hass.version="${BUILD_VERSION}" \
  io.hass.type="app" \
  io.hass.arch="${BUILD_ARCH}"

WORKDIR /app
RUN pip install --no-cache-dir flask==3.1.1 gunicorn==23.0.0 pillow==11.3.0 websocket-client==1.8.0

COPY *.py /app/
COPY web /app/web

RUN grep -Fq 'Expected 37 exercises' /app/coach_library_0962.py \
 && grep -Fq 'fixed_prescriptions=False' /app/exercise_menu_catalog_0962.py \
 && grep -Fq 'registered_guide_ids=len(CATALOG_GUIDES)' /app/exercise_guides_catalog_0962.py \
 && grep -Fq 'CATALOG.length!==37' /app/web/guide_manager_0963.js \
 && grep -Fq 'Reverse curl con manubri' /app/coach_library_0962.py \
 && python -c "import coach_library_0962 as c; assert c.exercise_count() == 37; assert len(c.guide_ids()) == 37" \
 && printf '%s\n' "InFormha 0.9.63 guide-manager-37" > /app/BUILD_ID \
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
 && cat /app/web/coach_refine_075.js >> /app/web/app.js \
 && cat /app/web/nutrition_080.js >> /app/web/app.js \
 && cat /app/web/ai_coach_090.js >> /app/web/app.js \
 && cat /app/web/ai_gemini_091.js >> /app/web/app.js \
 && cat /app/web/ai_context_093.js >> /app/web/app.js \
 && cat /app/web/library_094.js >> /app/web/app.js \
 && cat /app/web/profile_sections_0912.js >> /app/web/app.js \
 && cat /app/web/load_fields_0913.js >> /app/web/app.js \
 && cat /app/web/management_accordion_0921.js >> /app/web/app.js \
 && cat /app/web/supplements_split_0923.js >> /app/web/app.js \
 && cat /app/web/nutrition_homestock_0927.js >> /app/web/app.js \
 && cat /app/web/workout_activation_0928.js >> /app/web/app.js \
 && cat /app/web/pain_detail_0929.js >> /app/web/app.js \
 && cat /app/web/pain_select_0930.js >> /app/web/app.js \
 && cat /app/web/warmup_stretching_0931.js >> /app/web/app.js \
 && cat /app/web/warmup_ui_fix_0932.js >> /app/web/app.js \
 && cat /app/web/workout_history_0933.js >> /app/web/app.js \
 && cat /app/web/healthsync_status_0934.js >> /app/web/app.js \
 && cat /app/web/healthsync_relocate_0935.js >> /app/web/app.js \
 && cat /app/web/equipment_details_0936.js >> /app/web/app.js \
 && cat /app/web/calibration_mode_0937.js >> /app/web/app.js \
 && cat /app/web/calibration_mode_0938.js >> /app/web/app.js \
 && cat /app/web/health_dashboard_0940.js >> /app/web/app.js \
 && cat /app/web/health_dashboard_0941.js >> /app/web/app.js \
 && cat /app/web/health_rest_dashboard_0944.js >> /app/web/app.js \
 && cat /app/web/workout_tv_0945.js >> /app/web/app.js \
 && cat /app/web/workout_tv_layout_0946.js >> /app/web/app.js \
 && cat /app/web/workout_flow_0949.js >> /app/web/app.js \
 && cat /app/web/workout_focus_0950.js >> /app/web/app.js \
 && cat /app/web/profile_weight_0951.js >> /app/web/app.js \
 && cat /app/web/exercise_guide_0952.js >> /app/web/app.js \
 && cat /app/web/exercise_guides_0953.js >> /app/web/app.js \
 && cat /app/web/exercise_catalog_0954.js >> /app/web/app.js \
 && cat /app/web/guide_manager_0914.js >> /app/web/app.js \
 && cat /app/web/guide_manager_0963.js >> /app/web/app.js

ENV PYTHONUNBUFFERED=1
EXPOSE 8099

CMD ["gunicorn", "--bind", "0.0.0.0:8099", "--workers", "1", "--threads", "4", "exercise_guides_catalog_0962:app"]
