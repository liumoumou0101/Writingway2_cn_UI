# OpenCode Task: phase34_fix_always_policy_mapping

## task_id

phase34_fix_always_policy_mapping

## task_type

focused bugfix

## objective

Fix a Phase 34 review bug in the compendium editor:

The old `alwaysInContext` checkbox is now a compatibility display for the new injection policy, but `collectCompendiumForm()` still reads it directly. If an old entry had `alwaysInContext: true`, changing the new mode select to `disabled` or `manual` can still submit `alwaysInContext: true`, causing the resolver/schema to treat the card as always injected.

Make the new policy mode the source of truth.

## model_selection

- model: deepseek/deepseek-reasoner
- reasoning: ON
- rationale: small compatibility bug with data migration implications.

## files_allowed

- `src/desktop/desktop-shell.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/phase34_fix_always_policy_mapping_opencode_report.md`

## files_forbidden

- provider/model settings files
- `src/core/context/context-resolver.js`
- `src/core/knowledge/compendium-schema.js`
- prompt template library
- workflow/backup/release files
- git operations

## implementation_requirements

1. In compendium editor form handling:
   - `contextPolicy.mode` should be the source of truth.
   - Submitted `alwaysInContext` should be `true` only when `contextPolicy.mode === 'always'`.
   - The old `data-compendium-always` checkbox should visually mirror `policyMode === 'always'`.
   - When the policy mode select changes, update the old checkbox display immediately.

2. Preserve old entries:
   - When loading an entry with `alwaysInContext: true` and no policy, the UI should show policy mode `always`.
   - If the user changes the mode away from `always` and saves, it should no longer submit `alwaysInContext: true`.

3. Add/update writer audit test:
   - Simulate or verify saving an entry that previously had `alwaysInContext: true` but now has `contextPolicy.mode: 'disabled'`.
   - The saved body returned by the API/form path must have `alwaysInContext === false` or at least not remain true through the desktop form collection path.
   - Keep the existing Phase 34 tests passing.

## test_plan

Run:

1. `node tests/writer-button-audit.js`
2. `npm run unit`

## success_criteria

- Changing policy away from `always` no longer leaves stale `alwaysInContext: true`.
- Old always entries still load as mode `always`.
- Tests pass.
- Report is saved.

## required_report_format

Save a report at `.ai_state/test_reports/phase34_fix_always_policy_mapping_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
