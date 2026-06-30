# OpenCode Task: phase26_desktop_ui_closure_pass

```yaml
task_id: phase26_desktop_ui_closure_pass
task_type: frontend_ui_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Polish the desktop UI after the functional rewrite so the app feels coherent across the main
  non-writing surfaces while preserving existing behavior. Focus on concrete UI/UX issues found
  by Codex's 2026-06-30 audit: writer assistant tab overflow, weak empty states, poor wide-screen
  use on bookshelf/settings/workflow, and placeholder-feeling recovery/workshop/workflow screens.
files_allowed:
  - desktop.html
  - src/styles/desktop.css
  - src/desktop/desktop-shell.js
  - tests/writer-button-audit.js
  - tests/desktop-library.js
  - tests/desktop-reader.js
  - tests/release-config.js
  - docs/REFACTOR_TODO.md
  - .ai_state/execution_log.md
files_forbidden:
  - desktop/storage/**
  - desktop/services/**
  - src/core/**
  - package.json
  - package-lock.json
  - release/**
  - node_modules/**
  - Any data migration, provider, generation, backup, import/export, or workflow-engine logic.
context:
  audit_screenshots_dir: .ai_state/ui_audit
  confirmed_tests_before_task:
    - npm test passed
    - npm run backup-test passed
    - npm run packaged-smoke passed when run sequentially
  concrete_findings:
    - Writer assistant panel tabs overflow horizontally at 1366x768; metadata/structure/search/history exceed the right panel.
    - Writer assistant panel still feels crowded; any fix must preserve all existing tab functions and task buttons.
    - Bookshelf wastes space on 1920px wide screens; project library content remains narrow and left-heavy.
    - Workshop empty state is too bare; result action buttons are visible even when there is no assistant output.
    - Workflow screen is visually skeletal; it should clearly communicate the current minimal/experimental workflow without pretending to be complete.
    - Recovery center empty state feels temporary and shows restore actions before a backup is selected.
    - Settings page is usable but still feels like raw engineering forms; improve grouping, spacing, and wide-screen composition.
constraints:
  - Do not redesign the whole brand or color system.
  - Do not add new dependencies.
  - Do not remove existing controls or data attributes used by tests.
  - Prefer CSS/layout changes and light DOM markup changes over JavaScript behavior changes.
  - Preserve current Chinese UI text readability and all existing data-* selectors.
  - Preserve the current writer three-column model, focus mode, assistant bottom/right placement, and prompt/generation workflows.
  - Use responsive rules for 1366x768, 1920x1080, and 2K-like widths.
  - Empty-state text may be improved, but must not claim unavailable features are complete.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
implementation_targets:
  - Writer:
      - Fix assistant tab overflow. Acceptable approaches include wrapping, horizontal scroll with clear affordance, compact labels, or a responsive tab grid.
      - Keep all tabs reachable at 1366x768 and 1920x1080.
      - Ensure no horizontal page overflow.
  - Bookshelf:
      - Improve wide-screen use by allowing the project grid/preview area to breathe and making empty/single-project states less left-heavy.
      - Keep existing actions and import buttons available.
  - Workshop:
      - Improve the no-session/no-message empty state.
      - Hide or clearly disable conversion actions until there is assistant output.
  - Workflow:
      - Improve empty/minimal state so it reads as a deliberate "minimal workflow" surface.
      - Keep current minimal workflow controls; do not implement complex automatic workflow features.
  - Recovery:
      - Improve empty state and disabled restore actions before a backup is selected.
      - Do not change backup/restore service behavior.
  - Settings:
      - Improve grouping and wide-screen composition for Provider, generation defaults, and TTS settings.
      - Keep all existing fields and buttons.
test_plan:
  required:
    - npm run writer-audit
    - npm run desktop-mainline-test
    - npm run unit
  visual_required:
    - Use Playwright or existing local server to inspect 1366x768 and 1920x1080 desktop.html after changes.
    - Verify writer assistant tabs do not overflow the viewport or become unreachable.
    - Verify bookshelf, workshop, workflow, recovery, and settings still render without obvious overlap.
  optional_if_time:
    - npm run backup-test
    - npm run packaged-smoke, only after a fresh npm run dist or existing release is known current.
success_criteria:
  - All required tests pass sequentially.
  - Writer assistant tabs are all reachable at 1366x768 and 1920x1080 with no horizontal document overflow.
  - Empty states for workshop/workflow/recovery are visibly intentional and do not show misleading active actions.
  - Bookshelf and settings use wide screens more gracefully without breaking 1366x768.
  - No business logic, storage schema, provider, backup, import/export, or workflow-engine behavior is changed.
failure_conditions:
  - Any required test fails.
  - Any existing high-value writing control becomes unreachable.
  - Data model, service, provider, generation, backup, or import/export code is modified.
  - The UI introduces horizontal page overflow at 1366x768.
  - Report omits diff/test details.
required_report:
  - task_id
  - status
  - modified_files
  - executed_commands
  - test_results
  - visual_checks
  - git_diff_summary
  - failure_analysis
  - next_suggestion
```

## Notes From Codex Audit

- Screenshots are available in `.ai_state/ui_audit/`.
- The strongest concrete bug is writer assistant tab overflow:
  - At 1366x768, `元数据`, `结构`, `查找`, `历史` overflow past the right panel.
  - At 1920x1080, `查找`, `历史` still overflow.
- Treat workflow automation as explicitly out of scope. Only polish the surface and empty/minimal-state messaging.
