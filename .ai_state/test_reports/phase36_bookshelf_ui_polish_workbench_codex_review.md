# Codex Review: phase36_bookshelf_ui_polish_workbench

## status

accepted_after_codex_takeover

## execution notes

OpenCode was dispatched with `deepseek/deepseek-v4-pro`, but the wrapper timed out after 600 seconds and did not write the required report. Residual OpenCode processes were stopped by Codex.

OpenCode left a substantial partial implementation, which Codex reviewed, adjusted, and verified.

## implemented

- Reworked the Bookshelf left column from a large explanatory block into a compact works-dashboard panel:
  - project count
  - save location summary
  - Start actions
  - Import actions
  - Maintenance actions
- Improved project shelf toolbar grouping for search and sorting.
- Redesigned project cards:
  - stronger book-cover-style thumbnail area
  - clearer title/chip/description hierarchy
  - stat row for words/chapters/scenes
  - clearer save time and path treatment
  - explicit `继续写作` primary action
  - `编辑信息` and `更多` retained
  - dangerous `移出书库` moved to a visually separate row
- Added stable `data-project-continue`, `data-action="copy-path"`, and `data-action="reveal-file"` selectors for tests.
- Updated desktop library tests to use the new primary CTA and stable action selectors.

## verification

Passed:

- `node -c src/desktop/desktop-shell.js`
- `node -c tests/desktop-library.js`
- `npm run desktop-mainline-test`
- `npm run unit`
- `git diff --check -- desktop.html src/desktop/desktop-shell.js src/styles/desktop.css tests/desktop-library.js docs/DESKTOP_UI_TODOLIST.md`

Not completed:

- Automated Playwright screenshot/viewport visual QA. The local Playwright browser executable is missing (`chromium_headless_shell` not installed), so Codex could not capture screenshots in this turn.

## residual notes

- The Bookshelf visual pass is accepted as a first implementation, but manual visual review is still recommended because screenshot QA could not run locally.
- A later pass could add actual cover generation/import polish and richer "recently continued" data if desired.
