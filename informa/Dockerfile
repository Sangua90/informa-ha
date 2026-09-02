FROM python:3.13-alpine

ARG BUILD_VERSION=0.9.35
ARG BUILD_ARCH=amd64
ARG INFORMA_CACHE_BUST=0.9.35-healthsync-relocate

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
COPY guide_manager_0914.py /app/guide_manager_0914.py
COPY exercise_toggle_0915.py /app/exercise_toggle_0915.py
COPY compact_management_0916.py /app/compact_management_0916.py
COPY compact_management_0917.py /app/compact_management_0917.py
COPY compact_management_0918.py /app/compact_management_0918.py
COPY compact_management_0919.py /app/compact_management_0919.py
COPY compact_management_0920.py /app/compact_management_0920.py
COPY management_accordion_0921.py /app/management_accordion_0921.py
COPY remove_legacy_guide_manager_0922.py /app/remove_legacy_guide_manager_0922.py
COPY supplements_split_0923.py /app/supplements_split_0923.py
COPY supplements_settings_fix_0926.py /app/supplements_settings_fix_0926.py
COPY nutrition_homestock_0927.py /app/nutrition_homestock_0927.py
COPY workout_activation_0928.py /app/workout_activation_0928.py
COPY pain_detail_0929.py /app/pain_detail_0929.py
COPY pain_select_0930.py /app/pain_select_0930.py
COPY warmup_stretching_0931.py /app/warmup_stretching_0931.py
COPY warmup_ui_fix_0932.py /app/warmup_ui_fix_0932.py
COPY workout_history_0933.py /app/workout_history_0933.py
COPY healthsync_status_0934.py /app/healthsync_status_0934.py
COPY healthsync_relocate_0935.py /app/healthsync_relocate_0935.py
COPY web /app/web
RUN test "$(grep -Fc "    ['" /app/web/interface_063.js)" -eq 36 \
 && grep -Fq "build 0.9.11" /app/web/interface_063.js \
 && grep -Fq "SETTINGS_LABELS=['Profilo','Connessioni e dispositivi','Integratori','Alimentazione']" /app/web/profile_sections_0912.js \
 && grep -Fq "Piastra / pin" /app/web/load_fields_0913.js \
 && grep -Fq "GUIDE_IDS_36" /app/guide_manager_0914.py \
 && grep -Fq "persistent_toggle=1" /app/exercise_toggle_0915.py \
 && grep -Fq "native_accordion=1" /app/management_accordion_0921.py \
 && grep -Fq "legacy_upload_manager_removed=1" /app/web/guides_040.js \
 && grep -Fq "settings_daily_split=1" /app/supplements_split_0923.py \
 && grep -Fq "app.appendChild(page)" /app/web/supplements_split_0923.js \
 && grep -Fq "settings_page_dom_fix=1" /app/supplements_settings_fix_0926.py \
 && grep -Fq "api/homestock/catalog" /app/web/nutrition_homestock_0927.js \
 && grep -Fq "nutrition-settings-0927" /app/web/nutrition_homestock_0927.js \
 && grep -Fq "homestock_catalog=1" /app/nutrition_homestock_0927.py \
 && grep -Fq "home_preparation_unlock=1" /app/workout_activation_0928.py \
 && grep -Fq "informha_workout_prepared_0928" /app/web/workout_activation_0928.js \
 && grep -Fq "pain_detail=1" /app/pain_detail_0929.py \
 && grep -Fq "pain_zone_selector=1" /app/pain_select_0930.py \
 && grep -Fq "treadmill_modular=1" /app/warmup_stretching_0931.py \
 && grep -Fq "stretching_selective=1" /app/warmup_stretching_0931.py \
 && grep -Fq "existing_checkin_injection=1" /app/warmup_ui_fix_0932.py \
 && grep -Fq "workout_history=1" /app/workout_history_0933.py \
 && grep -Fq "status_ui=1" /app/healthsync_status_0934.py \
 && grep -Fq "relocated_to_apple_card=1" /app/healthsync_relocate_0935.py \
 && grep -Fq "appleCard" /app/web/healthsync_relocate_0935.js \
 && grep -Fq "if934Health" /app/web/healthsync_relocate_0935.js \
 && printf '%s\n' "InFormha 0.9.35 healthsync-relocate" > /app/BUILD_ID \
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
 && cat /app/web/healthsync_relocate_0935.js >> /app/web/app.js

ENV PYTHONUNBUFFERED=1
EXPOSE 8099

CMD ["gunicorn", "--bind", "0.0.0.0:8099", "--workers", "1", "--threads", "4", "healthsync_relocate_0935:app"]
