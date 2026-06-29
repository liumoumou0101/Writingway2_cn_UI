# OpenCode Task: phase24_fix_word_goal_mojibake

```yaml
task_id: phase24_fix_word_goal_mojibake
task_type: focused_bugfix_ui_text
status: ready_for_opencode
model_selection:
  model: deepseek-reasoner
  reasoning: ON
objective: >
  Fix the user-facing mojibake introduced in the native editor word-count goal
  display and tighten the writer audit so tests require the correct Chinese
  word-count unit.
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
  - Do not perform broad encoding cleanup.
  - Only touch the native editor stats text and directly related test assertions.
  - Preserve the accepted font-family and word-goal behavior.
  - Do not change project data schemas or storage services.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
implementation_guidance:
  - In `updateNativeStats()`, make the no-goal and goal progress labels render with the exact visible unit `字`.
  - Ensure the no-scene fallback renders `0 字`.
  - Update `tests/writer-button-audit.js` to assert `字`, not mojibake or loose broken text.
  - If existing nearby unrelated mojibake strings are present, leave them alone unless they are directly part of this word-goal display.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Editor stats display `N 字` when no word goal is set.
  - Editor stats display `N / M 字` when a word goal is set.
  - Clearing the goal returns to `N 字`.
  - Writer audit fails if the unit is mojibake and passes only for the correct `字` unit.
  - All listed tests pass sequentially.
failure_conditions:
  - Any user-facing word-count label still contains mojibake.
  - Tests accept mojibake text.
  - Existing font-family preference or word-goal behavior regresses.
  - Forbidden files are modified.
  - Tests are skipped, run in parallel into known port conflicts, or falsely reported.
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

