# OpenCode Task: phase24_history_audit_data_selectors

```yaml
task_id: phase24_history_audit_data_selectors
task_type: focused_test_hardening
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Harden writer-button-audit history action coverage by using stable
  `data-native-history-*` selectors instead of visible button text.
files_allowed:
  - tests/writer-button-audit.js
  - docs/REFACTOR_TODO.md
files_forbidden:
  - desktop.html
  - src/desktop/desktop-shell.js
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
  - Do not change product code.
  - Do not change history behavior.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
implementation_guidance:
  - In `tests/writer-button-audit.js`, replace history action locators that use button visible text with stable selectors scoped to `proseHistoryItem`.
  - Use:
    - `[data-native-history-reuse]`
    - `[data-native-history-copy]`
    - `[data-native-history-insert]`
    - `[data-native-history-delete]`
  - Keep the existing assertions for copied text, filter toggle, insertion, deletion, and save status.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Writer audit uses stable history action selectors instead of button text for reuse/copy/insert/delete.
  - Writer audit still passes.
  - All listed tests pass sequentially.
failure_conditions:
  - Product code is modified.
  - Any history action coverage is removed.
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

