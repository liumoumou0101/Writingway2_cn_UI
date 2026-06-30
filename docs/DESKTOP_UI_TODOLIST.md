# Desktop UI Todolist

Last updated: 2026-06-30

This document tracks the desktop UI polish work after the feature rewrite. Codex owns design direction, task decomposition, and acceptance. OpenCode owns scoped implementation and test execution.

## Phase 28 - First Desktop UI Polish Pass

Goal: move the current desktop app from an engineering-console feel toward a calmer long-form writing tool without changing core business logic.

### Design Direction

- Keep the dark desktop identity, but reduce the "debug panel" feeling.
- Standardize controls before redesigning whole workflows.
- Keep repeated cards at 8px radius or less.
- Avoid nested decorative cards.
- Prefer compact, predictable operational UI over landing-page composition.
- Preserve all current features and data behavior.

### P0 Scope For First Pass

- [x] Codex captured current UI screenshots for bookshelf, writer panels, compendium, workshop, workflow, reader, recovery, and settings.
- [x] Codex identified core issues: inconsistent controls, raw native selects, crowded writer assistant panel, weak empty states, action-heavy bookshelf cards, and oversized settings/compendium forms.
- [x] OpenCode task `phase28_desktop_ui_polish_first_pass`: introduce a shared visual baseline for inputs, selects, textareas, buttons, checkboxes, and range sliders.
- [x] OpenCode task `phase28_desktop_ui_polish_first_pass`: polish writer assistant tabs and panel content so generation/rewrite/context/metadata/search/history read as organized tool sections rather than button piles.
- [x] OpenCode task `phase28_desktop_ui_polish_first_pass`: improve first-screen layout and empty states for bookshelf, compendium, workflow, recovery, reader, and settings.
- [x] Codex acceptance: verify 1366x768 and 1920x1080 screenshots for no horizontal overflow, no incoherent overlap, readable select controls, and clearer primary/secondary action hierarchy.

### Deferred To Later Passes

- [ ] Bookshelf action-menu redesign to reduce per-card button clutter.
- [ ] Settings page category navigation.
- [ ] Workflow step timeline and artifact preview redesign.
- [ ] Reader import/control redesign beyond basic control styling.
- [ ] Recovery diff-detail redesign for dense backup lists.
- [ ] Full typography scale and theme-token cleanup.

### Phase 28 Acceptance Notes

- Screenshots reviewed: bookshelf, writer generate/context, compendium, workflow, recovery, settings at 1366x768; automated viewport screenshots also captured at 1366x768 and 1920x1080.
- Tests passed: `npm run writer-audit`, `npm run desktop-mainline-test`, `npm run unit`.
- Remaining UI risks: workflow still needs a deeper step/timeline redesign; bookshelf actions remain too numerous per card; settings would benefit from category navigation.
- Follow-up completed: `phase28_desktop_ui_polish_followup_checkbox` fixed the oversized compendium checkbox regression.

### Required Verification

- `npm run writer-audit`
- `npm run desktop-mainline-test`
- `npm run unit`
- If release artifacts are refreshed: `npm run dist` and `npm run packaged-smoke`

### Acceptance Notes Template

- Screenshots reviewed:
- Tests passed:
- Remaining UI risks:
- Follow-up tasks:
