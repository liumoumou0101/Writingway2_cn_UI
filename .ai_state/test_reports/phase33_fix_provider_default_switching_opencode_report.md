# OpenCode Report: phase33_fix_provider_default_switching

## task_id

phase33_fix_provider_default_switching

## status

completed

## modified_files

- `src/core/settings/model-catalog.js` (untracked - new file from previous phase, added 2 helper functions)
- `src/core/settings/settings-schema.js` (added `isKnownDefaultEndpoint`, `isKnownDefaultModelHint`, `PROVIDER_DEFAULT_MODELS` fallback)
- `src/desktop/desktop-shell.js` (updated `bindProfileActions` provider change handler)

## executed_commands

- `npm run writer-audit` - PASSED
- `node tests/settings-service.js` - PASSED

## test_results

- **writer-audit**: Writer button audit passed.
- **settings-service**: Settings service test passed.

Both required tests pass with no regressions.

## git_diff_summary

### model-catalog.js (untracked)
Added two helper functions:
- `isKnownDefaultEndpoint(endpoint)` - checks if an endpoint string matches any known provider's `defaultEndpoint` in `PROVIDER_METADATA`
- `isKnownDefaultModelHint(model)` - checks if a model string matches any known provider's `defaultModelHint` in `PROVIDER_METADATA`

Exported both via the module return object.

### settings-schema.js
Added fallback implementations for `isKnownDefaultEndpoint` and `isKnownDefaultModelHint` (delegating to `ModelCatalog` when available, with local fallback to `PROVIDER_DEFAULT_ENDPOINTS` / `PROVIDER_DEFAULT_MODELS`). Also expanded `PROVIDER_DEFAULT_ENDPOINTS` and added `PROVIDER_DEFAULT_MODELS` constant.

### desktop-shell.js (provider change handler only)
Updated the `change` event handler on `elements.profileProvider` in `bindProfileActions()`:
- Added `endpointIsDefault` check using `isKnownDefaultEndpoint(currentEndpoint)`.
- Condition for endpoint update changed from `(!currentEndpoint || looksLocal)` to `(!currentEndpoint || looksLocal || endpointIsDefault)`.
- Added `modelIsDefault` check using `isKnownDefaultModelHint(currentModel)`.
- Condition for model update changed from `!currentModel` to `(!currentModel || modelIsDefault)`.

### Behavior changes:
1. **DeepSeek -> OpenAI switch**: If endpoint is `https://api.deepseek.com/chat/completions`, it now gets replaced with `https://api.openai.com/v1/chat/completions`. Same for model (`deepseek-v4-pro` -> `gpt-4o-mini`).
2. **Custom endpoint/model**: If the user typed a non-default custom endpoint like `https://my-proxy.example.com/v1`, it is NOT overwritten on provider change.
3. **Empty endpoint/model**: Still updates to new provider defaults (existing behavior preserved).
4. **localhost endpoints**: Still treated as "to be replaced" (existing behavior preserved).

## failure_analysis

None. All tests pass. No regressions detected.

## next_suggestion

No further action required. The provider default switching now correctly detects and replaces previous provider defaults when the user changes providers in the profile editor.
