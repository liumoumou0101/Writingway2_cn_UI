# OpenCode Task: phase23_w3_fix_generation_task_behavior

```yaml
task_id: phase23_w3_fix_generation_task_behavior
task_type: failure_fix_ui_behavior
status: ready_for_opencode
model_selection:
  model: deepseek-reasoner
  reasoning: ON
objective: >
  Fix the generation task buttons added by phase23_w3_generation_rewrite_task_entries.
  The summary task must be usable without beat text, and generation task choices should
  visibly change input expectations instead of only toggling active button state.
files_allowed:
  - desktop.html
  - src/desktop/desktop-shell.js
  - tests/writer-button-audit.js
files_forbidden:
  - src/styles/desktop.css
  - main.html
  - src/app.js
  - src/core/**
  - desktop/services/**
  - desktop/storage/**
  - package.json
  - package-lock.json
  - docs/**
  - .ai_state/**
constraints:
  - Do not redesign the whole generation panel.
  - Do not alter provider streaming, prompt template schema, ContextResolver, or generation history storage.
  - Do not remove existing prompt preview, insert mode, accept/retry/discard, or history behavior.
  - Keep the summary task wired to existing `generateNativeSummary('scene')`.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
expected_behavior:
  - `continue` task remains the default.
  - Selecting `continue` should make the beat textarea optional or clearly indicate it is optional.
  - Selecting `beat` should make the beat textarea expected and keep generation disabled until beat text exists.
  - Selecting `summary` should enable the generate button whenever a scene exists, even if beat text is empty.
  - Selecting `summary` and clicking generate should call the existing scene summary generation path.
  - Writer audit should verify the summary task can run without beat text and updates the scene summary.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Summary task no longer requires beat text.
  - Task selection changes placeholder or equivalent visible input guidance.
  - Writer audit covers summary task behavior, not just active button state.
  - Existing generation and rewrite audit paths still pass.
  - All listed tests pass sequentially.
failure_conditions:
  - Prompt preview breaks.
  - Existing prose generation breaks.
  - Summary generation no longer writes to scene summary.
  - Forbidden files are modified.
  - Tests are skipped or falsely reported.
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

