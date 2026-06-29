# OpenCode Task: phase24_editor_font_and_word_goal

```yaml
task_id: phase24_editor_font_and_word_goal
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Continue native writer polish by adding editor font-family preference and a
  lightweight current-scene word-count goal/progress indicator. Keep this local
  to the writer UI and avoid changing project data schemas.
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
  - Do not redesign the whole writer page.
  - Do not replace the textarea editor.
  - Do not add dependencies.
  - Do not change project file format or storage services.
  - Preferences should be local UI preferences, stored with existing native editor prefs.
  - Do not alter generation, context, compendium, workflow, or export behavior.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
product_intent:
  - Writers should be able to choose a comfortable editor font family from a small set.
  - Writers should be able to set a current-scene word target and see progress near the existing word count.
  - Empty or zero target should disable progress/goal pressure cleanly.
implementation_guidance:
  - Add font-family control to the existing typography panel.
  - Reuse localStorage native editor preference mechanism.
  - Add a compact word-goal input/control near editor stats or typography panel.
  - Show progress as text such as `123 / 800 字` or equivalent, without adding a heavy progress widget unless simple.
  - Keep text from overflowing in compact desktop widths.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Font family control changes the textarea computed font family.
  - Font family preference persists through existing native editor preference storage.
  - Word target can be set and cleared.
  - Editor stats/progress reflects current scene word count and target.
  - Existing typography controls still work.
  - Writer audit covers font-family selection and word target/progress.
  - All listed tests pass sequentially.
failure_conditions:
  - Existing typography controls regress.
  - Word count becomes incorrect.
  - Editor layout overflows or controls become unusable.
  - Project data schema/storage is changed.
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

