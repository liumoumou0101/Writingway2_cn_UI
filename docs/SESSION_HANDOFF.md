# Writingway Desktop Session Handoff

Last updated: 2026-06-29

This document summarizes the long development session around turning this fork into a desktop-first local fiction writing app. It is intended as the starting context for the next Codex session.

## 2026-06-29 Current Handoff Snapshot

This repository is now in a large uncommitted rewrite state. Treat `desktop.html`, `src/desktop/desktop-shell.js`, `src/styles/desktop.css`, `desktop/services/**`, `desktop/storage/**`, and `src/core/**` as the new desktop mainline. Treat `main.html` and `src/app.js` as legacy/reference/compatibility surfaces unless a change is explicitly needed for compatibility.

The user has decided that the old project should only be a functional reference where useful. The new app does not need to preserve the old UI style. In particular, the writing page should become a native desktop writing workspace with a better layout and interaction design, not a copy of the old web UI.

Most functional rewrite work is now complete enough to move from "rebuild missing features" toward "make the core writing UI good." The complex semi-automatic/automatic novel workflow is intentionally postponed. It currently has only minimal placeholder/foundation behavior because the user expects that feature to be more complex than the rest of the app combined and wants it built last.

Latest important completed work after the earlier stage notes:

- Native writer now supports creating a project from the writing page, opening from bookshelf, chapter/scene creation, rename, delete, ordering, saving, autosave, unsaved status, and search/replace.
- Generation uses native provider settings and writes streamed AI output directly into the middle editor, with prompt preview, accept, retry, discard, cursor/append/replace insertion modes, and generation history.
- DeepSeek provider support was repaired for current native generation, including endpoint/default model handling and empty-output error handling. Do not print or commit API keys; the user supplied one during testing, but it must not be recorded in docs or final messages.
- Native writer side panels now include generate, rewrite, characters, context, metadata, structure, search, and history.
- The old writer's core writing functions were largely mapped into the native writer:
  - rewrite presets
  - selected-text rewrite
  - selected-text regeneration with before/after context
  - character card quick creation
  - manual context selection from compendium entries, compendium tags, chapters, and scenes
  - scene and chapter summary generation
  - special character insertion and `--` to em dash replacement
  - read aloud / stop reading
  - history reuse, write-in, and delete
  - Markdown, TXT, HTML, EPUB, and project-package export from the writer page
  - main rail, outline, assistant panel hide/show
  - assistant panel right/bottom placement
  - focus mode
- `docs/WRITER_FEATURE_AUDIT.md` was updated with the current old-writer feature mapping and remaining gaps.

Latest verification commands that passed:

```powershell
npm run writer-audit
npm run desktop-mainline-test
npm run unit
npm run pack
npm run packaged-smoke
```

One expected testing caveat: do not run tests that start the local server in parallel unless they use different ports. A parallel run of `desktop-mainline-test` and `unit` once failed with `EADDRINUSE 127.0.0.1:8000`; rerunning `npm run unit` alone passed.

Current recommended next task:

1. Start a fresh session by reading this file, `docs/WRITER_FEATURE_AUDIT.md`, and `docs/WRITER_REDESIGN_PLAN.md`.
2. Do a focused design pass on the native writing page UI. The user is dissatisfied with the current writing page experience even after feature parity improvements.
3. Keep the newly restored writer functions available, but redesign how they are presented. The goal is a clean desktop writing workspace, not another cramped web panel.
4. Postpone the complex novel workflow. Only preserve its placeholder and do not sink time into a serious workflow engine/UI until writing, compendium, prompt, and context foundations feel stable.

Known remaining writer gaps after the latest pass:

- Writing UI still feels rough and crowded. This is now the main problem.
- Find/replace still lacks highlighting, match count, previous/next navigation.
- Writing preferences still need first-class controls for font, font size, line height, text width, paragraph spacing, and similar editor ergonomics.
- Export options are still basic. Old-style options such as scene title inclusion and separators are not yet exposed in a full export modal.
- TTS uses existing local storage settings but native settings do not yet expose a dedicated voice/rate UI.
- Prompt manager works but is still too form-like and not yet polished for writer workflow.
- The context panel is functionally present but needs better information architecture.

Important implementation locations for the next session:

- Native writer layout and markup: `desktop.html`
- Native writer behavior: `src/desktop/desktop-shell.js`
- Native styling: `src/styles/desktop.css`
- Export/import/package behavior: `desktop/services/project-migration-service.js`, `desktop/local-server.js`
- Writer audit coverage: `tests/writer-button-audit.js`
- Feature mapping docs: `docs/WRITER_FEATURE_AUDIT.md`
- Redesign planning docs: `docs/WRITER_REDESIGN_PLAN.md`

Before changing writer UI, run or keep nearby:

```powershell
npm run writer-audit
```

After meaningful writer UI changes, also run:

```powershell
npm run desktop-mainline-test
npm run unit
```

For packaged validation:

```powershell
npm run pack
npm run packaged-smoke
```

## 2026-06-27 Current Status

The rewrite has now completed phases 0 through 18 in `docs/REFACTOR_TODO.md`.

Current shape:

- Desktop-first is the mainline. `desktop.html`, `src/desktop/**`, `desktop/services/**`, `desktop/storage/**`, and `src/core/**` are the preferred places for new work.
- `main.html` and `src/app.js` remain compatibility/reference surfaces for the old writer. They should not receive new top-level product architecture unless it is required for compatibility.
- New project storage is directory-based through `desktop/storage/project-file-store.js`; old single-file JSON snapshots remain readable/importable compatibility data.
- Native desktop editor, native generation panel, native reader, and native recovery center now exist as the main product direction.
- Native desktop settings now provide the new provider configuration source of truth for native generation.
- Native desktop compendium/worldbuilding now stores project knowledge in the project directory.
- Native prompt templates and context resolution now provide the shared prompt/context path for generation, workshop, and future workflow work.
- Native workshop/chat now stores project conversations in the project directory and reuses provider settings plus the shared prompt/context core.
- Native import/export now treats old JSON snapshots and Writingway 1 folders as migration inputs, while project-directory zip packages and service-side Markdown/TXT export are the new mainline.
- The legacy writer iframe is now an explicit compatibility tool. Opening or creating a project in the desktop mainline no longer loads `main.html` or syncs legacy IndexedDB by default.
- The semi-automatic novel workflow now has a minimal real native loop: project brief, chapter outline generation, scene draft generation, manual approval, before-workflow backup, event log, generation history, and final write-back.
- Release and maintenance quality is documented in `docs/RELEASE_CHECKLIST.md`.

Latest verification in this session:

```powershell
node .\tests\workflow-store.js
node .\tests\workflow-engine-service.js
node .\tests\workshop-service.js
node .\tests\project-migration-service.js
npm run unit
npm test
npm run desktop-mainline-test
npm run backup-test
npm run pack
npm run dist
```

Stage 12 additions:

- `src/core/settings/settings-schema.js`
- `desktop/storage/settings-store.js`
- `desktop/services/settings-service.js`
- `/api/settings`
- `/api/settings/test-provider`
- native settings UI in `desktop.html` and `src/desktop/desktop-shell.js`
- settings coverage in `tests/settings-service.js` and `tests/desktop-library.js`

Stage 13 additions:

- `src/core/knowledge/compendium-schema.js`
- `desktop/storage/compendium-store.js`
- `desktop/services/compendium-service.js`
- `/api/compendium`
- `/api/delete-compendium-entry`
- native `资料` view in `desktop.html` and `src/desktop/desktop-shell.js`
- compendium coverage in `tests/compendium-service.js` and `tests/desktop-library.js`

Stage 14 additions:

- `src/core/prompt/prompt-template-schema.js`
- `src/core/context/context-resolver.js`
- `desktop/storage/prompt-store.js`
- `desktop/services/prompt-service.js`
- `/api/prompts`
- `/api/delete-prompt`
- native prompt manager in the generation panel
- prompt/context coverage in `tests/context-prompt-core.js`, `tests/prompt-service.js`, and `tests/desktop-library.js`

Stage 15 additions:

- `src/core/workshop/workshop-schema.js`
- `src/core/workshop/workshop-prompt.js`
- `desktop/storage/workshop-store.js`
- `desktop/services/workshop-service.js`
- `/api/workshop-sessions`
- `/api/workshop-message`
- `/api/delete-workshop-session`
- native `讨论` view in `desktop.html` and `src/desktop/desktop-shell.js`
- workshop output actions for compendium notes, current scene summaries, and draft insertion
- workshop coverage in `tests/workshop-service.js` and `tests/desktop-library.js`

Stage 16 additions:

- `desktop/services/project-migration-service.js`
- `/api/import-project-snapshot`
- `/api/import-writingway1`
- `/api/export-project-package`
- `/api/import-project-package`
- `/api/export-project-document`
- bookshelf import buttons for old JSON, project packages, and Writingway 1 folders
- project-card package export action
- service-side Markdown/TXT export from the latest project-directory content
- migration coverage in `tests/project-migration-service.js`

Stage 17 additions:

- legacy iframe lazy loading through the explicit `兼容写作器` action
- native project open/create no longer waits for legacy writer app state
- removed desktop settings bridges to old AI settings and old backup settings
- project-card backup action now opens the native recovery center
- deleted unused historical placeholder `src/modules/generation.js`
- updated `docs/LEGACY_BOUNDARY.md` to classify remaining legacy responsibilities
- desktop mainline coverage now asserts that opening a project does not load the legacy iframe

Stage 18 additions:

- `src/core/workflow/workflow-engine.js`
- expanded `src/core/workflow/workflow-schema.js` with `activeStepId`
- expanded `desktop/services/workflow-service.js` with start/prepare/complete/approve/reject behavior
- `/api/workflows`
- `/api/workflow-events`
- `/api/workflows/start`
- `/api/workflows/prepare-step`
- `/api/workflows/complete-generation`
- `/api/workflows/approve-step`
- `/api/workflows/reject-step`
- native `工作流` view in `desktop.html` and `src/desktop/desktop-shell.js`
- workflow coverage in `tests/workflow-engine-service.js` and `tests/desktop-library.js`

Packaging status:

- `release/win-unpacked/Writingway.exe` was generated by `npm run pack`.
- `release/Writingway Setup 1.0.0.exe` was generated by `npm run dist`.
- `release/Writingway 1.0.0.exe` was generated by `npm run dist`.
- `asar` remains disabled. This is deliberate for now because the app serves `desktop.html`, `main.html`, and `src/**` through a local HTTP server rooted at the application directory. Enable it only after a dedicated asar runtime verification pass.

Useful current docs:

- `docs/REFACTOR_TODO.md`
- `docs/NEW_ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/LEGACY_BOUNDARY.md`
- `docs/WORKFLOW_PLACEHOLDER.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/FEATURE_REWRITE_PLAN.md`

## Current Repository State

- Workspace: `D:\soft\Writingway\Writingway2 -fork`
- Active branch: `codex/desktop-shell-v2`
- Remote branch: `myfork/codex/desktop-shell-v2`
- Latest pushed commit at handoff: `a622f78 Improve desktop reader experience`
- Desktop is the product target. The web/browser version is now legacy/development support only.
- Main desktop entry point: `desktop.html`
- Legacy writer still runs inside the desktop shell as `main.html?runtime=desktop&embedded=writer`

## Product Direction Decided

The project has diverged enough from upstream Writingway 2 that it should be maintained independently as a desktop-first app.

Main decisions:

- Electron desktop is the official product direction.
- Future product UI should be built from `desktop.html` and desktop-specific modules.
- `main.html` remains a transitional legacy writer surface, not the place for new top-level product shell work.
- The desktop app should feel like a local application, not a web page inside a window.
- The core product should become a local writing workbench with three tightly linked areas:
  - Bookshelf/project library
  - Writing/generation workspace
  - Local reading/preview experience

## Completed Work In This Session

### Desktop Mainline Setup

Added/updated documentation and project orientation:

- `README.md`
- `docs/DESKTOP_MAINLINE.md`

The docs now state that desktop is the mainline product target and browser/web is legacy.

### Desktop Shell

Implemented a desktop shell around the legacy writer:

- Left navigation rail
- Topbar
- Views:
  - Bookshelf
  - Writer
  - Reader
  - Recovery
  - Settings
- Fullscreen toggle through Electron preload/IPC
- Legacy settings/recovery actions bridged from desktop shell to iframe writer

Important files:

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/desktop/desktop-state.js`
- `src/styles/desktop.css`
- `desktop/main.js`
- `desktop/preload.js`

### Bookshelf / Project Library

Implemented a usable local project library:

- Reads project JSON snapshots saved to disk.
- Shows project cards with:
  - Title
  - Cover or generated cover glyph
  - Description
  - Status
  - Tags
  - Word/chapter/scene counts
  - Last saved time
- Search and sorting.
- Open project into the legacy writer iframe.
- Edit project metadata:
  - Name
  - Status
  - Tags
  - Description
  - Cover image
- Copy project file path.
- Reveal project file in file manager.
- Open backup settings for a project.
- Create new project from desktop shell.
- Remove project from library without deleting it by moving it to `.removed-projects`.

Important files:

- `desktop/local-server.js`
- `src/desktop/desktop-shell.js`
- `desktop.html`
- `src/styles/desktop.css`
- `tests/desktop-library.js`

### Backup / Recovery Fixes

Fixed the issue where clicking restore could appear stuck on "Loading backups...".

Changes:

- Added explicit loading/loaded/error states for backup lists.
- Empty backup lists now show an empty state instead of a loading message.
- Local recovery modal also distinguishes loading, error, and empty states.
- Backup and project locations were simplified conceptually:
  - New default backup location is now under the project library directory: `projects/backups`.
  - Old `project-backups` remains readable for compatibility.
- Current project backup listing now scans both the new and legacy backup roots.
- Restoring or importing backups notifies the desktop shell so the bookshelf can refresh.

Important files:

- `desktop/local-server.js`
- `src/app.js`
- `src/state/app-state.js`
- `main.html`
- `src/desktop/desktop-shell.js`
- `tests/backup-api.js`

### Reader MVP

Added the first local reader implementation:

- Reader view in desktop shell.
- Import `.txt` and `.md`.
- Chapter detection:
  - Markdown headings
  - Chinese chapter headings
  - English `Chapter N`
- Chapter list.
- Previous/next chapter controls.
- Reading progress.
- Typography controls.
- Theme controls.
- Reader state persisted locally.

Important files:

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/desktop-reader.js`

### Writer to Reader Sync

Added the required product behavior:

When a user generates or edits writing, then saves the project to disk, the reader immediately updates from the saved project snapshot.

Current behavior:

- `src/modules/filesystem-save.js` sends a `writingway:desktop:project-saved` message to the desktop shell after a successful disk save.
- `src/desktop/desktop-shell.js` converts the saved project snapshot into a reader document.
- The reader can also load content when opening a project from the bookshelf.
- Multi-scene chapters preserve scene titles in the reader.

This makes the intended flow work:

```text
Generate/write in editor -> Save to disk -> Reader immediately shows the saved novel
```

### Reader Experience Improvements

Improved reader toward a more professional local reading experience:

- Better reading stage layout.
- More book-like reading width.
- Font selection:
  - System default
  - Serif/Song style
  - Microsoft YaHei
- Font size slider.
- Line height slider.
- Text width slider.
- Paragraph spacing slider.
- Paragraph first-line indent toggle.
- Themes:
  - Dark
  - Paper
  - Sepia/eye-care
- Real reading progress based on chapter and scroll position.
- Per-chapter scroll position persistence.
- Restores chapter and scroll position after reload.
- Keyboard controls:
  - Left/right arrows switch chapters.
  - Space/PageDown scroll down.
  - PageUp scrolls up.

Important files:

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/desktop-reader.js`

### Packaging

Built a portable Windows app for testing:

- Portable exe path:
  - `D:\soft\Writingway\Writingway2 -fork\release\Writingway 1.0.0.exe`

Command used:

```bash
npx electron-builder --win portable
```

The regular unpacked build is also under:

```text
release/win-unpacked
```

## Latest Relevant Commit Chain

Most recent desktop branch commits:

```text
a622f78 Improve desktop reader experience
f8eac3c Sync saved projects into desktop reader
01166d9 Fix desktop backup recovery states
639266b Add desktop local reader MVP
f0b2c9c Complete desktop library creation flow
0b0f01b Add safe desktop project file actions
9084bab Add desktop project metadata editor
f92ae4f Add desktop fullscreen toggle
f3af409 Add desktop library search controls
ddd5106 Open desktop library projects
dfa59c9 Add desktop project library view
03d288e Wire desktop shell to legacy settings
```

## Verification Commands Used

The following were run repeatedly after changes:

```bash
npm run desktop-test
npm run unit
npm run backup-test
npm run pack
```

Current important tests:

- `tests/desktop-library.js`
- `tests/desktop-reader.js`
- `tests/backup-api.js`
- `tests/backup-browser.js`
- `tests/gen-buildPrompt.js`
- `tests/unit-context-tags.js`
- `tests/unit-rewrite-presets.js`

## Known Architectural Shape

The app is currently transitional:

- Desktop shell owns the top-level app experience.
- Legacy writer still lives in an iframe.
- The bookshelf reads project snapshots from disk.
- The writer stores active editing state in legacy IndexedDB, then exports snapshots through `FileSystemSave`.
- The reader now accepts:
  - Imported txt/md files
  - Project snapshots from bookshelf open
  - Project snapshots after save from writer

This works, but is not yet an ideal architecture.

Long-term goal:

- A single desktop-level current project state.
- Bookshelf, writer, reader, backup, and recovery all operate on that same project state.
- Gradually replace iframe-dependent flows with native desktop shell pages.

## Important Product Notes From User

The user wants:

- A commercial-grade desktop writing app.
- A less web-like UI.
- A bookshelf similar to dedicated Chinese novel-writing software.
- Visible books/covers after opening the app.
- Strong local-first behavior.
- Reader and writer linkage to feel automatic.
- Desktop version to replace web version as the real product.
- Future development to proceed in phases, not one giant rewrite.

The user explicitly accepted:

- Desktop-first split.
- Independent maintenance from upstream.
- Current phase-based plan.

## Remaining Work / Next Suggested Plan

### Highest Priority

1. Make the bookshelf/writer/reader linkage feel fully native.
   - Track current project at desktop shell level.
   - Show current project context in topbar.
   - Add "Read current project" action from writer/bookshelf.
   - Auto-refresh reader after save, restore, and metadata edits.

2. Continue polishing reader.
   - Add search within book.
   - Add table-of-contents filtering.
   - Add reading mode/fullscreen focus mode.
   - Add mouse wheel/page mode options.
   - Add "back to last read" from bookshelf card.
   - Add better typography defaults for Chinese text.

3. Improve recovery center.
   - Replace legacy iframe recovery modal with desktop-native recovery page.
   - Show all local backups in desktop UI.
   - Restore as new project from desktop UI.
   - Preview backup content before restore.

4. Make the project library root clearer.
   - UI should expose one "Library location".
   - Projects, backups, removed projects, covers, and reader files should live under it.
   - Keep old backup location compatibility.

### Medium Priority

5. Make app shell feel more native.
   - Native-feeling dialogs instead of browser alerts/confirm.
   - Better empty states.
   - Better settings page.
   - More compact operational UI.

6. Reader import expansion.
   - EPUB support later.
   - Better TXT chapter detection.
   - Encoding handling for non-UTF-8 TXT.

7. Packaging/release polish.
   - Decide whether to enable `asar`.
   - Add versioning/release notes.
   - Clarify portable vs installer outputs.
   - Test portable build on a second machine.

### Later / Larger Work

8. Replace iframe writer incrementally.
   - Extract reusable editor/data modules.
   - Move generation UI into desktop shell.
   - Keep tested prompt/build logic stable.

9. Improve commercial polish.
   - App onboarding.
   - Better project creation flow.
   - Cover management.
   - Book metadata editing.
   - Project templates.

## Cautions For Next Session

- Do not treat `main.html` as the new product shell.
- Do not remove legacy writer yet; it still contains the real editor/generation functionality.
- Avoid breaking existing backup tests.
- Keep old backup directory compatibility unless a deliberate migration is implemented.
- `release/` and `node_modules/` are ignored build/dependency outputs; do not commit them.
- PowerShell may display Chinese as mojibake, but files are UTF-8. Avoid judging Chinese file content only from terminal output.
- Use `apply_patch` for file edits.

## Suggested First Task In Next Session

Start by testing the portable build on another machine. If issues appear, fix packaging/runtime path problems first.

If packaging is fine, continue with:

```text
Desktop current-project state + "Read current project" shortcut + better reader/writer/bookshelf synchronization.
```

## 2026-06-27 Update - Stage 19

Stage 19 completed the minimal workflow control closure:

- Added draft artifact adoption before final approval via `WorkflowEngine.applyDraftArtifact`, `workflowService.applyArtifact`, and `/api/workflows/apply-artifact`.
- Added workflow cancellation via `WorkflowEngine.cancelRun`, `workflowService.cancelRun`, and `/api/workflows/cancel`.
- Added the `artifact_applied` event type so artifact writes are auditable.
- Added native workflow UI buttons for adopting a draft and cancelling a run.
- Disabled workflow actions once a run is `completed`, `cancelled`, or `failed`.
- Fixed native editor project reload to prefer `currentSceneId`, so workflow writes are easier to inspect.
- Tests updated: `tests/workflow-engine-service.js` covers apply/cancel service and API behavior; `tests/desktop-library.js` covers native UI draft adoption.

Verified after this stage:

```text
node .\tests\workflow-engine-service.js
npm run unit
npm run desktop-mainline-test
```

Next recommended stage: packaging/release audit and final legacy boundary check before any large workflow automation design.

## 2026-06-27 Update - Stage 20

Stage 20 completed packaging, release-boundary, and legacy-boundary audit.

Changes:

- Added `tests/release-config.js`.
- Added the release-config check to `npm run unit`.
- Moved `jszip` from dev-only to runtime `dependencies`; `desktop/services/project-migration-service.js` requires it for project package import/export.
- Kept `package.json > build.asar` as `false`.
- Confirmed `main.html` must remain in `build.files` for the explicit compatibility writer, but it is not the desktop mainline.
- Updated `docs/REFACTOR_TODO.md` and `docs/RELEASE_CHECKLIST.md`.

Verified:

```text
node .\tests\release-config.js
npm run unit
npm run pack
npm run dist
npm test
npm run backup-test
```

Generated/checked release artifacts:

```text
release/win-unpacked/Writingway.exe
release/Writingway Setup 1.0.0.exe
release/Writingway 1.0.0.exe
release/win-unpacked/resources/app/node_modules/jszip
```

Next recommended stage: manual packaged-app acceptance (`win-unpacked`, portable, installer), then move into the formal complex novel workflow design only after that manual pass is acceptable.

## 2026-06-27 Update - Stage 21

Stage 21 converted part of packaged-app acceptance into an automated smoke test.

Changes:

- `desktop/main.js` now honors `WRITINGWAY_DATA_ROOT`; packaged acceptance can use an isolated temporary data root instead of real user data.
- Added `tests/packaged-smoke.js`.
- Added `npm run packaged-smoke`.
- Updated `docs/REFACTOR_TODO.md` and `docs/RELEASE_CHECKLIST.md`.

What `packaged-smoke` verifies:

- Launches `release/win-unpacked/Writingway.exe`.
- Waits for `http://127.0.0.1:8000/desktop.html`.
- Confirms the packaged app uses the temporary data root.
- Creates a project through `/api/create-project`.
- Saves scene text through `/api/save-project`.
- Reopens the project through `/api/get-project`.
- Creates and lists a backup through `/api/create-backup` and `/api/list-backups`.
- Kills the packaged process and removes the temporary data root.

Verified:

```text
npm run pack
npm run packaged-smoke
```

Remaining manual acceptance: portable exe, installer flow, and visual/interaction review of the packaged UI.

## 2026-06-27 Update - Final Handoff Before User Testing

Final documentation cleanup before user acceptance:

- Added `docs/USER_ACCEPTANCE_CHECKLIST.md` for manual packaged-app testing.
- Updated `README.md` to reflect the current rewritten feature set and `npm run packaged-smoke`.
- Updated `docs/REFACTOR_TODO.md` completion estimates after stages 20 and 21.

Current recommendation: the user can start manual testing from `release/win-unpacked/Writingway.exe`, using `docs/USER_ACCEPTANCE_CHECKLIST.md` as the walkthrough. Do not begin the complex novel workflow redesign until this manual acceptance pass is done.

## 2026-06-27 Update - Writer UI/Button Audit

The native writer page received a focused audit and follow-up fixes.

Changes:

- Added main navigation hide/show via `data-toggle-rail`.
- Added native writer structure sidebar hide/show.
- Added native writer assistant sidebar hide/show.
- Fixed misleading topbar copy from “进入旧写作器” to “写作页”.
- Added `tests/writer-button-audit.js`.
- Added `npm run writer-audit`.
- Added `docs/WRITER_FEATURE_AUDIT.md` to list implemented, partial, and missing writer features compared with the legacy writer.
- Updated `docs/WRITER_REDESIGN_PLAN.md`, `docs/REFACTOR_TODO.md`, and `docs/USER_ACCEPTANCE_CHECKLIST.md`.

Verified:

```text
npm run writer-audit
npm run desktop-mainline-test
npm run unit
npm run pack
npm run packaged-smoke
npm run backup-test
```

Release `release/win-unpacked/Writingway.exe` has been regenerated with the writer changes.
