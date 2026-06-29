# OpenCode Task: phase24_history_retry_audit

```yaml
task_id: phase24_history_retry_audit
task_type: focused_ui_behavior_test
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Add focused coverage for the native writer generation-history retry action,
  and make the smallest behavior fix only if needed. Retry must start a fresh
  generation from the selected history record's beat without inserting the old
  history result into the editor before acceptance.
files_allowed:
  - src/desktop/desktop-shell.js
  - tests/writer-button-audit.js
  - docs/REFACTOR_TODO.md
files_forbidden:
  - desktop.html
  - src/styles/desktop.css
  - main.html
  - src/app.js
  - src/core/**
  - desktop/services/**
  - desktop/storage/**
  - package.json
  - package-lock.json
  - .ai_state/**
constraints:
  - Do not redesign or restyle the history panel.
  - Do not add history summary enhancements in this slice.
  - Do not change provider contracts or prompt/history core modules.
  - Do not change project data schemas or storage services.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
implementation_guidance:
  - Prefer a test-only change if current retry behavior is already correct.
  - In `tests/writer-button-audit.js`, click `[data-native-history-retry]` on an existing record.
  - Use the existing native generation stub to verify a fresh generation call occurs.
  - Assert the beat/input is set from the history record or that the prompt includes the prior beat.
  - Assert the editor does not contain the old stored result solely due to retry before accepting/inserting the new generation.
  - If behavior is wrong, adjust only `retryNativeHistoryRecord()`.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Writer audit covers `[data-native-history-retry]`.
  - Retrying a history record triggers a fresh native generation call.
  - Retrying uses the history record's beat/prompt intent.
  - Retrying does not insert the old history result into the editor before acceptance.
  - Existing history filter, copy, insert, delete, and reuse coverage remains.
  - All listed tests pass sequentially.
failure_conditions:
  - Retry inserts stale history result into the editor.
  - Existing history actions regress.
  - Product schema/storage/provider contracts change.
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

