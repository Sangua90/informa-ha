# Measurement guide and completed questions — 0.10.95

## Changes

- Added a field-specific illustrated guide for height, weight, waist, chest, right/left arm and right/left thigh. Original inline SVG highlights the selected location; directions clarify that right/left refer to the user's own body. Each field has an accessible help button. X returns to the measurement form and preserves unsaved values.
- Kept measurement units, persistence and historical records. Removed the old hidden form instead of merely hiding it: five duplicated IDs could resolve to the hidden inputs rather than the visible values. A regression check now verifies the values actually submitted from the visible form.
- After saving an answer, the question form closes and a completion message appears. Previous answers are in a collapsed history and open for editing only on explicit selection. An old notification for an answered question also shows completion rather than reopening the form. Answers remain in the Coach context.
- Live HA service discovery showed `notify.mobile_app_iphone_17pro_di_edo`; the previous hard-coded name was missing `_edo`. Notifications now resolve registered phone services, prefer the known phone, and do not guess between multiple unknown phones or select a tablet.
- A rate-limited test notification can be sent from the questions page without creating a question or altering saved answers. It uses the native app route and foreground URI action from 0.10.94.

## Verification

- Full Python suite: **99 passed**. Full seven JavaScript suites: **72 passed**.
- Static/build contracts: 97 JavaScript files / 71 production fragments, Python syntax and catalog checks.
- Complete production import-chain smoke test on disposable data: nine GET endpoints, existing training regressions, notification/answer deduplication and saved answers in fresh AI context.
- New/updated behavior checks cover answer completion and explicit history editing, an answered notification remaining closed, all eight guides and their units/regions, X retaining draft values, no duplicate input IDs, and the exact visible values reaching the save request.
- Notification checks cover selection of the registered iPhone, excluding tablets and ambiguous phones, and test notification rate limiting without changing a completed answer.
- Actual amd64/aarch64 builds and browser installation/visual checks are required before claiming the deployed result. Physical iPhone behavior is not established by browser/JSDOM tests; user confirmation is reported separately.

## Measurement references

The guide describes repeatable self-tracking methods, not diagnostic thresholds. Waist uses the WHO midpoint between the last palpable rib and iliac crest. Arm/thigh midpoint landmarks follow the linked anthropometry protocol. Chest/weight/general tape technique follow NHS guidance. Sources are also accessible within the guide:

- [WHO STEPS measurement manual](https://www.who.int/docs/default-source/ncds/ncd-surveillance/steps/steps-manual.pdf)
- [NHS body measuring techniques](https://elht.nhs.uk/services/dietetics/body-measuring-techniques)
- [NIH-hosted CDC/NHANES anthropometry protocol](https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/document.cgi?phd=4124&study_id=phs000007.v21.p8)
