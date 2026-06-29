# OpenCode Task: phase24_generation_history_filter_copy

```yaml
task_id: phase24_generation_history_filter_copy
task_type: focused_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Implement the first small generation-history polish slice: add an all/current
  scene filter and a copy-result action to the native writer history panel.
  Keep existing reuse, insert, and delete behavior unchanged.
files_allowed:
  - desktop.html
  - src/desktop/desktop-shell.js
  - src/styles/desktop.css
  - tests/writer-button-audit.js
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
  - Do not add retry behavior in this slice.
  - Do not redesign the history panel.
  - Do not change generation provider contracts or prompt/history core modules.
  - Do not change project data schemas or storage services.
  - Use existing `snapshot.promptHistory` records.
  - Do not add dependencies.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
  - Do not perform broad encoding cleanup outside the generation history panel and directly related tests.
implementation_guidance:
  - Add a compact filter control in the history panel with stable selector, e.g. `data-native-history-filter`.
  - Supported values should include all records and current scene records.
  - Store the filter in local UI state only, not project data.
  - Add a copy button per record with stable selector, e.g. `data-native-history-copy`.
  - Copy should call `navigator.clipboard.writeText(record.resultText)` when available.
  - In test environments where clipboard may not be available, store the copied text on a safe window variable such as `window.__writingwayAuditClipboard`.
  - Show a save/status message after copy, but do not mark the project dirty for copy-only action.
  - Existing reuse, insert, and delete buttons must keep working.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - History filter can switch between all records and current-scene records.
  - Copy action captures the exact generated result text in the audit environment.
  - Copy does not mark the project dirty.
  - Existing insert action still writes the stored result into the editor.
  - Existing delete action still removes the record and marks the project dirty.
  - Writer audit covers filter and copy.
  - All listed tests pass sequentially.
failure_conditions:
  - Existing history insert/delete/reuse behavior regresses.
  - Copy inserts text into the editor or mutates promptHistory.
  - Prompt/history storage schema changes.
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

