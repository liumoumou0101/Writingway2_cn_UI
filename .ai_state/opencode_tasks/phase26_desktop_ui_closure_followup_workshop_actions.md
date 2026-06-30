# OpenCode Task: phase26_desktop_ui_closure_followup_workshop_actions

## task_id
phase26_desktop_ui_closure_followup_workshop_actions

## task_type
frontend_ui_bugfix

## model_selection
- model: deepseek-v4-pro
- reasoning: OFF
- rationale: Narrow CSS/DOM visibility bug found during Codex acceptance of the desktop UI closure pass.

## objective
Fix the workshop output action bar so it is visually hidden when there is no assistant message. Codex acceptance found that `renderWorkshop()` sets `hidden`, but the CSS `display: flex` rule still renders the bar.

## files_allowed
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js` only if the CSS-only fix cannot pass verification
- `.ai_state/execution_log.md`

## forbidden_scope
- Do not modify storage, services, generation/provider logic, backup/recovery logic, workflow engine, package metadata, release output, or tests unrelated to this visibility bug.
- Do not redesign workshop or expand the desktop UI closure scope.
- Do not change button behavior after assistant output exists.

## required_fix
- Ensure `[data-workshop-output-actions]` is not displayed before an assistant reply exists.
- Ensure the action bar becomes visible again after an assistant reply exists.
- Prefer a CSS rule such as `.desktop-workshop-output-actions[hidden] { display: none; }` if sufficient.

## test_plan
Run:
- `npm run desktop-mainline-test`
- `npm run writer-audit`

Also run or describe a focused Playwright/DOM verification proving:
- before workshop assistant output: `getComputedStyle([data-workshop-output-actions]).display === 'none'`
- after assistant output: action bar is visible and action buttons follow existing enabled/disabled behavior

## success_criteria
- Focused workshop visibility verification passes.
- Required tests pass.
- Git diff is limited to allowed files and directly tied to this bug.

## failure_conditions
- Any required test fails.
- The action bar remains visible before assistant output.
- The action bar does not reappear after assistant output.
- Diff touches forbidden files or broadens scope.
