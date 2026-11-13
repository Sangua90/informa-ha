# Dumbbell load convention and bodyweight progression — 0.10.99

All 12 kg-loaded catalog exercises use kg of discs on ONE dumbbell, summed across both ends, excluding the handle and collars. The UI identifies one or two dumbbells. A single shared display helper is loaded before all historical wrappers and is used by the final runner, per-set fields, asynchronous suggestions, equipment and history. The AI catalog, recorded-set context and system instructions state the same convention. Saved numbers are never multiplied, divided or adjusted with an assumed tare. Existing numeric history is preserved.

Bodyweight targets are derived from performed sets grouped by workout, canonical completed/partial outcomes and workout-bound numeric effort (or legacy set effort). Two recent complete, easy sessions at the same target, with at least two distinct sets, permit +2 repetitions or +5 seconds for Plank. A minimum 48 hours of recovery is required. Partial/unknown outcomes, inconsistent repetitions, one recorded set, low energy, pain and short recovery prevent an increase. Difficult/maximal effort or a break over four weeks produces a conservative reduction. Initial targets are 10 repetitions / 30 seconds; current limits are 5–20 repetitions / 10–60 seconds. At the ceiling, the UI suggests reviewing a compatible harder variant rather than increasing indefinitely. These are app policy limits, not universal physiological thresholds.

Gemini receives the computed targets; real plan validation applies them and counts their duration before accepting a plan. A target increase cannot simultaneously increase set count over the prior performed count. The local planner and substitutions use the same endpoint and policy. New targets apply to a newly prepared plan only; an open/resumed session retains its prescription. Reasons are rendered with textContent. Missing progression service is explicitly identified in the local workout instead of claiming historical adaptation.

## Executed local checks

- 124 Python tests passed with UTF-8 mode on Windows. Includes all twelve dumbbell classifications, unchanged saved kg, contextual convention, bodyweight progression gates, numeric effort tied to the correct workout, repetition/seconds limits and actual workout-route normalization.
- 87 JavaScript tests passed across the seven existing suites. New full-bundle cases exercise disc labels, late suggestions, +/- controls, unchanged save values, cold restore, historical units, local fallback/substitution progression and a restored 35-second Plank saving exactly once after countdown.
- verify_build.py passed: 99 JS files, exact 73-fragment production bundle, Python syntax and 49-exercise catalog.
- Disposable full-production boot passed eleven GET routes (including the new progression endpoint), real set/archive/finish/session handlers and mocked Google 503-to-generateContent connection/workout validation.
- Existing treadmill skip, set recovery, replacement, progress order and paused/running session restoration remain covered by the full suites.

Actual amd64/aarch64 image build and installed-HA checks are separate release checks. These automated tests do not establish physical iPhone runtime behavior. No real user workout was manufactured for these checks.
