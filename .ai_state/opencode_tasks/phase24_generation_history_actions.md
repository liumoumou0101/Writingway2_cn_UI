# OpenCode Task: phase24_generation_history_actions

```yaml
task_id: phase24_generation_history_actions
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Improve the native writer generation history panel so it is useful during
  everyday writing: clearer record summaries, current-scene filtering, copy,
  insert, retry/reuse, and delete actions. Keep the change local to the native
  writer history UI and existing promptHistory records.
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
  - Do not perform broad encoding cleanup outside the generation history panel and directly related test text.
product_intent:
  - Writers should be able to see which history records belong to the current scene.
  - Writers should be able to copy a generated result without inserting it.
  - Writers should be able to insert a generated result into the current scene.
  - Writers should be able to reuse/retry a prior generation setup without losing control of insertion.
  - Deleting a history record should update the panel and mark the project dirty.
implementation_guidance:
  - Add a compact history toolbar in the history panel, for example a current-scene filter toggle or select.
  - Render history cards with correct Chinese labels, no mojibake, and a short result preview.
  - Preserve existing "复用" semantics or rename it to a clearer label such as "复用提示".
  - Add "复制" for `record.resultText`; use `navigator.clipboard.writeText` when available and a safe fallback for audit environments.
  - Add "重试" that prepares the prior beat/prompt context and starts generation only when a scene is active and the provider path is available; it must not auto-insert stale text before a new response arrives.
  - Keep "写入" inserting the stored result into the current editor through the existing insertion path.
  - Keep "删除" scoped to `snapshot.promptHistory` and re-render the panel.
  - Add stable data attributes for new controls/actions so the writer audit can target them.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - History panel can filter to the active scene and return to all records.
  - History cards show readable Chinese labels and a preview without mojibake.
  - Copy action copies or records the generated text in the audit environment.
  - Insert action still writes the stored result into the editor.
  - Reuse/retry action prepares the previous generation context without corrupting current text.
  - Delete action removes the selected record and marks the project dirty.
  - Writer audit covers the new history actions and filter.
  - All listed tests pass sequentially.
failure_conditions:
  - Existing generation, rewrite, or history insertion behavior regresses.
  - Any new history-panel user-facing text contains mojibake.
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

