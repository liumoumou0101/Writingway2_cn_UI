# Codex Review: phase25_native_rewrite_workbench

task_id: phase25_native_rewrite_workbench
status: success_after_codex_review_fix

## OpenCode Execution

OpenCode was dispatched with `deepseek/deepseek-v4-pro`, but the CLI wrapper timed out after 600 seconds and did not return the required structured report. Residual OpenCode processes were still running, so Codex stopped them before reviewing the working tree.

## Modified Files Reviewed

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/writer-button-audit.js`
- `docs/FINAL_FEATURE_GAP_AUDIT.md`
- `docs/WRITER_FEATURE_AUDIT.md`
- `docs/REFACTOR_TODO.md`
- `.ai_state/execution_log.md`
- `.ai_state/opencode_tasks/phase25_native_rewrite_workbench.md`

## Findings

OpenCode implemented the main direction correctly:

- Native rewrite panel now shows selected original text.
- Built-in rewrite presets have visible descriptions.
- Saved rewrite prompts with category `rewrite` can be selected.
- Selection regeneration has a context include/exclude toggle.
- Rewrite and selection regeneration results are previewed in the generation output and do not mutate editor text before explicit accept.
- Accept replaces the original selected range and keeps the replacement selected.
- Retry and discard are routed through the existing generation output actions.

Codex found and fixed two gaps:

- After saving/deleting a rewrite prompt, the rewrite prompt dropdown was not refreshed until project reload.
- Selecting a built-in preset after a saved/custom prompt did not clear the old custom instruction before applying preset text.

## Verification

Sequential commands run by Codex:

```powershell
npm run writer-audit
npm run desktop-mainline-test
npm run unit
```

All passed.

## Decision

Accepted as `success_after_codex_review_fix`.

Residual risk: the rewrite workbench is still embedded in the right assistant panel rather than a large comparison dialog. Functionally it now preserves the old enhanced workflow's key safety and control properties, but manual testing should still judge whether the panel feels spacious enough.
