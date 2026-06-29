# Codex Review: phase23_w3_fix_generation_task_behavior

Date: 2026-06-29

## OpenCode Report Summary

OpenCode reported `completed`.

Reported passing commands:

- `npm run writer-audit`
- `npm run desktop-mainline-test`
- `npm run unit`

Reported modified files:

- `src/desktop/desktop-shell.js`
- `tests/writer-button-audit.js`

## Codex Acceptance Decision

`success`

## Review Notes

- `summary` generation task now enables the generate button whenever a scene exists, even when beat text is empty.
- Beat textarea placeholder now changes by task:
  - continue: optional direction
  - beat: required beat description
  - summary: no input needed
- Prompt preview is disabled for summary task, which is acceptable because summary uses the existing dedicated summary path.
- Writer audit now verifies summary task behavior by clearing beat input, selecting summary, checking the generate button is enabled, checking placeholder guidance, clicking generate, and verifying scene summary output.
- Rewrite task buttons remain mapped to existing rewrite presets, preserving the existing rewrite core.

## Residual Notes

- This task intentionally does not redesign generation prompts or context architecture.
- A later design pass may improve microcopy and add chapter-scope summary as a separate task entry.

