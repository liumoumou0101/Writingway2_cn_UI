# Codex Review: phase24_generation_history_filter_copy

Date: 2026-06-29

## Verdict

partial

## OpenCode Report Summary

OpenCode reported `completed` and sequentially ran:

- `npm run writer-audit` -- passed
- `npm run desktop-mainline-test` -- passed
- `npm run unit` -- passed

The task added or verified:

- current-scene history filter selector
- copy action with `window.__writingwayAuditClipboard` fallback
- writer audit coverage for copy and filter

## Acceptance Findings

The behavior exists and tests pass, but the task does not meet the no-mojibake success criteria:

- history panel labels still render as mojibake for the current-scene filter, empty state, unnamed generation title, meta unit, reuse/copy/retry/insert/delete labels, and copy/status messages
- `tests/writer-button-audit.js` clicks buttons using mojibake text, so it would not catch the user-facing regression

The result is accepted only as partial. A focused follow-up is required.

## Required Follow-Up

Create and execute `phase24_fix_history_panel_mojibake_tests`:

- fix only generation-history panel user-facing labels/status messages to readable Chinese
- update writer audit to target stable `data-native-history-*` attributes and assert readable labels
- keep behavior unchanged
- rerun `npm run writer-audit`, `npm run desktop-mainline-test`, and `npm run unit`

