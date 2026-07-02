# OpenCode Task Report

## task_id

phase34_fix_always_policy_mapping

## status

completed

## modified_files

- `src/desktop/desktop-shell.js` — 3 changes:
  1. `collectCompendiumForm()`: `alwaysInContext` now derived from `policyMode === 'always'` instead of reading the `data-compendium-always` checkbox directly.
  2. Form population: `data-compendium-always` checkbox is set to mirror `policyMode.value === 'always'` after the policy mode select is populated, making the checkbox a compatibility display.
  3. `bindCompendium()`: Added `change` event listener on `policyMode` to immediately sync the `always` checkbox when the user changes the policy mode select.

- `tests/writer-button-audit.js` — Added Phase 34 fix test:
  - Navigates to compendium view
  - Changes policy mode to `always`, verifies checkbox syncs to `true`
  - Changes policy mode to `disabled`, verifies checkbox syncs to `false`
  - Verifies `collectCompendiumForm`-equivalent logic derives `alwaysInContext` from mode
  - Restores to `always`, verifies checkbox and form logic again

## executed_commands

1. `node tests/writer-button-audit.js` — PASSED
2. `npm run unit` — PASSED (includes core-test, storage-test, context-prompt-core, gen-buildPrompt, unit-context-tags, unit-rewrite-presets, release-config)

## test_results

### writer-button-audit.js
- All 200+ assertions passed including:
  - Existing Phase 32-34 tests (provider profiles, model switching, profile test, compendium policy API, character profiles, context resolution, prompt building)
  - New Phase 34 fix assertions for alwaysInContext compatibility (checkbox sync, form logic derivation)

### npm run unit
- Core project tests passed
- Core generation tests passed
- Project file store test passed
- Project directory API test passed
- Workflow store test passed
- Workflow engine service test passed
- Settings service test passed
- Compendium service test passed
- Prompt service test passed
- Workshop service test passed
- Project migration service test passed
- Context and prompt core test passed
- Generation.buildPrompt unit test passed
- Context tag mention test passed
- Rewrite preset test passed
- Release configuration test passed

## git_diff_summary

### src/desktop/desktop-shell.js

1. **`collectCompendiumForm()`** (line ~2880):
   - Removed: `const alwaysInContext = !!(elements.always && elements.always.checked);`
   - Added: `const alwaysInContext = policyMode === 'always';` (derived from mode, not checkbox)
   - Moved `alwaysInContext` initialization after `policyMode` is determined

2. **Form population** (line ~2806):
   - Moved `elements.always` checkbox assignment after `elements.policyMode.value` is set
   - Changed from: `elements.always.checked = !!selected.alwaysInContext;`
   - Changed to: `elements.always.checked = (elements.policyMode ? elements.policyMode.value : 'manual') === 'always';`

3. **`bindCompendium()`** (after dirty listeners):
   - Added change listener on `elements.policyMode` that sets `elements.always.checked` to match `elements.policyMode.value === 'always'`

### tests/writer-button-audit.js

- Added ~80 lines of new test at end of Phase 34 section (before `console.log('Writer button audit passed.')`)
- Test verifies:
  - Policy mode select and always checkbox are interactive
  - Checkbox mirrors policy mode change immediately
  - `collectCompendiumForm` logic derives `alwaysInContext` correctly from mode
  - Both `always` and `disabled` modes produce correct `alwaysInContext` values

## failure_analysis

No failures. All existing and new tests pass.

The root cause of the bug was that `collectCompendiumForm()` read the `data-compendium-always` checkbox directly, bypassing `contextPolicy.mode`. When a user changed the policy mode select to `disabled` but the checkbox was still checked (either from an old entry with `alwaysInContext: true` or because the checkbox wasn't synced), the submitted body contained `alwaysInContext: true` alongside `contextPolicy: { mode: 'disabled' }`. The schema's `normalizeContextPolicy` uses OR logic (`alwaysFromInput || contextPolicy.mode === 'always'`), so `alwaysInContext` remained `true`.

The fix makes `contextPolicy.mode` the source of truth: the checkbox is a visual mirror of the mode select, and the submission derives `alwaysInContext` from the mode. Three changes were made: (1) form collection derivation, (2) form population to mirror mode, (3) event listener for immediate sync on mode change.

## next_suggestion

No follow-up needed for this bug. The Phase 34 features (context policy, character profiles) are now fully wired in the desktop form. Consider implementing the `mention` and `auto` policy modes' title/alias trigger logic in the context resolver if not already complete.
