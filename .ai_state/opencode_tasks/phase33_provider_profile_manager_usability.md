# OpenCode Task: phase33_provider_profile_manager_usability

## task_id

phase33_provider_profile_manager_usability

## task_type

medium implementation

## objective

Improve the first-pass API provider profile manager so users can actually configure and validate multiple vendors more comfortably before using them on the writer page.

This phase builds on accepted phase 32. Do not change generation prompt behavior. Focus only on provider-profile usability and validation.

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: LOW
- rationale: UI/service/test wiring for an existing feature, not a root-cause investigation.

## files_allowed

- `desktop.html`
- `desktop/local-server.js`
- `desktop/services/settings-service.js`
- `src/core/settings/settings-schema.js`
- `src/core/settings/model-catalog.js`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/settings-service.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/phase33_provider_profile_manager_usability_opencode_report.md`

## files_forbidden

- Prompt templates
- Context resolver / compendium logic
- Provider streaming request logic except through existing settings/test-provider paths
- Workflow engine
- Project storage schema
- Release artifacts
- Git operations

## implementation_requirements

1. Profile connection test
   - Add a saved-profile test endpoint, for example `POST /api/settings/test-provider-profile`.
   - It should accept a `profileId`, find the saved profile, and call the existing provider test logic as an API provider config.
   - It must preserve existing API key handling: public settings do not expose raw keys, but the server can read stored keys locally for the test.
   - It should return `{ ok, result }` like the existing provider test endpoint.
   - Unsupported/non-compatible providers should return a clear failure instead of attempting a fake test.

2. Settings profile UI
   - Add a "测试" action for each saved provider profile in the profile list.
   - Show per-profile test status inline in the profile list, such as "配置可用", "缺少 API Key", "HTTP 401", "连接失败".
   - Disable the test button while the specific profile test is running.
   - Do not require users to re-enter an already saved API key just to test a saved profile.

3. Provider defaults and hints
   - Add provider metadata to `model-catalog.js` or an adjacent settings helper:
     - display label
     - default endpoint when confidently known in the current app architecture
     - short hint for model/custom-model usage
   - At minimum cover:
     - DeepSeek: `https://api.deepseek.com/chat/completions`, default `deepseek-v4-pro`
     - OpenAI: `https://api.openai.com/v1/chat/completions`, common model hint/custom allowed
     - OpenRouter: `https://openrouter.ai/api/v1/chat/completions`, custom model id expected
     - OpenAI-compatible/custom: user-supplied endpoint/model
   - For providers where the endpoint is uncertain, prefer a hint over a hard-coded value.
   - When changing provider in the profile editor, if the endpoint/model fields are empty or still contain the previous provider's default, update them to the new provider's default/hint.

4. Writer integration
   - Keep phase 32 behavior: only configured API-compatible profiles appear in the writer profile select.
   - After a profile is tested or saved, the writer model control should remain in sync.
   - Do not show Anthropic/Google as writer-selectable providers unless true adapters are implemented.

5. Tests
   - Extend settings-service tests for `test-provider-profile`:
     - saved DeepSeek/OpenAI-compatible profile without live network test returns configuration-ok when `live: false`
     - missing profile id returns failure
     - public settings still hide profile keys
   - Extend writer audit to verify:
     - profile list includes test buttons
     - testing a saved profile shows an inline status
     - writer profile select still contains only configured API-compatible profiles

## test_plan

Run sequentially:

1. `node tests/settings-service.js`
2. `npm run writer-audit`
3. `npm run desktop-mainline-test`
4. `npm run unit`

If time permits:

5. `node tests/provider-stream.js`

## success_criteria

- Users can test each saved API provider profile from Settings.
- Saved profile tests use stored keys without exposing them in public settings.
- Clear inline status appears for pass/fail/running cases.
- Provider editor gives useful defaults/hints without pretending unsupported providers work.
- Writer profile/model switching from phase 32 remains functional.
- Required tests pass and report is saved.

## failure_conditions

- Any required test fails.
- Public settings expose raw API keys.
- Writer profile select starts showing unconfigured or unsupported providers.
- The implementation changes prompt generation, context injection, workflow engine, or project storage.

## required_report_format

Save a report at `.ai_state/test_reports/phase33_provider_profile_manager_usability_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
