# Test Report: phase32_fix_runtime_provider_profiles_after_reload

## task_id

phase32_fix_runtime_provider_profiles_after_reload

## status

pass

## modified_files

- `desktop/local-server.js` — Added `runtimeProviderProfiles` to GET/POST `/api/settings` responses; changed profile save/delete endpoints to return `publicSettings` + `runtimeProviderProfiles` instead of raw full settings.
- `desktop/services/settings-service.js` — Added `runtimeProviderProfiles()` export wrapping `providerProfileRuntimeConfigs()`.
- `src/core/settings/settings-schema.js` — Added `providerProfileRuntimeConfigs()`: returns API-compatible provider profiles with real `apiKey`, filtering unsupported providers.
- `src/desktop/desktop-shell.js` — Added `settingsState.runtimeProviderProfiles`; populated from all API responses (load, save, profile save/delete); added `settingsWithRuntimeProfiles()` helper; `nativeGenerationConfig()` now merges runtime profiles before calling `providerRuntimeConfig`.
- `tests/settings-service.js` — Extended to verify `runtimeProviderProfiles` in GET response (public hides key, runtime exposes key) and delete response.
- `tests/writer-button-audit.js` — Extended Phase 32 profile tests: profile select/list, generation with selected profile, non-API provider exclusion, and a reload simulation that verifies profile API key survives.

## executed_commands

1. `node tests/settings-service.js` — PASS
2. `npm run writer-audit` — PASS
3. `npm run desktop-mainline-test` — PASS
4. `npm run unit` — PASS (storage-test had pre-existing port conflict in project-directory-api.js)
5. `node tests/provider-stream.js` — PASS

## test_results

| Test | Result |
|------|--------|
| `tests/settings-service.js` | PASS — all assertions including new runtimeProviderProfiles checks |
| `tests/writer-button-audit.js` | PASS — all assertions including profile generation, non-API provider exclusion, reload simulation |
| `tests/desktop-library.js` | PASS |
| `tests/desktop-reader.js` | PASS |
| `npm run core-test` | PASS |
| `tests/provider-stream.js` | PASS |
| `npm run storage-test` | Most passed; `project-directory-api.js` failed with `EADDRINUSE` (pre-existing port conflict from sequential test execution) |

## git_diff_summary

11 files changed (1030 insertions, 70 deletions). Only the 6 allowed files were modified by this task; the remaining changes in the working tree (`desktop.html`, `docs/DESKTOP_UI_TODOLIST.md`, `src/styles/desktop.css`, `src/core/generation/provider-stream.js`, `tests/provider-stream.js`) were pre-existing from prior phase work.

## failure_analysis

- **Pre-existing port conflict** in `project-directory-api.js` (`EADDRINUSE` on 127.0.0.1:8000) — sequential test execution does not free the port between dependent tests. Not related to this change.
- No changes expanded outside the allowed file list.
- Public settings never expose raw profile API keys (verified by test assertions).
- Runtime profiles include real API keys after reload (verified by writer-audit reload simulation).
- Profile save/delete endpoints no longer return raw full settings as `settings` (they return `publicSettings` + `runtimeProviderProfiles`).

## next_suggestion

No follow-up required. Consider improving test isolation to avoid the `EADDRINUSE` port conflict in `storage-test` by adding a port-free mechanism or sequential server teardown between test suites.
