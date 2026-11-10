# Coach selection 0.10.86

The adaptive library previously selected fixed indexes 0 and 1 from the primary
muscle group and index 0 from complementary groups and Core. It now ranks the
entire compatible group: exercises absent from recent workout history first,
then the least recently performed; session frequency and randomized ties break
ties. A Set prevents duplicate IDs. The original primary/complementary group
structure, pain exclusions, exercise count and prescriptions remain in place.

Preparation reads up to eight recent workouts, counts one exposure per exercise
per workout (not per set), and replaces its history snapshot on each preparation.
Catalog names determine muscle groups, with legacy-name matching as fallback.
Recovery still determines group priority; equally recovered groups have random
tie breaking instead of always starting with Petto. Randomness does not override
recovery or exercise-history priority. An offline/empty history still generates
a plan with varied eligible choices. Random ties do not guarantee that two
successive plans will always differ.

This change opens the whole strength pool, including all 12 kg-loaded dumbbell
exercises. Cardio and mobility/stretching keep their dedicated phases and the
user's explicit treadmill/stretching choices; they are not mixed into strength
slots. Later automatic_stretching_0978.js wraps the selected plan without
replacing strength exercises; treadmill, final controller and runner retain
their existing behavior.

Verification commands:

- `node --test tests/coach_selection_01086.cjs tests/workout_01055.cjs tests/workout_runtime_01056.cjs`: 22 tests. Five new tests use seeded randomness to check reachability of every strength exercise, history ranking, per-session counting, catalog group matching, offline fallback, recovery priority, tie variation and final wrapper constraints. The existing workout regression tests are also run.
- `python verify_build.py`: all 92 JavaScript files, the 66-fragment bundle, Python syntax and Docker source contracts.
- `python -X utf8 -m unittest discover -s tests -q`: 54 tests.

GitHub Actions also builds actual Docker images for amd64 and aarch64 before
promotion to main. No iPhone or installed Home Assistant runtime test is claimed.
