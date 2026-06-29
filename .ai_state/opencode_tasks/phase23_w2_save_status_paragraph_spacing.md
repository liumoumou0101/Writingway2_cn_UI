# OpenCode Task: phase23_w2_save_status_paragraph_spacing

```yaml
task_id: phase23_w2_save_status_paragraph_spacing
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Continue phase 23 W2 native writer polish by adding paragraph-spacing preference
  and making save status clearer without changing the writer data model.
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
constraints:
  - Preserve existing native writer functionality.
  - Do not add framework dependencies.
  - Do not move workflow, compendium, prompt, or generation architecture.
  - Keep old iframe writer untouched.
  - Do not run tests that bind port 8000 in parallel.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Writer typography controls include paragraph spacing.
  - Paragraph spacing applies visibly to the editor text area or an equivalent editor rendering path.
  - Preference persists locally with the existing native editor preferences.
  - Save status clearly distinguishes unsaved, saving, autosaved, saved, and failed states.
  - Writer audit covers the new paragraph-spacing control and save status behavior.
  - All listed tests pass when run sequentially.
failure_conditions:
  - Save/autosave behavior regresses.
  - Existing title editing or typography controls break.
  - Writer audit becomes flaky.
  - Tests are skipped, parallelized into the known port conflict, or falsely reported.
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

