# OpenCode Task: phase32_fix_runtime_provider_profiles_after_reload

## task_id

phase32_fix_runtime_provider_profiles_after_reload

## task_type

acceptance follow-up

## objective

Fix a Codex acceptance issue in phase 32 provider profiles:

The follow-up made profile save/delete endpoints return raw `settings` so the current renderer session can generate with profile API keys. That is not good enough because after reload, `GET /api/settings` returns public settings with profile `apiKey: ""`; selecting a saved profile then produces generation config with an empty API key.

Implement a runtime-profile channel analogous to the existing `runtimeProvider`:

- Public settings must continue hiding raw provider and profile API keys.
- `/api/settings` and relevant profile/save/delete responses should include `runtimeProviderProfiles` with real keys for local desktop generation.
- The renderer must use `runtimeProviderProfiles` for selected profile generation config, not the public `settings.providerProfiles` apiKey field.
- Do not return raw full settings as `settings` from provider-profile endpoints.

## model_selection

- model: deepseek/deepseek-reasoner
- reasoning: ON
- rationale: acceptance-level security/runtime config bug after profile implementation.

## files_allowed

- `desktop/local-server.js`
- `desktop/services/settings-service.js`
- `src/core/settings/settings-schema.js`
- `src/desktop/desktop-shell.js`
- `tests/settings-service.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/phase32_fix_runtime_provider_profiles_after_reload_opencode_report.md`

## files_forbidden

- `desktop.html`
- `src/styles/desktop.css`
- `src/core/generation/provider-stream.js` unless a test proves it is required
- Prompt templates
- Context resolver
- Workflow engine
- Project storage schema
- Release artifacts
- Git operations

## required_fixes

1. Add a runtime profile helper
   - Add a function such as `providerProfileRuntimeConfigs(settingsInput)` in `settings-schema.js` and export it through `settings-service.js`.
   - It should normalize settings and return API-compatible provider profiles with real `apiKey`, endpoint, model, provider, id/name, and generation defaults as needed for generation.
   - It should not include unsupported providers as writer runtime profiles.

2. Fix server responses
   - `GET /api/settings` should return:
     - `settings: settingsService.publicSettings(settings)`
     - `runtimeProvider: settingsService.runtimeProviderConfig(settings)`
     - `runtimeProviderProfiles: settingsService.runtimeProviderProfiles(settings)` or equivalent
   - `POST /api/settings` should do the same.
   - `POST /api/settings/provider-profiles` and delete endpoint should return public `settings` plus `runtimeProviderProfiles`, not raw full settings.

3. Fix renderer runtime lookup
   - Add `settingsState.runtimeProviderProfiles`.
   - Load it from `/api/settings`, `/api/settings` POST, provider profile save/delete responses.
   - `nativeGenerationConfig()` / selected profile config should use runtime profiles with real API keys.
   - `renderWriterModelControl()` may continue using public `settings.providerProfiles` for display and `hasApiKey`.

4. Tests
   - Extend `tests/settings-service.js` so `GET /api/settings` proves public settings hide profile keys while `runtimeProviderProfiles` contains the profile key.
   - Extend writer audit or existing profile test to simulate a settings reload after profiles are saved, then select a profile and verify generation config still has the profile API key.

## test_plan

Run sequentially:

1. `node tests/settings-service.js`
2. `npm run writer-audit`
3. `npm run desktop-mainline-test`
4. `npm run unit`

If time permits also run:

5. `node tests/provider-stream.js`

## success_criteria

- Public settings never expose raw profile API keys.
- Runtime profile configs include real profile API keys after reload.
- Writer profile generation works after reloading settings.
- Profile save/delete endpoints no longer return raw full settings as `settings`.
- Required tests pass.
- Report saved to `.ai_state/test_reports/phase32_fix_runtime_provider_profiles_after_reload_opencode_report.md`.

## failure_conditions

- Any public settings response exposes raw API keys.
- Saved profile generation loses its API key after reload.
- Existing global runtime provider behavior regresses.
- Changes expand outside allowed files.

## required_report_format

Save a report at `.ai_state/test_reports/phase32_fix_runtime_provider_profiles_after_reload_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
