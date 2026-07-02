# OpenCode Task: phase32_writer_provider_profile_model_switch

## task_id

phase32_writer_provider_profile_model_switch

## task_type

medium implementation

## objective

Add a first usable version of provider/vendor switching on the native writer page.

The user need is slightly different from the existing DeepSeek-only model selector: some users will configure more than one API-compatible vendor and want to choose the vendor/profile and model directly in the writing interface.

Implement this as a conservative first pass:

- Settings can persist multiple API provider profiles for OpenAI Chat Completions-compatible providers.
- The existing global provider settings remain backward-compatible and automatically act as one available profile.
- The writer generation panel lets the user choose an already configured provider profile, then choose a model available for that provider, or enter a custom model id.
- The writer page must not offer unconfigured API vendors as selectable working profiles.
- DeepSeek thinking mode remains supported, with existing capability sanitization and reasoning stream behavior.

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: LOW
- rationale: module-level UI/settings/generation wiring with tests; not a root-cause diagnosis task.

## files_allowed

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `src/core/settings/settings-schema.js`
- `src/core/generation/provider-stream.js`
- `desktop/services/settings-service.js`
- `desktop/storage/settings-store.js`
- `desktop/local-server.js`
- `tests/settings-service.js`
- `tests/provider-stream.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/phase32_writer_provider_profile_model_switch_opencode_report.md`

If a small new helper module is clearly cleaner than expanding existing files, you may add one under:

- `src/core/generation/`
- `src/core/settings/`

## files_forbidden

- Project storage schema and project data migration files
- Prompt template/default-prompt files
- Context resolver / compendium tag matching logic
- Workflow engine files
- Backup/recovery engine files
- Release artifacts under `release/`
- Git metadata or branch operations

## implementation_requirements

1. Settings schema
   - Add a normalized `providerProfiles` array or equivalent.
   - Keep `providerSettings` behavior unchanged for old settings files.
   - Blank API key updates must preserve the existing secret for the same profile, just like the current single provider settings do.
   - `publicSettings()` must never expose raw profile API keys; it should expose `hasApiKey`.
   - Runtime configuration used by generation may include the selected profile's real API key because this is a local desktop app and the current runtime provider already behaves that way.

2. Supported first-pass provider profiles
   - Support local models through the existing global local configuration.
   - Support OpenAI Chat Completions-compatible API profiles only:
     - `deepseek`
     - `openai`
     - `openrouter`
     - `nanogpt`
     - `openai-compatible`
     - `custom`
   - Do not present `anthropic` or `google` as working writer vendor choices in this phase unless you also implement real provider-specific adapters. They are allowed to remain in the global provider select if already present, but the writer profile list must avoid pretending unsupported providers are ready.

3. Model catalog
   - Add a small model catalog helper or table with provider-specific entries.
   - Include DeepSeek:
     - `deepseek-v4-pro`
     - `deepseek-v4-flash`
   - Include a custom model option for every API-compatible provider.
   - For OpenAI/OpenRouter/NanoGPT/OpenAI-compatible/custom, avoid hard-coding unsupported claims. It is acceptable for the first pass to offer a short "common examples" catalog plus a custom input, but the generated request must use the selected/custom model id exactly.
   - Model lists must be filtered by the chosen provider profile.

4. Writer UI
   - Replace or expand the existing DeepSeek-only model control into:
     - provider/profile select
     - model select
     - custom model input shown only when custom is selected
     - thinking toggle shown/enabled only when the selected model/provider supports it
   - Keep layout compact and readable at 1366x768 and 1920x1080.
   - If there is no configured API profile, the writer page should clearly fall back to "inherit/global/local" rather than showing unusable vendor options.
   - Persist the writer override in localStorage in a backward-compatible way. Existing `inherit/deepseek-v4-pro/deepseek-v4-flash` overrides should still normalize correctly.

5. Generation behavior
   - `nativeGenerationConfig()` must apply the selected provider profile, endpoint, apiKey, model, and thinking flag.
   - Selecting "inherit" must continue to use the global runtime provider.
   - DeepSeek thinking mode must still set `enableThinking` and must still sanitize unsupported sampling parameters.
   - Other OpenAI-compatible providers must not receive DeepSeek-only `thinking` fields.

6. Settings UI
   - Add the minimal UI needed to manage extra API-compatible profiles, or an equivalent first-pass mechanism that allows at least two configured API profiles to exist and be selected from the writer page.
   - Keep the existing global provider settings form working.
   - Do not redesign the whole Settings page.

## test_plan

Run these sequentially:

1. `node tests/settings-service.js`
2. `node tests/provider-stream.js`
3. `npm run writer-audit`
4. `npm run desktop-mainline-test`
5. `npm run unit`

Add or update tests so they verify:

- Public settings hide raw API keys for both global provider and extra profiles.
- Blank API key updates preserve existing profile secrets.
- Writer page only exposes configured provider profiles.
- Writer page can select at least two configured API-compatible profiles.
- Selecting a DeepSeek profile/model with thinking enabled produces generation config with `provider: "deepseek"`, selected model, and `enableThinking: true`.
- Selecting a non-DeepSeek OpenAI-compatible profile uses the chosen/custom model and does not set DeepSeek thinking fields.

## success_criteria

- The writer page can switch between configured provider profiles and models.
- Unconfigured vendors are not offered as selectable working profiles.
- DeepSeek thinking mode remains functional and streamed reasoning tests still pass.
- Existing global provider settings remain backward-compatible.
- Required tests pass sequentially.
- Diff stays within the allowed files and does not change unrelated business logic.
- OpenCode report is saved to `.ai_state/test_reports/phase32_writer_provider_profile_model_switch_opencode_report.md`.

## failure_conditions

- Any required test fails.
- Raw API keys are exposed through public settings.
- Writer page offers unsupported/unconfigured vendors as if they were usable.
- DeepSeek thinking mode regresses.
- Existing single-provider settings are broken.
- Implementation touches forbidden files or expands into narrative-control/template/workflow features.

## required_report_format

Save a report at `.ai_state/test_reports/phase32_writer_provider_profile_model_switch_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
