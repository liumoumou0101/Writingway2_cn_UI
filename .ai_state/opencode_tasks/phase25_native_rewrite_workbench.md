# OpenCode Task: phase25_native_rewrite_workbench

task_id: phase25_native_rewrite_workbench
task_type: feature-polish

model_selection:
  model: deepseek-v4-pro
  reasoning: LOW

objective:
  Restore the old enhanced writer's rewrite/selection-regeneration experience in the native desktop writer without reverting to the old cramped UI.
  The native implementation may be stronger or more polished than the legacy enhanced version, but it must not be weaker in capability, control, or safety.

background:
  Codex re-reviewed post-upstream enhancements added in this fork. Native writer currently has rewrite entry points, built-in presets, prompt preview, inline output, retry/discard, and selection regeneration. However it does not fully match the old enhanced rewrite workflow in `main.html` and `src/modules/editor.js`.

files_allowed:
  - desktop.html
  - src/desktop/desktop-shell.js
  - src/styles/desktop.css
  - tests/writer-button-audit.js
  - docs/WRITER_FEATURE_AUDIT.md
  - docs/FINAL_FEATURE_GAP_AUDIT.md

files_forbidden:
  - desktop/storage/**
  - desktop/services/**
  - src/core/generation/provider-stream.js
  - src/core/context/context-resolver.js
  - src/modules/**
  - main.html
  - package-lock.json
  - release/**

legacy_reference:
  - main.html rewrite modal around `showRewriteModal`.
  - main.html selection regeneration modal around `showRegenerateSelectionModal`.
  - src/modules/editor.js functions:
    - getRewritePresets
    - applyRewritePreset
    - applySavedRewritePrompt
    - buildRewritePrompt
    - performRewrite
    - acceptRewrite
    - handleRegenerateSelectionButtonClick
    - buildRegenerateSelectionPrompt
    - performRegenerateSelection
    - acceptRegenerateSelection

requirements:
  - Native rewrite must show the selected original text before generation.
  - Native rewrite must allow choosing built-in presets and display each preset's description or explanatory helper text.
  - Native rewrite must allow choosing a saved prompt whose category is `rewrite`.
  - Choosing a saved rewrite prompt must populate the editable rewrite instruction and clear the built-in preset selection, matching old behavior.
  - Choosing a built-in preset must populate the editable rewrite instruction and clear the saved rewrite prompt selection, matching old behavior.
  - Native rewrite must allow previewing the final prompt before generation.
  - Rewrite output must first be held as a pending result that the user can inspect.
  - Rewrite must not mutate the editor text until the user clicks an explicit accept/replace action.
  - Accepting rewrite must replace the original selected range and keep the replaced text selected or near the cursor.
  - Retry must regenerate the pending result without duplicating or corrupting editor text.
  - Discard must close/clear the pending result without changing editor text.
  - Selection regeneration must expose an option to include or exclude before/after context.
  - Selection regeneration must keep the existing large context window behavior, approximately 8000 chars before and after when enabled.
  - If the original selected text changed before accept, do not replace; show a clear error.

scope_constraints:
  - Do not change provider contracts or model settings.
  - Do not change prompt/context core schemas.
  - Do not move rewrite into the old iframe.
  - Keep the native writing page visually calm; use a dialog or well-structured assistant panel, not multiple stacked slide panels.
  - Keep current inline generation flow for normal prose generation.

test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit

writer_audit_expectations:
  - Create or use a saved prompt with category `rewrite`.
  - Select text in the native editor.
  - Open/use rewrite panel or dialog.
  - Assert original selected text is visible in the rewrite workbench.
  - Select built-in preset and assert instruction changes.
  - Select saved rewrite prompt and assert instruction changes.
  - Preview final prompt and assert it includes instruction and selected original text.
  - Start rewrite with mocked provider and assert editor text is unchanged before accept.
  - Accept rewrite and assert selected text is replaced.
  - Retry rewrite and assert editor text is not duplicated before accept.
  - Run selection regeneration with context disabled and assert prompt marks context as omitted or excludes before/after context.
  - Run selection regeneration with context enabled and assert before/after context is included.

success_criteria:
  - Old enhanced rewrite workflow capabilities are functionally available in the native writer.
  - The native rewrite workflow is not weaker than the old enhanced workflow in `main.html` and `src/modules/editor.js`; any UI changes must preserve or improve control, preview, retry, accept, discard, saved prompt, and context behavior.
  - Existing generation, prompt management, history, context selection, and export behavior do not regress.
  - All test plan commands pass sequentially.

failure_conditions:
  - Rewrite directly mutates editor text before explicit accept.
  - Saved rewrite prompts cannot be selected from the rewrite workflow.
  - Selection regeneration loses large before/after context support.
  - Provider/settings/core storage contracts are changed unnecessarily.
  - Tests are skipped or reported as passing without actually running.
