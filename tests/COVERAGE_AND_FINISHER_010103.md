# Coverage and separate Core finisher — 0.10.103

Verified locally: 153 Python tests, 99 JavaScript tests, syntax/build contracts for 100 JavaScript files and the exact 74-fragment production bundle, Python compilation and the 50-entry catalog, plus the full production import/handler smoke test against disposable data.

The production smoke now generates and completes FIVE visits through the actual set/archive/finish handlers, with two main exercises plus one separately flagged Core finisher on every visit. After visit three the next session is FOUR and the entire lower-body focus is still pending. Visit four leaves Glutei and Polpacci pending; visit five completes them and starts block two. No simulated user workouts are added to live Home Assistant.

Regression coverage includes: partial work stays pending, Core-only/cardio-only work does not advance main coverage, pain temporarily suspends rather than clears a group, small pending pools remain selectable after repeated previews, weekly variants do not silently reduce the chosen main count, two main exercises plus Plank retain correct countdown and ordering after the final stretching wrapper and cold resume, and local fallback follows the same pending focus. Existing canonical segments, treadmill skip, recovery, substitution, weights, notes and session durability remain covered.

Publication requires successful actual Docker builds for amd64 and aarch64 on the exact source commit before promotion to main. Installation requires checking that no session is open. Real provider previews are separate from synthetic tests and do not save proposals or workouts. No physical iPhone test is claimed.

Coverage refers to canonical completed primary-group exercises in finished sessions. Partial sets affect recovery/progression but do not certify a completed group. Core, mobility, stretching and cardio remain within the total time budget while outside the chosen main count. Unavailable groups and pain suspensions are reported. Actual physiological recovery and exercise adequacy cannot be certified by these software tests.
