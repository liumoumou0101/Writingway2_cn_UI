# OpenCode Task: phase24_fix_history_panel_mojibake_tests

```yaml
task_id: phase24_fix_history_panel_mojibake_tests
task_type: focused_bugfix_ui_text
status: ready_for_opencode
model_selection:
  model: deepseek-reasoner
  reasoning: ON
objective: >
  Fix mojibake in the native writer generation-history panel and tighten the
  writer audit so it asserts readable Chinese labels using stable data
  selectors rather than broken text.
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
  - Do not change behavior in this slice.
  - Do not add or remove history actions.
  - Do not change promptHistory schema or storage services.
  - Do not perform broad encoding cleanup outside generation-history rendering and directly related tests.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
implementation_guidance:
  - In generation-history rendering, replace mojibake user-facing labels/status text with readable Chinese.
  - Expected labels include:
    - `当前场景`
    - `暂无生成记录`
    - `未命名生成`
    - `字`
    - `复用提示`
    - `复制`
    - `重试`
    - `写入`
    - `删除`
    - `已复制到剪贴板`
    - `复制失败`
    - `请先选择一个场景`
  - Update `tests/writer-button-audit.js` to locate history actions by `data-native-history-reuse`, `data-native-history-copy`, `data-native-history-insert`, and `data-native-history-delete` rather than mojibake button text.
  - Add an assertion that the history panel text includes readable labels such as `当前场景`, `复制`, `写入`, and `删除`.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Generation-history panel user-facing labels listed above are readable Chinese.
  - Writer audit no longer depends on mojibake button text.
  - Filter, copy, insert, reuse, and delete behavior still works.
  - All listed tests pass sequentially.
failure_conditions:
  - Any directly related history-panel label still contains mojibake.
  - Tests still target mojibake text for history actions.
  - Existing history behavior regresses.
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

