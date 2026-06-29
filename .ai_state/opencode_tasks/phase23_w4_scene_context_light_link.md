# OpenCode Task: phase23_w4_scene_context_light_link

```yaml
task_id: phase23_w4_scene_context_light_link
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Continue native writer phase 23 by strengthening lightweight linkage between
  the current scene and project compendium/context inside the writer page. Make
  it easier for writers to see what contextual material is available and what
  will be included, without embedding the full compendium editor in the writer.
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
  - Do not move or rewrite compendium storage/service/schema.
  - Do not add framework dependencies.
  - Do not alter ContextResolver or prompt template schemas.
  - Do not remove the full compendium page; writer page should only provide a lightweight view/selector.
  - Do not touch legacy iframe writer.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
product_intent:
  - In the writer context panel, writers should quickly understand available project context.
  - The panel should show a concise "selected context" or "will include" summary based on manual context selections.
  - Compendium entries should remain selectable, searchable/scannable enough for a small panel, and not become a full editor.
  - Current scene/chapter context selections should be legible.
implementation_guidance:
  - Prefer a compact summary block above the existing context selectors.
  - Reuse existing `nativeEditorState.context`, `renderNativeContext`, and compendium/chapter/scene selection logic.
  - If possible, show counts and short names for selected compendium entries, tags, chapters, and scenes.
  - Add data attributes for testable summary text if useful.
  - Keep current context generation behavior intact.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Writer context panel visibly summarizes currently selected context.
  - Selecting a compendium entry updates the summary.
  - Selecting a compendium tag or chapter/scene context mode updates the summary.
  - Existing manual context selection still feeds generation through current code paths.
  - Writer audit covers the summary updating for at least compendium entry and chapter/scene selection.
  - All listed tests pass sequentially.
failure_conditions:
  - Context checkboxes or selectors stop working.
  - Generation prompt context behavior regresses.
  - Full compendium editing is embedded into the writer page.
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

