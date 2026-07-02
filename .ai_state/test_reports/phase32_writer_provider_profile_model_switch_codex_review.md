# Codex Review: phase32_writer_provider_profile_model_switch

## status

accepted

## scope reviewed

- Writer-page provider/profile selector
- Provider-specific model catalog and custom model input
- DeepSeek Thinking toggle and reasoning stream compatibility
- Multiple API-compatible provider profile persistence
- Public settings API key hiding and runtime profile API key handoff
- Writer audit coverage for profile switching and reload behavior

## acceptance notes

OpenCode's first implementation timed out without a report and left partial changes. Codex reviewed the partial diff and found:

- Missing Settings generation section wrapper
- DeepSeek Thinking disabled for inherited global DeepSeek model
- Unconfigured API profiles appearing as writer-selectable profiles
- Profile API keys lost after settings reload because only public profile data was available to the renderer

Follow-up OpenCode tasks fixed these issues by:

- Restoring Settings HTML structure
- Enabling Thinking based on the effective inherited DeepSeek model
- Filtering writer-selectable profiles to configured API-compatible profiles only
- Adding `runtimeProviderProfiles` so public settings still hide API keys while the local renderer can generate with saved profiles after reload

## verification

Codex independently ran:

- `node tests/settings-service.js` - PASS
- `node tests/provider-stream.js` - PASS
- `npm run writer-audit` - PASS
- `npm run desktop-mainline-test` - PASS
- `npm run unit` - PASS

## decision

Phase 32 first pass is accepted.

Remaining future work is product expansion, not a blocker for this phase:

- Better provider-specific adapters for Anthropic and Google
- Dynamic or user-managed model catalogs
- More polished settings-page API profile manager
- Optional live connection test per profile
