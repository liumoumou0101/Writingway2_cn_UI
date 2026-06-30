# OpenCode Task: phase28_desktop_ui_polish_first_pass

## task_id
phase28_desktop_ui_polish_first_pass

## task_type
frontend_ui_polish

## model_selection
- model: deepseek-v4-pro
- reasoning: LOW
- rationale: This is a medium UI/style polish task with limited DOM changes and no core business logic changes.

## objective
Implement the first desktop UI polish pass according to Codex design direction. The goal is to make the app feel like a calmer long-form writing desktop tool, not an engineering/debug console, while preserving all existing functions.

## design_direction_from_codex
1. Establish a shared visual baseline for controls:
   - inputs, selects, textareas, buttons, checkboxes, and range sliders should look intentional and consistent.
   - native selects should no longer look raw/default; add consistent height, padding, arrow treatment, focus, hover, disabled states.
   - checkbox/range controls should visually match the desktop theme.
2. Improve writer assistant panel hierarchy:
   - keep all current tabs and actions.
   - make tab bar and current panel sections feel organized, with clearer grouping and spacing.
   - reduce "button pile/debug panel" feeling in generation/rewrite/context/metadata/search/history.
3. Improve first-screen polish for major modules:
   - bookshelf: reduce visual clutter in project card/action areas through spacing, action hierarchy, and chip styling. Do not remove actions in this pass.
   - compendium: make form fields, tags, checkbox, and save/delete area feel like a product form, not raw database fields.
   - workflow: empty/current run area should not feel like a blank unloaded page; provide a clear panel/timeline/placeholder style using existing DOM where possible.
   - recovery: empty state and restore action area should be clearer and less awkward.
   - settings: make provider/default/TTS sections more compact and visually consistent.
   - reader: style file input/range/select controls where possible without breaking native file picking.
4. Preserve current dark identity but avoid a one-note teal-only look. Use restrained neutral surfaces, clearer borders, and modest accent usage.
5. No landing-page hero treatment. This is a writing/workbench app.

## files_allowed
- `desktop.html`
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js` only for small class/state/empty-copy adjustments required for UI polish
- `tests/writer-button-audit.js` only if selectors or visible text changes require test updates
- `tests/desktop-library.js` only if selectors or visible text changes require test updates
- `.ai_state/execution_log.md`

## forbidden_scope
- Do not modify provider/API logic.
- Do not modify storage/services/core generation/context/workflow engines.
- Do not remove, rename, or disable existing user-visible features.
- Do not change data formats or migrations.
- Do not modify release artifacts.
- Do not introduce a new UI framework or icon package.
- Do not add large image assets or generated images.
- Do not make broad copy rewrites unrelated to UI clarity.

## implementation_guidance
- Prefer CSS variables and reusable classes for controls.
- If styling all native controls globally, verify it does not break compact controls in the writer and nav.
- Keep cards at 8px radius or less.
- Avoid nested card visuals. Use section bands, grouped rows, or subtle borders instead.
- Avoid text overflow in buttons and chips; use wrapping or ellipsis deliberately.
- Keep responsive behavior for 1366x768 and 1920x1080.
- Keep focus outlines visible.

## test_plan
Run:
- `npm run writer-audit`
- `npm run desktop-mainline-test`
- `npm run unit`

Also perform a visual/DOM verification at 1366x768 and 1920x1080:
- no document-level horizontal overflow
- writer assistant tabs remain visible/reachable
- select controls are readable and not clipped
- settings, compendium, workflow, recovery, reader, and bookshelf first screens do not show incoherent overlap

## success_criteria
- Required tests pass.
- Visual verification passes at both viewport sizes.
- Diff is limited to allowed files.
- Product behavior remains unchanged.
- OpenCode returns a structured report with modified files, executed commands, test results, visual verification summary, diff summary, failure analysis, and next suggestion.

## failure_conditions
- Any required test fails.
- UI has document-level horizontal overflow at 1366x768 or 1920x1080.
- Existing writer, compendium, settings, workflow, recovery, bookshelf, or reader actions stop working.
- Diff touches forbidden files or broadens scope into business logic.
