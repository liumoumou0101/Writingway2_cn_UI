# OpenCode Task: phase24_generation_history_retry_summary

```yaml
task_id: phase24_generation_history_retry_summary
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Finish the next native writer generation-history polish slice by making
  history record summaries clearer and making retry behavior testable and safe.
  Keep the work scoped to the native writer history panel and existing
  promptHistory records.
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
  - Do not change generation provider contracts or prompt/history core modules.
  - Do not change project data schemas or storage services.
  - Use existing `snapshot.promptHistory` records.
  - Do not add dependencies.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
  - Do not broaden into export, TTS, workflow, or compendium work.
product_intent:
  - Writers should understand what each history record contains without opening it.
  - Retrying a history record should reuse the prior beat/context intent and start a fresh generation.
  - Retrying must not insert stale history result text before the new generation result arrives.
  - Existing copy, insert, delete, reuse, and current-scene filter behavior must continue to work.
implementation_guidance:
  - Improve history card summaries with readable labels for task/scene, word count, timestamp, and a short preview.
  - Keep the current compact panel; do not redesign the whole assistant panel.
  - If retry already exists, audit and tighten it rather than rewriting from scratch.
  - Retry should set the generation beat from the record, switch to the generate panel if useful, and call the existing generation path for a fresh response.
  - Retry should clear or replace any stale displayed result so the user can tell a fresh generation is running.
  - Add stable selectors only if needed for tests, e.g. `data-native-history-task`, `data-native-history-meta`, or `data-native-history-retry`.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - History cards show clearer summaries including a preview and metadata that remains readable Chinese.
  - Retry action uses a prior record's beat and starts a fresh generation through the existing generation stub in writer audit.
  - Retry does not insert the old history result into the editor before the fresh response is accepted or inserted.
  - Existing filter, copy, insert, delete, and reuse tests still pass.
  - Writer audit covers retry behavior and summary/metadata rendering.
  - All listed tests pass sequentially.
failure_conditions:
  - Retry inserts stale result text into the editor.
  - Existing copy/insert/delete/reuse/filter behavior regresses.
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

