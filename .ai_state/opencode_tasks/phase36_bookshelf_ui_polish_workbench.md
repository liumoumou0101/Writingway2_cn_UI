# OpenCode Task: phase36_bookshelf_ui_polish_workbench

## task_id

phase36_bookshelf_ui_polish_workbench

## task_type

UI polish / product integration

## objective

Redesign the desktop Bookshelf UI into a more polished novel-writing project workbench.

The user shared a screenshot and said the current "书库" UI is too ugly. The main issue is visual hierarchy and product feel: it currently looks like an admin project list, not a creative writing bookshelf.

Codex design direction:

- Make the bookshelf feel like a "works dashboard" for novels.
- Keep the dark desktop style, but reduce large explanatory text blocks.
- Emphasize "continue writing" and project identity.
- Make project cards feel like book/project cards, not database rows.
- Keep all existing functionality and tests.

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: LOW
- rationale: mostly HTML/CSS/light DOM rendering changes. No architecture changes needed.

## files_allowed

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/desktop-library.js`
- `docs/DESKTOP_UI_TODOLIST.md`
- `.ai_state/test_reports/phase36_bookshelf_ui_polish_workbench_opencode_report.md`

## files_forbidden

- Project storage/API implementation
- Provider/model settings
- Writer generation/rewrite logic
- Context resolver
- Compendium schema
- Workflow engine
- Backup/recovery internals
- Release artifacts
- Git operations

## implementation_requirements

### 1. Bookshelf layout

Improve `desktop-view-bookshelf` and the existing bookshelf HTML/CSS.

Target layout:

- A calmer left "library overview" column with:
  - a compact title/value proposition
  - current project count / save location summary
  - primary actions grouped as "Start" actions
  - secondary import/maintenance actions grouped separately
- A stronger right "project shelf" region with:
  - search + sort toolbar as a shelf toolbar
  - project grid with better card spacing and rhythm
  - empty/filter states that look intentional

Avoid:

- marketing hero style
- giant blocks of explanation
- nested cards inside cards where unnecessary
- one-note teal-only palette

### 2. Project cards

Improve `createProjectCard()` output and card CSS.

Requirements:

- Add a clear primary action button: `继续写作`.
- Keep clicking the card itself opening the project for backward compatibility.
- Strengthen cover treatment:
  - book-cover-like aspect ratio
  - better fallback glyph placement
  - cover image should crop cleanly
- Improve metadata hierarchy:
  - title prominent
  - status/source/tags as compact chips
  - word/chapter/scene stats in a tidy stat row
  - recent save time readable
  - path/filename de-emphasized or tucked lower
- Keep `编辑信息` and `更多`.
- Move or visually demote `移出书库` so it does not compete with common actions.
- Preserve data selectors and existing class names that tests use where possible.

### 3. Toolbar and empty states

- Search and sort should have better visual grouping.
- Filtered-empty state should be readable and not look like an error.
- No-project state should guide users to new/import actions without looking like a blank debug panel.

### 4. Responsive behavior

Verify at least with CSS rules:

- 1366x768: no horizontal overflow; project cards remain readable.
- 1920x1080: content should not feel squeezed into a narrow left column.
- Wide/2K screens: grid can use more columns and wider max width.

### 5. Tests

Update `tests/desktop-library.js` only if selectors need to be more stable.

Existing behavior must still pass:

- edit project metadata
- sort by words
- search/filter
- open project
- remove project from library
- create new project
- phase35 context strip checks

Prefer stable `data-*` selectors if adding new buttons.

## test_plan

Run:

1. `npm run desktop-mainline-test`
2. `npm run unit`

Optionally run `npm run writer-audit` only if the task touches shared writer shell behavior. Do not spend time fixing unrelated provider-profile audit failures in this task.

## success_criteria

- Bookshelf UI is visually cleaner and more novel-project oriented.
- Project cards have a clear `继续写作` primary action and better cover/stat hierarchy.
- Existing bookshelf actions still work.
- No horizontal overflow is introduced by CSS.
- Required tests pass.
- Report is saved.

## failure_conditions

- Project open/edit/import/remove behavior regresses.
- Tests rely on brittle visible Chinese text where a stable selector is practical.
- UI becomes a marketing landing page instead of a usable bookshelf.
- Changes expand into storage/API/provider/generation logic.

## required_report_format

Save a report at `.ai_state/test_reports/phase36_bookshelf_ui_polish_workbench_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
