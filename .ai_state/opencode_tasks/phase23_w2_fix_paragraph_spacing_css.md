# OpenCode Task: phase23_w2_fix_paragraph_spacing_css

```yaml
task_id: phase23_w2_fix_paragraph_spacing_css
task_type: failure_fix_ui_test_gap
status: ready_for_opencode
model_selection:
  model: deepseek-reasoner
  reasoning: ON
objective: >
  Fix the paragraph-spacing implementation from phase23_w2_save_status_paragraph_spacing.
  The current CSS uses invalid calc multiplication and the test does not verify that the
  spacing style actually applies. Keep the fix narrowly scoped.
files_allowed:
  - src/desktop/desktop-shell.js
  - src/styles/desktop.css
  - tests/writer-button-audit.js
files_forbidden:
  - desktop.html
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
  - Do not redesign the editor.
  - Do not replace textarea with contenteditable or a rich-text editor.
  - Do not expand into generation, prompt, compendium, workflow, or export work.
  - Preserve existing typography controls and save-status tones.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
context:
  - JavaScript currently sets `--native-editor-paragraph-spacing` as an `em` length.
  - CSS currently uses `calc(34px + var(--native-editor-paragraph-spacing, 0em) * 1em)`, which should be corrected.
  - Because textarea cannot apply real paragraph margins inside plain text, this task only needs a visible editor spacing approximation and truthful test coverage.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - CSS for paragraph spacing is valid browser CSS.
  - Writer audit verifies that changing paragraph spacing changes a computed editor style or equivalent measurable editor layout value.
  - Existing typography controls still work.
  - Save status tone tests still pass.
  - All listed tests pass sequentially.
failure_conditions:
  - Invalid CSS remains.
  - Test only checks the slider display value without checking applied style.
  - Existing writer audit behavior regresses.
  - Any forbidden file is modified.
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

