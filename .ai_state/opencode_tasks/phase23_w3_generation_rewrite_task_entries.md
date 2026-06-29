# OpenCode Task: phase23_w3_generation_rewrite_task_entries

```yaml
task_id: phase23_w3_generation_rewrite_task_entries
task_type: medium_ui_writer_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Continue native writer phase 23 by making the generate/rewrite assistant panels
  clearer for writers. Add explicit task-oriented entries for common writing actions
  without changing generation core, provider settings, prompt/context architecture, or
  workflow behavior.
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
  - Do not redesign the entire writer page.
  - Do not alter provider streaming, prompt template schema, ContextResolver, or generation history storage.
  - Do not remove existing generation, rewrite, prompt preview, insert mode, history, or context functionality.
  - Do not add framework dependencies.
  - Do not touch the legacy iframe writer.
  - Keep implementation inside the existing native writer patterns.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
product_intent:
  - Writers should see clear task choices such as continue scene, generate from beat, expand selected text,
    polish selected text, shorten selected text, style rewrite, and summarize scene/chapter.
  - Existing controls may remain, but the primary visible flow should be easier to understand than raw
    template/preset/forms.
  - Prompt preview must remain available.
  - Generated text should still support append, cursor insertion, and selection replacement.
implementation_guidance:
  - Prefer a compact segmented/task button group over a large new panel.
  - Use existing rewrite presets and generation functions where possible.
  - If adding new data attributes, update writer audit coverage.
  - Keep visual density appropriate for the current right-side assistant panel.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Generate panel exposes explicit writer-facing task choices, at least continue/beat/summary-oriented choices.
  - Rewrite panel exposes explicit writer-facing task choices, at least polish/expand/shorten/style or equivalent choices.
  - Choosing a task updates the existing generation/rewrite inputs or preset state in a predictable way.
  - Existing generation, rewrite, preview, accept/retry/discard, insert mode, and history audit paths still pass.
  - Writer audit covers at least one generation task choice and one rewrite task choice.
  - All listed tests pass sequentially.
failure_conditions:
  - Existing generation or rewrite flows break.
  - Prompt preview no longer works.
  - Insert modes regress.
  - UI becomes more crowded than before without clear task grouping.
  - Forbidden files are modified.
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

