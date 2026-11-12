# Persistent workout, Gemini retry and inline measurements — 0.10.96

The production entry point is `workout_sessions_01096:app`; the durable-session browser wrapper runs after every existing workout/render wrapper in the actual Docker bundle.

Unfinished plans live both in local storage and in an independent SQLite draft, not as performed workouts. Snapshots include plan prescriptions, canonical flow/order, current exercise, typed weights, treadmill phases, isometric/stretching timers and recovery. Timers keep their absolute deadline when the app loses focus or closes. Only an explicit pause preserves a fixed remaining duration. Treadmill phase transitions retain the existing explicit start of the next phase. iOS may suspend scripts/audio in the background; remaining time is recalculated from the clock when execution resumes.

Server restore reconciles saved sets and archive decisions from SQLite, including responses lost while closing. Draft revisions reject stale writes and another active session. Finishing or discarding leaves a durable closed marker so late requests and stale browser mirrors cannot resurrect the session. Generation stays blocked until the active session and pending writes have been resolved. Restoration hydrates all rows before any render/capture can replace saved values with blank controls.

Gemini transport makes at most three attempts within its original overall deadline for temporary server/network failures, including HTTP 503. Permanent request/authentication errors are not retried. A short numeric Retry-After can authorize a bounded 429 retry. Workout generation, chat and the connection test share the transport. Repeated provider failure still produces an explicit local fallback; this does not guarantee Google service availability.

Measurements now use a single inline SVG with eight adjacent inputs and in-place instructions: height, weight, chest, arm, waist, hips, thigh and calf. Arm/thigh use the chosen side's existing database columns, without copying a value to the opposite limb or averaging earlier measurements. New hip/calf values and side metadata are migrated without rewriting old rows and are included in fresh AI context. Sources are linked in the interface, including WHO/NHS, the existing anthropometry protocol and the British Regional Heart Study calf protocol.

## Executed local checks

- `python verify_build.py`: 98 JavaScript files, the exact 72-fragment Docker bundle, Python syntax and the 49-exercise catalog passed.
- Full Python discovery: **112 passed**. Includes provider 503 → success, bounded failure/deadline, no retry of permanent errors, fresh hip/calf context, draft revisions, lost acknowledgements, finish/discard tombstones, canonical reconciliation and discarded-work cleanup.
- All seven JavaScript suites: **81 passed**. Includes full-production-bundle cold webview restart for treadmill, weights, partial series, replacement order, Plank completion in seconds, recovery, stretching, explicit pause, removal of all exercises, final closure and stale-cache rejection. Existing treadmill skip, series recovery, substitutions, canonical progress and weight +/- regressions remain in the suites.
- Full production import chain on disposable data: 10 GET endpoints plus real measurement writes/validation/context, draft save/restore/closure, idempotent sets/archive/treadmill, finish, questions and answers. No real HA records or Gemini keys are used by these automated checks.

Actual amd64/aarch64 image builds must pass in GitHub Actions before promotion. Browser installation, actual provider connection and physical iPhone behavior are separate checks; automated cold-restart tests do not establish a physical iPhone/HA runtime workout test. Sessions already lost before this version cannot be reconstructed exactly from a plan that was never stored.
