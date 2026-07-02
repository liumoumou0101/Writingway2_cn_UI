# OpenCode Task: phase34_fix_title_alias_injection_policy

## task_id

phase34_fix_title_alias_injection_policy

## task_type

focused bugfix

## objective

Fix the Phase 34 context policy follow-up found during Codex review:

- `contextPolicy.triggers.title` and `contextPolicy.triggers.aliases` must be respected independently.
- `mention` and `auto` modes should support plain-text title/alias matching in beat text and current scene text when the corresponding trigger is enabled.
- Explicit `@[Title]` / `@[Alias]` mention should still work, but title and alias trigger switches should gate title and alias matches separately.
- Existing plain tag matching and ASCII boundary behavior must remain unchanged.

This is a narrow fix only. Do not redesign the compendium UI or touch provider/model settings.

## model_selection

- model: deepseek/deepseek-reasoner
- reasoning: ON
- rationale: this is a context-resolution correctness bug with backward-compatibility constraints.

## files_allowed

- `src/core/context/context-resolver.js`
- `tests/context-prompt-core.js`
- `.ai_state/test_reports/phase34_fix_title_alias_injection_policy_opencode_report.md`

## files_forbidden

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- provider/model settings files
- prompt template library
- workflow/backup/release files
- git operations

## implementation_requirements

1. Split title and alias matching in the resolver.
   - Title trigger controls title matches.
   - Aliases trigger controls alias matches.
   - This applies to explicit `@[...]` mentions and plain text mentions.

2. Add plain title/alias matching for `mention` and `auto` modes.
   - Use the existing `textMentionsTerm()` helper so ASCII boundary safety is preserved.
   - Search the same text used for tag mentions: beat text plus current scene content.
   - Do not make `manual` mode more aggressive than before except preserving explicit `@[...]` behavior.

3. Preserve existing behavior:
   - Existing default entries without policy still support explicit `@[Title]` / alias mention.
   - Existing tag matching still works.
   - `disabled` prevents automatic title/alias/tag/POV/scene-character injection.
   - Manual entry id still includes disabled entries.

4. Add tests in `tests/context-prompt-core.js`:
   - `mention` mode includes an entry when beat text plainly contains its title and title trigger is enabled.
   - `mention` mode includes an entry when beat text plainly contains an alias and aliases trigger is enabled.
   - Disabling `title` prevents plain title matching.
   - Disabling `aliases` prevents alias matching while title matching can still work.
   - Existing ASCII boundary tag test still passes.

## test_plan

Run:

1. `node tests/context-prompt-core.js`
2. `node tests/unit-context-tags.js`
3. `npm run unit`

## success_criteria

- Title and alias triggers are independent.
- Plain title/alias matching works in `mention` and `auto` modes.
- Existing Phase 34 tests still pass.
- Report is saved.

## required_report_format

Save a report at `.ai_state/test_reports/phase34_fix_title_alias_injection_policy_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
