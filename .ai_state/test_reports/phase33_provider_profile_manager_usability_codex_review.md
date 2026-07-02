# Codex Review: phase33_provider_profile_manager_usability

## status

accepted

## scope reviewed

- Saved provider-profile test endpoint
- Settings profile list test button and inline status
- Provider metadata, default endpoint/model hints, and default switching behavior
- Public settings API key hiding plus runtime profile key handling
- Writer-page profile filter preservation

## acceptance notes

OpenCode initially failed during execution because the model call hit an `unknown certificate verification error` after partial edits. After the network recovered, OpenCode resumed from the current working tree and completed phase 33.

Codex review found one acceptance gap: changing provider in the profile editor did not replace fields that still contained the previous provider's default endpoint/model. A scoped OpenCode follow-up `phase33_fix_provider_default_switching` added known-default detection and updated the provider change handler so default values switch while custom user values are preserved.

Temporary `.opencode-home` and `.opencode-config` directories created during bridge troubleshooting were confirmed inside the workspace and removed.

## verification

Codex independently ran:

- `node tests/settings-service.js` - PASS
- `npm run writer-audit` - PASS
- `npm run desktop-mainline-test` - PASS
- `npm run unit` - PASS

## decision

Phase 33 is accepted.

Remaining future work:

- Live profile testing UX with explicit offline/config-only vs live modes
- Better dynamic model catalogs from provider APIs where available
- Provider-specific adapters for Anthropic and Google
