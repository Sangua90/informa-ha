# Altro and exercise image audit

## Changes

- Connessioni contains automatic integrations; the original equipment card and
  its details now live in a dedicated Attrezzatura page under Altro.
- The 49-exercise photo manager lives under Esercizi → Foto e guide esercizi.
  Older duplicate managers are prevented from being recreated in Connessioni.
- A top-right accessible X follows the actual page trail, including pages that
  bypass go() and pages replaced after an asynchronous render. Direct links have
  explicit parent fallbacks. An expanded details subsection closes first. Root
  tabs reset the trail. The standalone catalog gets the same X.
- Height is entered under Progressi e misure, persisted as a dated measurement,
  and updates profile.height_cm in the same transaction. Blank subsequent height
  values preserve the profile value. Existing measurements remain untouched.
  The profile height row was removed; current height initializes the measurement
  field without overwriting typed input.

## Image findings

The repository has seven approved WebP sheets (1122 × 1402): calf_raise,
glute_bridge, goblet_squat, lateral_raise, plank, romanian_deadlift and
shoulder_press. Visual review shows a consistent black/orange header, grey 3D
figure, equipment panel, starting/ending positions and bottom warning strip.

Four legacy SVG wrappers (chest, curl, lat, pushdown) embed small 220 × 293 JPEGs.
They use a different, denser white/red layout. Four separate guides_hd SVGs use
dark backgrounds with green/blue schematic figures: a third visual style.
Upscaling the embedded JPEGs does not restore their original text detail.

There is no bundled image for the remaining 38 of the canonical 49 exercises.
The two old dumbbell image IDs are now recognized as aliases of the canonical
dumbbell_shoulder_press and dumbbell_lateral_raise IDs. A user's canonical upload
still wins over the alias. No image contents or existing user uploads were
replaced. Thumbnail fitting was changed from cover to contain to avoid cropping
the exercise illustration. Actual /data/guides uploads in the user's HA instance
are unavailable here, so this is a repository audit, not an installation audit.

## Verification

58 Python tests and 30 JavaScript tests, plus syntax/contract checks for 94 JS
files and the actual 68-fragment Docker bundle. New tests cover the back trail,
direct-render subpages, close restoration after re-render, root navigation,
delayed legacy managers, category placement, height entry/history/profile
updates and guide alias precedence. Existing workout/exclusion tests remain.

The full assembled bundle was also loaded in headless desktop Edge at a
390 × 844 viewport with mocked API responses. Profile, Connessioni, Attrezzatura,
Progressi e misure and Foto e guide were opened and their screenshots inspected.
Each showed one X and no uncaught page errors were reported. Legacy SVGs and the
11 raster sheets were reviewed visually. This is not an iPhone/Safari or live
Home Assistant runtime test. CI builds amd64 and aarch64 before promotion.
