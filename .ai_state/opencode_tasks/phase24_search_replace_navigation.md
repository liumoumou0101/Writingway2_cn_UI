# OpenCode Task: phase24_search_replace_navigation

```yaml
task_id: phase24_search_replace_navigation
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Continue native writer polish by improving the search/replace panel with
  match count, current match position, previous/next navigation, and reliable
  selection of the current match in the editor.
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
  - Do not replace textarea or introduce a rich-text editor.
  - Do not add dependencies.
  - Keep existing search list filtering and replace current/all behavior working.
  - Do not alter generation, context, compendium, workflow, or storage architecture.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
product_intent:
  - Writers should know how many matches exist in the current scene.
  - Writers should move to previous/next match and see the current match selected in the textarea.
  - Replace current should operate on the currently selected match when possible.
implementation_guidance:
  - Prefer adding a compact search status row in the existing search panel.
  - Use data attributes for buttons/status to support writer audit.
  - Matching can be case-insensitive plain text; do not implement regex unless existing code already does.
  - If no matches exist, status should clearly say so and navigation buttons should disable.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Search panel displays match count/current position for current scene matches.
  - Next/previous buttons select matches in the native scene textarea.
  - Replace current replaces the selected/current match and updates count/status.
  - Existing replace all and scene filtering still work.
  - Writer audit covers match count, next/previous, and replace current.
  - All listed tests pass sequentially.
failure_conditions:
  - Existing search filtering stops working.
  - Replace current/all regress.
  - Editor selection jumps unpredictably or loses scene text.
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

