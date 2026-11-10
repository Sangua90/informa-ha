# Automatic AI workout generation

## Behavior

Generating a workout now requests a structured Gemini decision before starting
the existing workout flow. No chat question is required. The decision can be
training or recovery. Training chooses compatible exercise IDs, sets,
repetitions/seconds, rest and a load policy. The reason must connect the goal,
history and recovery to today's choices; data_used identifies available sources
considered. The chat is collapsed into an optional section.

The shared context used by chat, daily local advice and AI generation contains:

- Profile goal, level, height and weight; up to 60 dated complete measurement
  rows and the latest non-null value of each measurement.
- The last 500 sets with actual loads, repetitions/seconds, effort/RIR labels
  and dates; lifetime per-exercise counts/latest dates; pending exercises,
  completion/skip/partial status, previous check-ins and their prescribed plans.
- Up to 100 numeric effort ratings. New ratings are persisted on the server;
  earlier browser ratings synchronize idempotently before generation.
- Cardio history, imported workouts, available Health Auto Export metrics and
  up to 200 dated numeric health samples, without raw health import payloads.
- Nutrition goals, current totals, 30 logged daily totals, 20 recent food rows,
  supplement schedule and recent adherence records.
- Declared equipment, the complete catalog, personal exclusions and today's
  energy/pain details/time/exercise-count/treadmill/stretching preferences.

This covers recorded data categories, not an unlimited dump of the database.
Limits, timestamps and missing measurement fields are exposed in coverage.
No name, API key, photographs or raw import payload is sent in the context.
The privacy text describes the expanded context. Equipment inventory remains
the setup declared in the app; it is not inferred from photos or sensors.

## Validation and execution

The server controls allowed IDs and unit metadata. Unknown/duplicate/excluded or
pain-blocked exercises, invalid source coverage, counts, numeric bounds and
over-budget prescriptions are rejected. Stretching time reserves cover existing
side-aware extras. Exclusions are read again after the model round trip.
Actual kg loads come from previously recorded values; no unknown available
dumbbell increments are invented. Plate progression is limited to one plate,
with recent easy sets, low recorded effort and adequate recovery. Load controls
remain editable. AI prescriptions are passed through the real final builders,
which retain the dedicated treadmill, stretching, recovery, progress and skip
implementations. Generated proposals are logged separately from performed sets.

No provider/key, timeout, HTTP error, unusable JSON or invalid plan produces a
visibly labeled local fallback. A recovery decision does not start an empty
workout. The divergent old local-context fields were restored, fixing the daily
advice/fallback missing-key failure.

## Verification

- 67 Python tests, including nine new tests for fresh context, all measurements,
  unit metadata, numeric effort persistence, health-history filtering, AI plan
  normalization/rejection, source coverage, recovery/fallback, schema/revision/
  store=false request construction and recorded-load policies.
- 33 JavaScript tests, including real wrapper-order execution of AI-selected
  prescriptions, no-chat generation, concurrent click protection, recovery,
  explicit fallback and numeric effort synchronization. Existing workout,
  exclusions, catalog and navigation regressions remain.
- verify_build.py checks all 95 JS files, the actual 69-fragment bundle, Python
  syntax and Docker source contracts. CI builds amd64 and aarch64 images.
- The complete actual Python import chain was booted against an isolated
  temporary database. Context, daily advice, context summary and generation
  fallback endpoints returned successful responses. No real HA data was used.
- The full bundle was exercised in desktop Edge at a 390×844 viewport with
  simulated API/AI responses. The generated curl/plank plan retained its AI sets,
  repetitions/seconds and source label. No uncaught page errors were reported.

Network responses in automated tests are mocked. Live installation/provider
checks are reported separately; these tests do not establish model quality or
an iPhone runtime result.

## API reference

Implementation checked against Google's official Interactions documentation:
https://aistudio.google.com/docs/structured-output (response_format JSON Schema,
Api-Revision 2026-05-20) and
https://aistudio.google.com/docs/interactions-overview (stateless store=false).
The configured model is retained; credentials remain in add-on options.
