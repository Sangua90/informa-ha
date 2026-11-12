# General logic audit — 0.10.91

Reviewed the actual 69-fragment Docker bundle, including later assignments of
generation, rendering, saving, closing, timer, replacement and exclusion handlers.
Backend review follows the real final import chain and Flask handler replacements.

## Corrections

- A fresh plan clears the previous workout ID, captured rows, active focus,
  exercise order, effort and closure reason. This prevents mixing workouts and
  resurrecting archived rows when render wrappers capture the old DOM.
- Closing a workout waits for a confirmed save. Failure preserves the session
  and permits retry; successful closure alone clears state, locks navigation,
  resolves completed pending work and advances legacy calibration metadata.
  Duplicate clicks and repeated successful closure cannot save twice.
- Duration and whole-session effort are now persisted. Performed but unarchived
  strength work receives a partial status, and session effort enters AI context.
- Set and meal requests have stable logical request IDs. A lost response/retry
  does not duplicate the row. Delayed old-set responses cannot set the ID or
  mark rows in a newly generated session.
- Treadmill progression, cardio history and completion status commit in one
  transaction, with retry deduplication. Previously the two separate writes
  could leave progression without cardio and duplicate data on retry. Added
  workout linkage also lets existing history deletion remove treadmill records.
- Treadmill phase/hold/mobility timers reset between sessions. Recovery uses a
  clock deadline rather than counting callbacks, supports pause/add/restart,
  and cancelled timers cannot navigate back to an old exercise. Numeric effort
  prompts can be cancelled when their session ends.
- Stretching is not pruned while target strength remains pending. Completed or
  actually performed partial strength retains the corresponding final stretch.
- Skipping after performed sets preserves a partial state. Fassi minus controls
  respect the minimum of one plate. Non-positive/fractional set counts are
  rejected before saving.
- Measurement, nutrition, set, cardio and treadmill write contracts reject
  nonfinite/negative values and malformed bodies. Updates preserve omitted
  nutrition fields. Closed/nonexistent workout IDs cannot receive new work.
- Typed invalid measurements cannot silently become null through JSON NaN
  conversion. Meal confirmation cannot double-submit; rejected AI macro output
  is not offered as a valid estimate.
- Weekly strength days derive from actual sets, not every workout row (which
  also contains cardio-only or entirely skipped sessions).
- Five-minute treadmill protocols no longer contain zero-length phases, and
  plan queries reject nonfinite or shorter-than-supported input.
- Canonical/legacy mobility and trunk-stretch image IDs share uploads, preferring
  canonical files while preserving old uploads. Existing photos are not replaced.
- Home no longer promises a fixed chest/triceps workout or a legacy A/B/C block
  while the actual coach chooses from the full compatible catalog.

## Verification

- 81 Python tests, including 14 new audit tests for retries, transactions and
  rollback, finish persistence, migrations, input contracts, omitted-field
  preservation, closed sessions, guide aliases and treadmill phase budgets.
- 46 JavaScript tests. Nine new tests execute the complete production bundle
  and real index with a deterministic clock and fixture APIs, covering lifecycle,
  save failures, consecutive sessions, stale responses, partials/stretching,
  invalid measurements and meal confirmation. Existing progress, Plank,
  replacement, exclusion, skip and weight regressions remain.
- The older small timer harness now supplies clearTimeout and an elapsed clock;
  its obsolete exact callback-string assertion was removed. The new runtime
  tests verify timing/cancellation behavior rather than source spelling.
- verify_build.py: 95 JS files, 69 concatenated fragments, Python syntax and
  Docker source contracts. CI builds actual amd64 and aarch64 images.
- production_boot_01091.py boots the complete real import chain against copied
  source and disposable data. Eight GET routes respond successfully, plus
  reminder, set retry, finish duration/effort, closed-work rejection, atomic
  treadmill retry and subsequent AI context are checked. No production data or
  actual model calls are used by this script.

Google's Interactions and generateContent interfaces remain supported; the
working configured model is retained. Obsolete temperature tuning was removed
from meal analysis, consistent with the current provider guidance:
https://aistudio.google.com/docs/troubleshooting

This is a bounded logic review and regression suite, not proof that every
possible path is bug-free. Physical iPhone background execution, audible
recovery signals and live Gemini media inference are not established by these
automated tests. Live installation checks are reported separately.
