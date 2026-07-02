# Codex Review: phase34_character_compendium_context_policy

## status

accepted_after_followups

## scope reviewed

- `src/core/knowledge/compendium-schema.js`
- `src/core/context/context-resolver.js`
- `src/core/generation/prompt-builder.js`
- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/context-prompt-core.js`
- `tests/writer-button-audit.js`
- `docs/DESKTOP_UI_TODOLIST.md`
- OpenCode reports:
  - `.ai_state/test_reports/phase34_character_compendium_context_policy_opencode_report.md`
  - `.ai_state/test_reports/phase34_fix_title_alias_injection_policy_opencode_report.md`
  - `.ai_state/test_reports/phase34_fix_always_policy_mapping_opencode_report.md`

## acceptance result

Phase 34 is accepted.

The implementation now gives each character/compendium card a controllable injection policy:

- `disabled`
- `manual`
- `mention`
- `auto`
- `always`

The first-pass triggers are implemented:

- title
- aliases
- tags
- POV character
- scene characters

Character cards also now support first-pass structured prompt fields:

- role
- goal
- motivation
- conflict
- voice
- currentState
- knowledge
- relationshipNotes

## review findings and follow-ups

Codex review found two follow-up issues after the initial OpenCode implementation:

1. Title and alias triggers were not independent enough.
   - Follow-up task: `phase34_fix_title_alias_injection_policy`
   - Result: fixed. Plain title/alias mentions now work for `mention` and `auto` modes, using the existing ASCII-boundary-safe `textMentionsTerm()` helper. Title and alias switches gate their respective matches independently.

2. The old `alwaysInContext` checkbox could keep stale `true` state after changing a legacy always card to another policy mode.
   - Follow-up task: `phase34_fix_always_policy_mapping`
   - Result: fixed. The new policy mode is now the source of truth; `alwaysInContext` is submitted as true only when `contextPolicy.mode === 'always'`, and the old checkbox mirrors the mode visually.

## verification

OpenCode reports passing:

- `node tests/context-prompt-core.js`
- `node tests/unit-context-tags.js`
- `node tests/compendium-service.js`
- `node tests/writer-button-audit.js`
- `npm run desktop-mainline-test`
- `npm run unit`

Codex review additionally checked:

- UTF-8 source readability with Node reads, distinguishing real file content from PowerShell console mojibake.
- `node -c tests/writer-button-audit.js`
- `node -c src/desktop/desktop-shell.js`
- `git diff --check`
- focused diff review of context resolver, compendium schema, prompt builder, desktop form mapping, and writer audit coverage.

## residual notes

- `sceneCharacters` is supported in the core resolver, but desktop scene metadata still derives this first pass from matching scene tags. A dedicated scene character/participant field remains a future improvement.
- Current conditions are intentionally simple. A later rule engine can add compound conditions such as "POV matches and tag present" without replacing this schema.
