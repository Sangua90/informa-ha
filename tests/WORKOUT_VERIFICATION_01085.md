# Workout progress and timed exercises

## Render/state audit

The Dockerfile appends 66 fragments to app.js. The final workout wrappers are
workout_controller_0108.js and workout_runner_01041.js; changing workout_ui_067.js
alone does not change the visible runner's dots.

The runtime fixture loads 16 workout wrappers in the Dockerfile's order: legacy
progress, persistent flow, focus/recovery, adaptive library, treadmill focus and
rendering, automatic stretching, equipment filter, treadmill flow/completion/
advance, set completion, final treadmill handler, controller and runner.
workout_flow_fix_0986.js, replacement_start_fix_0989.js and
treadmill_rerender_guard_0985.js exist on disk but are not bundled by Docker.

Both progress renderers now consume the same persistent session order and flow
snapshot. Archived status wins over stale wrapper state. Focus and DOM order do
not determine segment status. An unstarted replacement takes the original slot;
a replacement after starting retains the original partial segment and inserts
the new exercise immediately after it. Session reset clears the order.

## Automated verification

- `python verify_build.py`: syntax for all 92 JavaScript files, assembled bundle
  syntax for 66 fragments, Python syntax, Docker source contracts and 49 guides.
- `python -X utf8 -m unittest discover -s tests -q`: 54 tests, including an old
  SQLite schema migration, preservation of existing sets, repeated initialization
  and real Flask requests saving seconds/repetition units.
- `node --test tests/workout_01055.cjs tests/workout_runtime_01056.cjs`: 17 tests.
  These cover series and natural/skipped recovery, canonical archive/advance,
  failed archive retry, cancelled/successful replacement, partial replacement
  history, stale focus, reordered/removed DOM cards, Plank countdown pause/resume
  across rendering, one save followed by recovery, cancellation on skip,
  timed aliases, dynamic core remaining repetitions, treadmill skip, weight +/-
  and history units. API requests are mocked in these JavaScript tests.
- All 12 adaptive exercises with kg loads are enabled. The temporary equipment
  filter is disabled. The legacy low-cable cleanup now preserves supported
  adaptive IDs, including reverse curl with dumbbells.

Plank defaults to 30 seconds when legacy prescriptions lack a time unit. Explicit
timed prescriptions keep their duration. Mobility/stretching retain their
existing side-aware timers; dynamic crunches, heel taps and bridges remain reps.
Saved sets include rep_type; the existing numeric reps column stores the value.
History recognizes legacy Plank names as seconds as well.

## Limits

No iPhone/Safari, installed Home Assistant, real workout or physical equipment
runtime testing was performed. Docker is unavailable on the local Windows host;
the repository's GitHub Actions builds the actual image for amd64 and aarch64.
The automatic selector's fixed exercise choices are unchanged by this fix.
