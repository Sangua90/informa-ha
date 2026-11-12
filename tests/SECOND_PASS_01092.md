# Second logic review — 0.10.92

Review date: 2026-11-12. Baseline: 0.10.91 / 122b4d4.

## Reproduced and corrected

- Rapid skip clicks could send two archives before either returned. Archive writes are now atomic and deduplicated by a session/exercise request ID. A different request cannot overwrite an archived decision. The client uses the status actually returned by the server, including retries after a lost response.
- A pending series save could overlap skipping, removal, replacement, finish or discard. These actions now wait for the outstanding mutation. Removal preserves performed work as partial. Discard also rejects duplicate clicks while its deletion is pending. Treadmill completion keeps its lock until the actual save response; the additional duplicate-click test failed before this correction.
- Replacing an exercise with an earlier archived exercise reused its identifier, progress segment and series request IDs. Archived IDs are unavailable for additions/replacements until a new session starts.
- Late responses from a previous replacement, finish or discard could modify a newly generated session. Session identity is checked before applying the response, and replacement callbacks check it before delayed focus changes. Inspected all successive swap wrappers: workout_flow_0949, workout_focus_0950, workout_controller_0108, workout_flow_fix_0986, replacement_start_fix_0989, exercise_availability_01087.
- A slow load suggestion could update hidden series inputs without updating the visible weight control, or refill a weight explicitly cleared by the user. Suggestions now check the original card and session, synchronize the visible control and respect edits, including edits restored after rendering.
- If a series was saved but its response was lost, retrying after changing the input showed the changed value although the server correctly kept the first save. Responses now contain the persisted series values; the client displays those values. Cached 0.10.91 requests recover their original values from the existing series row.

## Verification actually executed locally

- `python verify_build.py`: PASS; syntax of 95 JavaScript files, production bundle of 69 fragments, Python syntax/catalog/source contracts.
- `python -X utf8 -m unittest discover -s tests -q`: **84 passed**, including three additional persistence/retry checks.
- All seven JavaScript test files from `.github/workflows/verify.yml`: **60 passed**. The final-bundle suite loads the actual index and Docker concatenation order in JSDOM, with controlled time and API responses. It includes 14 additional checks in this revision. Seven initial race/weight checks were observed failing on the baseline before implementation; subsequent late replacement/status/closure checks also exposed their respective failures before correction.
- Regression coverage includes complete series/recovery/archive sequencing, substitution and cancellation, canonical progress after removal/reordering, treadmill skip and phase reset, weights +/−, timed exercise units and Plank countdown saving through the complete bundle, catalog exclusions, navigation, profile/measurements, startup error isolation and AI plan prescriptions.
- `python -X utf8 tests/production_boot_01091.py`: complete real Python import chain booted against a disposable database. Eight GET endpoints returned 200. Actual handlers verified original set values on retry, canonical archive retry/conflict, duration/effort persistence, rejection of writes to closed sessions, atomic treadmill retry, and effort in the coach context.

## Boundaries

The JavaScript workflow checks use JSDOM and simulated network timing. The Python smoke test uses disposable data, without a Home Assistant supervisor token or real model inference. This is not an iPhone workout test or a physical training session. No local Docker engine is available: the existing GitHub Actions workflow must pass the test job and both actual Docker builds (amd64/aarch64) before promotion to main. Installation and visible checks in the user's Home Assistant, if performed afterwards, are reported separately.

Passing these checks does not establish that every possible app behavior is free of defects.
