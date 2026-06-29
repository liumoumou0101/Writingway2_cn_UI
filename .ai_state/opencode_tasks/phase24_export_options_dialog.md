# OpenCode Task: phase24_export_options_dialog

```yaml
task_id: phase24_export_options_dialog
task_type: medium_ui_export_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Add a lightweight native writer export options flow so writers can choose
  whether exported documents include scene titles. Reuse the existing
  project-migration export option support and keep the change scoped.
files_allowed:
  - desktop.html
  - desktop/local-server.js
  - src/desktop/desktop-shell.js
  - src/styles/desktop.css
  - tests/writer-button-audit.js
  - tests/project-migration-service.js
  - docs/REFACTOR_TODO.md
files_forbidden:
  - main.html
  - src/app.js
  - src/core/**
  - desktop/services/**
  - desktop/storage/**
  - package.json
  - package-lock.json
  - .ai_state/**
constraints:
  - Do not change export file formats beyond passing existing supported options.
  - Do not change project data schemas or storage services.
  - Do not add dependencies.
  - Do not redesign the structure panel.
  - Do not modify project package export behavior.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
product_intent:
  - Writers should not need to remember hidden export behavior.
  - Native writer export should expose whether scene titles are included.
  - Export options should be compact and not interrupt normal writing.
implementation_guidance:
  - Add a small dialog or inline options panel near the native writer export buttons.
  - Include a checkbox with stable selector such as `data-native-export-include-scene-titles`.
  - The default should be checked to preserve current behavior.
  - Store the preference as local UI preference only, e.g. localStorage, not project data.
  - When exporting markdown/txt/html/epub, pass `includeSceneTitles=true|false` to `/api/export-project-document`.
  - Update `desktop/local-server.js` so the endpoint forwards `includeSceneTitles` into `projectMigrationService.exportProjectDocument(...)`.
  - Keep the direct export buttons usable; a simple dialog with format choice is okay only if tests can still trigger all formats clearly.
  - Add stable selectors for test automation.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Native writer exposes an include-scene-titles export option.
  - Default export behavior still includes scene titles.
  - Unchecking the option sends `includeSceneTitles=false` to the export endpoint.
  - Export endpoint forwards the option to the existing export service.
  - Writer audit covers the option and at least one export request query.
  - Existing markdown/html/epub/package download coverage still passes.
  - All listed tests pass sequentially.
failure_conditions:
  - Existing exports stop downloading.
  - Project package export behavior changes.
  - Export option is stored in project data.
  - Forbidden files are modified.
  - Tests are skipped, parallelized into known port conflicts, or falsely reported.
required_report:
  - task_id
  - status
  - modified_files
  - executed_commands
  - test_results
  - git_diff_summary
  - failure_analysis
  - next_suggestion
```

