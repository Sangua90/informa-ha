# Coach questions — 0.10.93

## Behavior

- The app checks for a missing declared weekly availability when opened or when preparing a workout. The first question is created by a deterministic setup rule, not attributed to model inference.
- Gemini can return a validated `clarify` decision with one specific question while preparing a session. That response opens the question page without creating a workout. Existing answers and postponed questions are included in its next context.
- A question is saved before notification delivery is attempted. Home Assistant receives a persistent notification with a relative panel link and question ID. The existing iPhone notifier is also attempted; failure there does not remove the HA notification. Notification previews contain no answer or detailed question text.
- The panel resolves its installed slug through Supervisor; the existing installation's panel is the fallback. The app handles the question query parameter both at initial load and when an already-loaded iframe receives a changed parent URL.
- Questions can be opened from Home, Altro or AI Coach. The question page has the existing X/back navigation, a free-text answer, send/update, prior answers and a 24-hour postpone action.
- Answers are persisted with revisions and included as user declarations in fresh generation/chat context. They are never counted as completed workouts. Editing an answer affects future proposals; it does not rewrite an active workout.
- Duplicate requests and lost acknowledgements do not create duplicate answer revisions. Concurrent devices cannot silently overwrite a newer answer. Failed saves preserve the browser's current draft while the page remains open.
- Notification delivery uses a transaction claim, stable HA ID/mobile tag and a retry delay. The persistent HA notification is dismissed after a successful answer. There is one outstanding question; there is no continuous background AI evaluation while the app is closed.

## Verification

Executed locally before version promotion:

- `python verify_build.py`: 96 JS files, 70 production bundle fragments, Python syntax, catalog and Docker source contracts passed.
- Full Python suite: **94 tests passed**, including 10 new notification/question/answer/context tests.
- All seven JS suites from the workflow: **64 tests passed**, including four actual-bundle checks for deep links/X, single-flight save/edit, failed-save draft retention/XSS handling, and AI clarification/postpone without workout creation.
- Complete production import chain on disposable data: nine GET endpoints returned 200; actual question check/notification deduplication, answer retry and fresh context were verified. Existing set/archive/finish/treadmill checks also passed.

Notifications are mocked in automated checks. Actual HA notification display and link navigation are verified separately after installation. Delivery/interaction on a physical iPhone and a live Gemini clarification are not implied by these tests. Existing GitHub Actions must pass tests and real amd64/aarch64 Docker builds before promotion.

## API references consulted

- [Home Assistant persistent notifications](https://www.home-assistant.io/integrations/persistent_notification/)
- [Companion notification URLs and replacement tags](https://companion.home-assistant.io/docs/notifications/notifications-basic/)
