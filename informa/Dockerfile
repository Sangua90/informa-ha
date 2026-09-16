FROM python:3.13-alpine
ARG BUILD_VERSION=0.9.81
ARG BUILD_ARCH=amd64
ARG INFORMA_CACHE_BUST=0.9.81-recovery-sound-fix
LABEL io.hass.version="${BUILD_VERSION}" io.hass.type="app" io.hass.arch="${BUILD_ARCH}"
WORKDIR /app
RUN pip install --no-cache-dir flask==3.1.1 gunicorn==23.0.0 pillow==11.3.0 websocket-client==1.8.0
COPY *.py /app/
COPY web /app/web
RUN grep -Fq 'Expected 37 exercises' /app/coach_library_0962.py \
 && grep -Fq 'active_if932=1' /app/web/treadmill_duration_0964.js \
 && grep -Fq 'history_recovery=1' /app/web/adaptive_coach_0968.js \
 && grep -Fq 'treadmill_choice=1' /app/web/adaptive_library_0972.js \
 && grep -Fq 'bodyweight=1' /app/web/load_progression_0969.js \
 && grep -Fq 'icoach_generated=1' /app/web/treadmill_progression_0970.js \
 && grep -Fq 'first_exercise=1' /app/web/treadmill_focus_fix_0974.js \
 && grep -Fq 'dedicated_card=1' /app/web/treadmill_render_fix_0975.js \
 && grep -Fq 'stretch_yes_no=1' /app/web/preworkout_stretching_0976.js \
 && grep -Fq 'calibration_ui_removed=1' /app/web/remove_calibration_0977.js \
 && grep -Fq 'total_time_budget=1' /app/web/automatic_stretching_0978.js \
 && grep -Fq 'dumbbells_off=1' /app/web/temporary_equipment_0979.js \
 && grep -Fq 'real_startTimer=1' /app/web/recovery_sound_fix_0981.js \
 && python -c "import coach_library_0962 as c; assert c.exercise_count() == 37; assert len(c.guide_ids()) == 37" \
 && printf '%s\n' "InFormha 0.9.81 recovery-sound-fix" > /app/BUILD_ID \
 && echo "$INFORMA_CACHE_BUST" >> /app/BUILD_ID
RUN for f in guides_034.js guides_038.js guides_039.js guides_040.js coach_full_050.js fullbody_051.js coach_controls_060.js interface_061.js interface_063.js exercise_gallery_066.js workout_ui_067.js progression_068.js week_069.js advance_070.js pain_071.js resume_072.js muscle_search_073.js coach_refine_075.js nutrition_080.js ai_coach_090.js ai_gemini_091.js ai_context_093.js library_094.js profile_sections_0912.js load_fields_0913.js management_accordion_0921.js supplements_split_0923.js nutrition_homestock_0927.js workout_activation_0928.js pain_detail_0929.js pain_select_0930.js warmup_stretching_0931.js warmup_ui_fix_0932.js workout_history_0933.js healthsync_status_0934.js healthsync_relocate_0935.js equipment_details_0936.js health_dashboard_0940.js health_dashboard_0941.js health_rest_dashboard_0944.js workout_tv_0945.js workout_tv_layout_0946.js workout_flow_0949.js workout_focus_0950.js profile_weight_0951.js exercise_guide_0952.js exercise_guides_0953.js exercise_catalog_0954.js guide_manager_0914.js guide_manager_0963.js treadmill_duration_0964.js adaptive_coach_0968.js load_progression_0969.js treadmill_progression_0970.js adaptive_library_0972.js treadmill_focus_fix_0974.js treadmill_render_fix_0975.js preworkout_stretching_0976.js remove_calibration_0977.js automatic_stretching_0978.js temporary_equipment_0979.js recovery_sound_fix_0981.js; do cat "/app/web/$f" >> /app/web/app.js; done
ENV PYTHONUNBUFFERED=1
EXPOSE 8099
CMD ["gunicorn", "--bind", "0.0.0.0:8099", "--workers", "1", "--threads", "4", "treadmill_progression_0970:app"]
