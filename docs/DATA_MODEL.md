# Writingway Data Model

Last updated: 2026-06-27

The new data model is designed for local desktop projects. The model starts small so simple features can be rebuilt first; workflow data is represented only as a placeholder contract for now.

## Project

```json
{
  "schemaVersion": 1,
  "id": "project-id",
  "title": "Novel title",
  "description": "",
  "status": "draft",
  "tags": [],
  "createdAt": "2026-06-26T00:00:00.000Z",
  "updatedAt": "2026-06-26T00:00:00.000Z",
  "chapterOrder": ["chapter-1"],
  "sceneOrder": ["scene-1"],
  "currentSceneId": "scene-1",
  "chapters": [],
  "scenes": [],
  "compendium": [],
  "prompts": [],
  "workshopSessions": [],
  "workflowRuns": []
}
```

## Chapter

```json
{
  "id": "chapter-1",
  "title": "Chapter 1",
  "summary": "",
  "order": 0,
  "sceneIds": ["scene-1"],
  "createdAt": "2026-06-26T00:00:00.000Z",
  "updatedAt": "2026-06-26T00:00:00.000Z"
}
```

## Scene

```json
{
  "id": "scene-1",
  "chapterId": "chapter-1",
  "title": "Scene 1",
  "summary": "",
  "content": "",
  "order": 0,
  "tags": [],
  "createdAt": "2026-06-26T00:00:00.000Z",
  "updatedAt": "2026-06-26T00:00:00.000Z"
}
```

## Workflow

Workflow data now supports the minimal semi-automatic novel workflow:

```json
{
  "id": "run-id",
  "templateId": "placeholder",
  "status": "pending",
  "activeStepId": "chapter-outline",
  "steps": [],
  "artifacts": [],
  "createdAt": "2026-06-26T00:00:00.000Z",
  "updatedAt": "2026-06-26T00:00:00.000Z"
}
```

The current workflow remains deliberately semi-automatic: each generation step waits for user approval, and the final draft is written only after explicit confirmation.

## Core Modules

- `src/core/project/project-schema.js` creates default project, chapter, and scene objects.
- `src/core/project/project-normalize.js` normalizes raw or legacy-shaped project data into this model.
- `src/core/project/project-stats.js` calculates mixed Chinese/English text counts and project totals.
- `src/core/document/scene-ordering.js` centralizes chapter and scene ordering rules.
- `src/core/document/manuscript-builder.js` builds a manuscript text from chapters and scenes.
- `src/core/document/reader-document.js` converts a project into the reader view model.
- `src/core/workflow/workflow-schema.js` defines workflow run, step, artifact, event, and template contracts.
- `src/core/workflow/workflow-engine.js` owns the minimal semi-automatic workflow state transitions and draft application plan.

## Local Folder Layout

The new desktop storage layer writes one folder per project:

```text
Writingway Library/
  projects/
    project-id/
      manifest.json
      chapters/
        chapter-id.json
      scenes/
        scene-id.md
        scene-id.meta.json
      compendium/
        entries.json
      prompts/
        prompts.json
      workshop/
        sessions.json
      workflows/
        runs.json
        runs/
          run-id.events.jsonl
      backups/
```

`manifest.json` stores project-level metadata and ordering. Chapter and scene bodies are stored separately so future editor, diff, backup, and recovery work can operate on smaller files.

Project packages (`.writingway-project.zip`) are transport archives of this folder layout, not a separate storage model. Importing a package restores it back into a normal project directory.

## Legacy Compatibility

During migration, the desktop local server exposes project directories through the existing bookshelf API:

- `/api/list-projects` returns both legacy single-file snapshots and new project directories.
- `/api/get-project` can convert a new project directory into the legacy snapshot shape for compatibility, but native desktop views should treat that as a bridge rather than the product storage model.
- `/api/create-project` writes the new project directory format, then returns a legacy snapshot for the current desktop shell.
- `/api/update-project-metadata` updates the new directory manifest and returns a legacy snapshot for the current desktop shell.
- `/api/remove-project-from-library` moves new project directories into `.removed-projects`.
- `/api/reveal-project-file` reveals the new project directory.
- `/api/save-project` still accepts the legacy writer snapshot payload, but stores it in the new project directory format.
- `/api/import-project-snapshot` imports old JSON snapshots into the project directory format.
- `/api/import-writingway1` imports Writingway 1 folder files into the project directory format.
- `/api/export-project-package` and `/api/import-project-package` move project directories between machines.
- `/api/export-project-document` exports Markdown/TXT manuscripts from the latest project directory content.

This compatibility layer is temporary. Native desktop project opening no longer loads the legacy iframe by default; the legacy snapshot shape remains for migration, backup compatibility, and the explicit compatibility writer action.
