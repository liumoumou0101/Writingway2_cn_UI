# OpenCode Task: phase28_desktop_ui_polish_followup_checkbox

## task_id
phase28_desktop_ui_polish_followup_checkbox

## task_type
frontend_ui_bugfix

## model_selection
- model: deepseek-v4-pro
- reasoning: OFF
- rationale: Narrow CSS regression from the first UI polish pass.

## objective
Fix the oversized checkbox visual regression in the compendium form after `phase28_desktop_ui_polish_first_pass`. The `默认加入生成上下文` checkbox currently appears as an oversized square in the compendium editor. It should visually match the smaller desktop checkbox style used elsewhere.

## files_allowed
- `src/styles/desktop.css`
- `.ai_state/execution_log.md`

## forbidden_scope
- Do not modify HTML or JavaScript unless absolutely necessary.
- Do not change compendium behavior or data.
- Do not redesign the compendium form beyond this checkbox/control sizing fix.
- Do not touch provider, storage, core, tests, release artifacts, or unrelated modules.

## required_fix
- Ensure checkbox inputs inside `.desktop-compendium-form-grid` are not affected by generic compendium input min-height/full-width rules.
- The checkbox row should remain aligned, readable, and compact.
- Keep global checkbox styling intact for other modules.

## test_plan
Run:
- `npm run writer-audit`
- `npm run desktop-mainline-test`

Also visually/DOM verify the compendium checkbox:
- checkbox bounding box should be roughly 16-18px, not 36px+.
- no horizontal overflow at 1366x768.

## success_criteria
- Required tests pass.
- Compendium checkbox is visually compact.
- Diff is limited to allowed files.

## failure_conditions
- Tests fail.
- Checkbox remains oversized.
- Diff touches forbidden files or unrelated UI areas.
