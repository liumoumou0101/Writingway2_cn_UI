# Writingway Desktop Architecture

Last updated: 2026-06-27

Writingway is moving toward a clean desktop-first architecture. The current legacy writer remains useful as a reference and migration source, but new product work should be built on a small, testable core instead of extending the legacy Alpine app.

## Goals

- Make project, document, generation, backup, and workflow behavior understandable without reading UI code.
- Keep core business logic independent from Electron, DOM APIs, Alpine, and browser storage.
- Use local project files as the long-term source of truth.
- Make AI generation and future workflow runs recoverable and auditable.
- Keep the workflow feature as a placeholder until the simpler project, editor, reader, storage, and generation foundations are stable.

## Layers

```text
desktop/
  Electron main process, local HTTP server, filesystem services, dialogs.

src/core/
  Pure business logic: project normalization, manuscript building, reader conversion,
  generation contracts, workflow state contracts, backup/diff planning.

src/ui/
  Future desktop UI modules. UI calls services and renders state; it does not own
  project file formats, prompt construction, workflow state machines, or backup logic.

legacy writer
  main.html and src/app.js remain a transitional implementation and reference.
```

## Core Rules

- `src/core` must not read or write files directly.
- `src/core` must not touch `window`, `document`, Electron, IndexedDB, or localStorage.
- All incoming project data must be normalized before use.
- All project writes should eventually go through desktop storage services with atomic writes.
- Every AI generation request should eventually produce a structured generation record.
- Workflow implementation should stay minimal until the core editor, reader, generation, and storage path is stable.

## Near-Term Build Order

1. Establish project and document core modules.
2. Establish desktop project-file storage services.
3. Migrate the bookshelf, editor, and reader to the new project contract.
4. Refactor generation around pure prompt/result contracts.
5. Add only a placeholder workflow schema.
6. Build the real semi-automatic novel workflow after the simpler product areas are clean.

## Current Progress

- Phase 0 boundary work has started: legacy writer code is treated as reference and migration source, not the destination for new product logic.
- Phase 1 core project/document work has started:
  - project schema and default factories
  - project normalization
  - project statistics
  - chapter/scene ordering
  - manuscript building
  - reader document conversion
  - workflow placeholder schema
- Phase 2 desktop project-file storage has started:
  - atomic file writes
  - library path helpers
  - project directory writer/reader
  - project service facade
  - `/api/list-projects` can list new project directories alongside legacy snapshot JSON files
  - `/api/get-project` can expose new project directories as a legacy-compatible snapshot for the current reader/writer bridge
  - `/api/create-project` now creates new project directories while returning a legacy-compatible snapshot for the current UI bridge
  - `/api/update-project-metadata` can edit new project directories while returning a legacy-compatible snapshot for the current UI bridge
  - `/api/remove-project-from-library` can move new project directories into `.removed-projects`
  - `/api/reveal-project-file` can reveal new project directories
  - `/api/save-project` now accepts the legacy writer snapshot payload but saves it into the new project directory format
- Legacy single-file JSON snapshots are now compatibility inputs/outputs, not the primary format for newly created or newly saved projects.
- The next major step is desktop surface migration: make the bookshelf and native views speak the new directory model more directly instead of relying on legacy-compatible snapshots.

## Phase 3 Surface Progress

- Bookshelf cards now expose project source metadata and show whether an item is a project directory or a legacy snapshot.
- The writer view now includes a native project editor MVP for project-directory data: scene outline, prose editor, and save-to-directory behavior. The legacy iframe remains as a compatibility runtime while generation and advanced editing are migrated.
- The native project editor now supports creating chapters, creating scenes, renaming scenes, deleting scenes, and saving back to the project directory.
- The reader loads the shared core reader-document conversion module.
- The recovery page now has a native local backup list MVP while restore actions remain bridged to the legacy recovery flow.

## Phase 4 Generation Progress

- Prompt construction now has a pure core module in `src/core/generation/prompt-builder.js`.
- Provider request normalization lives in `src/core/generation/ai-provider-client.js`.
- Generation result and error normalization lives in `src/core/generation/generation-result.js`.
- Generation history records live in `src/core/generation/generation-history.js`.
- The legacy `window.Generation.buildPrompt` delegates to the new core prompt builder when available.

## Phase 5 Workflow Placeholder Progress

- Workflow run placeholders can be persisted under each project directory.
- `workflows/runs.json` stores the run index.
- `workflows/runs/*.events.jsonl` stores append-only placeholder event logs.
- The real semi-automatic novel workflow remains deliberately deferred.

## Phase 12 Native Settings Progress

- Provider settings now have a pure schema in `src/core/settings/settings-schema.js`.
- Desktop settings are persisted through `desktop/storage/settings-store.js` and `desktop/services/settings-service.js`.
- `/api/settings` reads and writes the native desktop settings contract.
- `/api/settings/test-provider` validates provider configuration and can be extended for live checks.
- The native settings page edits provider mode, provider id, endpoint, model, API key, temperature, max tokens, and provider-default sampling.
- Native generation now reads provider runtime config from the settings service instead of hard-coded local defaults.
- The old AI settings page remains as a compatibility entry, not the new source of truth.

## Phase 13 Native Compendium Progress

- Compendium entries now have a pure schema in `src/core/knowledge/compendium-schema.js`.
- Project normalization now normalizes legacy snapshot compendium entries into the new entry contract.
- Project-directory compendium storage lives under `compendium/entries.json`.
- `desktop/storage/compendium-store.js` owns file reads/writes.
- `desktop/services/compendium-service.js` owns list/save/delete/import behavior.
- `/api/compendium` lists and saves entries.
- `/api/delete-compendium-entry` deletes entries.
- The desktop shell now has a native `资料` view for project knowledge entries.
- Deep context injection is deliberately deferred to Phase 14 so prompt/context resolution is implemented once in a shared core.

## Phase 14 Prompt And Context Progress

- Prompt templates now have a pure schema in `src/core/prompt/prompt-template-schema.js`.
- Context resolution now lives in `src/core/context/context-resolver.js`.
- Context can include always-on compendium entries, beat mentions, scene mentions, previous scene summaries, manual selections, and a character budget.
- Project normalization now normalizes prompt templates from legacy snapshots and project directories.
- Project-directory prompt storage lives under `prompts/prompts.json`.
- `desktop/storage/prompt-store.js` and `desktop/services/prompt-service.js` own prompt persistence.
- `/api/prompts` lists and saves prompt templates.
- `/api/delete-prompt` deletes prompt templates.
- Native generation now builds prompts through the prompt/context core instead of ad hoc local UI state.
- Prompt preview remains the audit surface for the exact final request.

## Phase 15 Native Workshop Progress

- Workshop sessions and messages now have a pure schema in `src/core/workshop/workshop-schema.js`.
- Workshop prompt construction lives in `src/core/workshop/workshop-prompt.js` and reuses the shared context resolver.
- Project-directory workshop storage lives under `workshop/sessions.json`.
- `desktop/storage/workshop-store.js` and `desktop/services/workshop-service.js` own workshop persistence.
- `/api/workshop-sessions` lists and saves sessions.
- `/api/workshop-message` appends a message.
- `/api/delete-workshop-session` deletes a session.
- The desktop shell now has a native `讨论` view.
- Workshop output can be turned into a compendium note, current scene summary, or draft text.
- The old iframe workshop remains compatibility-only.

## Phase 16 Import Export And Migration Progress

- Project migration behavior now lives in `desktop/services/project-migration-service.js`.
- Old JSON snapshots can be imported into the project-directory model through `/api/import-project-snapshot`.
- Writingway 1 folder exports can be imported into the project-directory model through `/api/import-writingway1`.
- Project directories can be exported and imported as `.writingway-project.zip` packages through `/api/export-project-package` and `/api/import-project-package`.
- Markdown and TXT manuscript export now reads from the project directory through `/api/export-project-document`.
- The desktop bookshelf exposes native import actions for old JSON, project packages, and Writingway 1 folders.
- Project cards expose native project package export.
- GitHub Gist backup remains legacy compatibility; any future remote backup should be an extension outside the local project save path.

## Phase 17 Legacy Iframe Exit Preparation

- The legacy writer iframe is no longer loaded by default when opening or creating a project.
- The native writer opens projects without waiting for legacy IndexedDB synchronization.
- The old settings-page bridges to legacy AI settings and legacy backup settings have been removed from the desktop mainline.
- The project-card backup action now opens the native recovery center instead of the legacy backup settings panel.
- A single explicit `兼容写作器` action remains for migration, comparison, and fallback editing.
- When that compatibility action is used, the desktop shell loads `main.html?runtime=desktop&embedded=writer` on demand and imports the current snapshot into the legacy DB.
- The unused historical placeholder module `src/modules/generation.js` has been deleted; the only real legacy generation adapter is `src/generation.js`.
- Desktop mainline tests now assert that opening a project does not load the legacy iframe.

## Phase 18 Minimal Semi-Automatic Workflow

- Workflow execution rules now live in `src/core/workflow/workflow-engine.js`.
- The first real workflow remains deliberately semi-automatic: project brief -> chapter outline -> approval -> scene draft -> approval -> final confirmation -> write to project.
- `/api/workflows/start` creates a `before-workflow` local backup before creating a run.
- `/api/workflows/prepare-step` builds a step prompt with the shared context resolver.
- `/api/workflows/complete-generation` stores prompt, generation result, business artifact, event log, and generation history.
- `/api/workflows/approve-step` advances steps and writes the approved draft only at final confirmation.
- `/api/workflows/reject-step` records user rejection and returns the step to a ready state.
- The desktop shell now includes a native `工作流` view with run list, step state, artifacts, events, and manual controls.
- Complex branching, visual step editing, automatic multi-step model calls, and advanced rollback UI remain deferred.

## Next Planning Docs

- `docs/REFACTOR_TODO.md` tracks completed phases and the next backlog in Chinese.
- `docs/REWRITE_PLAN.md` describes the recommended rewrite order after the foundation work.
- `docs/FEATURE_REWRITE_PLAN.md` records which legacy features should be rewritten, redesigned, weakened, or deferred.
