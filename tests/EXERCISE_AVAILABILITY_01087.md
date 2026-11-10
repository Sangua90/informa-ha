# Personal exercise exclusions

The working standalone exercise catalog and the in-app catalog both expose
"Elimina dalla mia lista". Exclusions are reversible in "Esercizi esclusi".
The database stores exercise IDs independently of workout history and guide
assets. New devices read the same server preferences. A failed save leaves the
exercise available; generation waits for a fresh server snapshot and stops if
it cannot load preferences, rather than generating with unknown exclusions.

The final availability fragment loads after the controller/runner. It guards
direct replacements before legacy wrappers can archive the old exercise.
The adaptive candidate pool and group selection, add/swap/resume helpers,
explicit treadmill and automatic mobility/stretching all honor exclusions.
Aliases used by automatic stretching resolve to the catalog's canonical IDs.
The generated quad stretch is also listed so it can be excluded.

An existing session is not rewritten by catalog edits. Its set values, history
and progress segments remain intact; use the existing skip/swap controls there.
When too few exercises remain, the selector uses only available candidates and
never fills missing slots with excluded IDs or duplicates.

Verification: 56 Python tests, 26 JavaScript tests, syntax/contract checks for
93 JavaScript files and the actual 67-fragment bundle. New tests exercise real
Flask GET/PUT requests, idempotent persistence/reinitialization, history
preservation, payload validation, catalog buttons, exclusion/restoration across
fresh browser contexts, failure behavior, aliases, direct swap guards, real
menu helpers and selection when alternatives are exhausted. Existing workout
regression tests remain in the suite. GitHub Actions builds amd64/aarch64 before
promotion. No iPhone or installed Home Assistant runtime testing is claimed.
