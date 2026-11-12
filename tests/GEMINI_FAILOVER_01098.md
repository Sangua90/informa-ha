# Gemini failover and persistent connection result — 0.10.98

The original bounded retries could stop after one 503 when Interactions supplied a Retry-After beyond the request deadline. Changing models still used that same endpoint. The transport now tries the separate, officially supported generateContent interface for temporary Interactions/server/network failures, preserving the configured model, system instruction, complete minimized context and output JSON schema. It does not switch providers or treat a local plan as a Gemini response.

At most three calls share the existing total deadline. A short first-call timeout reserves time for the alternate interface. The failed Interactions URI is not called again before its Retry-After. The alternate honors its own Retry-After. Authentication, permission, billing and ordinary quota errors do not trigger failover. Reasoning parts and truncated candidate output are not accepted as an answer.

The manual connection endpoint uses this exact transport and verifies a tiny structured JSON result, without personal context. This exercises the output format required by workout generation, rather than establishing only plain-text connectivity. Its diagnostics contain only endpoint names, HTTP statuses, allowlisted Google error codes, numeric Retry-After values and a structured-output validation flag, in thread-local state. No upstream error body, private URL, API key or context is returned in diagnostics. The UI keeps success or failure visible after its configuration refresh and exposes these diagnostics in an optional closed detail. Double-clicks do not duplicate the test.

## Executed checks

- Full local Python suite: **116 passed**. Includes long Retry-After followed by a real-shaped generateContent result, identical model/context/schema, bounded alternate failures, no retries/failover for permanent failures, and filtering of thoughts/truncated output.
- Full seven JavaScript suites: **82 passed**. Added a production-bundle check for persistent connection success/error and single-flight testing. Existing session restore, explicit pause, treadmill skip, canonical progress, weights and substitutions remain covered.
- Static/build contracts: **98 JavaScript files, exact 72-fragment production bundle**, Python syntax and 49-exercise catalog passed.
- Full production import chain on disposable data: ten GET routes plus real POST connection and workout routes with mocked Google transport. A 503 with Retry-After 120 switches to generateContent; the returned workout passes real validation and retains Plank in seconds. Existing measurement, archive, finish, question/answer and retry checks also pass.

Actual amd64/aarch64 image builds must pass before promotion. A connection or workout response from real Google is a separate deployment check; mocked provider checks do not establish Google availability or physical iPhone behavior.

## Primary references

- [Google Interactions overview](https://ai.google.dev/gemini-api/docs/interactions-overview) confirms generateContent remains supported.
- [Google generateContent reference](https://ai.google.dev/api/generate-content) describes generationConfig.responseFormat.text with MIME type and schema.
- [Google API errors](https://ai.google.dev/gemini-api/docs/api-errors) distinguishes transient 503 from authentication, permission and quota errors.
