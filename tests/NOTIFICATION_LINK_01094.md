# Notification link correction — 0.10.94

The user reported that tapping the notification on iPhone opened nothing. The previous browser verification covered a query URL and did not establish physical iPhone behavior.

## Changes

- Both the persistent HA notification link and Companion `url`/`clickAction` now use `/app/<installed-slug>/coachquestions/<id>`. The generic HA app panel was verified to load the installed app in the user's browser before this change.
- Mobile notifications also have a `Leggi e rispondi` URI action with foreground activation.
- The app subscribes to HA's `home-assistant/properties` messages and reads its route, instead of relying solely on a query parameter in the parent window. Messages must come from the parent and the same origin.
- Legacy query links remain supported. Leaving the question page removes its notification target through HA's navigation bridge. A later tap of the same link can reopen it without trapping the user on that page. Visibility/pageshow handling covers a resumed webview.
- Existing pending notifications have a version marker. The first check after upgrade replaces the old notification once, using the existing notification ID/tag. Claims and retry delay still prevent concurrent/repeated sends.
- A mobile service failure is recorded separately and shown without private error details; HA's persistent notification and the saved question remain available.
- Main asset query versions are advanced to prevent retaining an earlier script after the update.

## Verification

- Three new behavior checks failed on 0.10.93 before the fix: native route opening, HA bridge opening in a loaded webview, and reopening a previously closed notification.
- Full suite: **96 Python tests** and **68 JavaScript tests** passed. New checks cover URI/foreground payload, replacement of a legacy notification exactly once, mobile-service failure/backoff, native routes, bridge messages, old-link reopening and rejecting other-origin messages.
- `verify_build.py`: 96 JS files / 70 production fragments, Python syntax/catalog/contracts passed.
- Full production import-chain smoke test on disposable data: all nine GET endpoints, set/archive/finish/treadmill regressions, question notification deduplication/answer retry/context and current script reference passed. Notification service calls are mocked here.
- Actual amd64/aarch64 image builds are required in the existing workflow before promotion. Browser installation and new-link checks are reported separately. No physical iPhone tap is claimed without the user's confirmation.

## Primary references

- [HA app panel route/property and navigation bridge](https://github.com/home-assistant/frontend/blob/dev/src/panels/app/ha-panel-app.ts)
- [Companion URI actions and foreground activation](https://companion.home-assistant.io/docs/notifications/actionable-notifications/)
