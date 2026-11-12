# Startup data loading

The real index no longer contains homeWeight. The old loader assigned its
textContent unconditionally, caught the resulting TypeError as a connectivity
failure, displayed Backend non raggiungibile and stopped before setting the
profile and version. renderHealth had the same obsolete assumption.

Both now tolerate absent layout fields. State, health and nutrition requests
settle independently; unavailable optional data no longer suppresses profile
and version. State renders before health to retain automatic weight precedence.
Request failures and render failures have separate messages; real core request
failures still display the connectivity warning.

Four startup tests execute the actual index and complete Docker bundle, or the
core loader for targeted failure cases. They cover healthy startup without the
legacy weight field, repeated loads, unavailable optional endpoints, a real
core endpoint failure and a renderer failure. All four failed before the fix.
No actual production endpoint is mocked in these automated tests: fixtures
simulate responses. Live HA checks are reported separately.

Local verification: 67 Python tests (python -X utf8 on Windows), 37 JavaScript
tests; verify_build.py checks 95 JS files, 69 bundled fragments, Python syntax
and Docker source contracts. CI also builds amd64/aarch64 containers.

An initial Windows Python invocation without UTF-8 failed on legacy fixture
file decoding; rerunning with explicit UTF-8 passed. No Python source or test
was changed to work around that environment issue.
