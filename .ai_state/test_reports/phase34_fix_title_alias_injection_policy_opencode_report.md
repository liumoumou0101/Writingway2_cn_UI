# OpenCode Report

## task_id

phase34_fix_title_alias_injection_policy

## status

completed - all tests pass

## modified_files

- `src/core/context/context-resolver.js`
- `tests/context-prompt-core.js`

## executed_commands

1. `node tests/context-prompt-core.js` — passed
2. `node tests/unit-context-tags.js` — passed
3. `npm run unit` — passed (all 17 sub-tests)

## test_results

- All 17 tests in `context-prompt-core.js` pass, including:
  - Tests 1–13: existing behavior preserved (explicit @[...] mentions, always-in-context, tag mentions, ASCII boundary, disabled mode, manual selection, mention mode, auto mode POV, character profiles, includedEntryReasons)
  - Test 14: mention mode includes entry when beat text plainly contains title
  - Test 15: mention mode includes entry when beat text plainly contains alias
  - Test 16: disabling title trigger prevents plain title matching
  - Test 17: disabling aliases trigger prevents alias matching while title matching still works
- `unit-context-tags.js` — passed
- `npm run unit` — passed (all suite components)

## git_diff_summary

### `src/core/context/context-resolver.js`

- **Split `entryMatchesMention`** into `entryMatchesTitle(entry, names)` and `entryMatchesAliases(entry, names)` so title and alias matching can be gated independently.
- **Explicit `@[...]` mentions**: now use `triggers.title && entryMatchesTitle(...)` and `triggers.aliases && entryMatchesAliases(...)` separately instead of a single `triggers.title && entryMatchesMention(...)` call.
- **Plain text title/alias matching**: for `mention` and `auto` modes, uses `textMentionsTerm(mentionText, entry.title)` (gated on `triggers.title`) and `(entry.aliases || []).some(alias => textMentionsTerm(mentionText, alias))` (gated on `triggers.aliases`). Searches the same `mentionText` (beat + current scene content) used for tag matching.
- Preserved existing `manual` mode behavior (no plain text title/alias matching beyond existing tag matching and explicit @[...]).
- Preserved `disabled` mode behavior (no automatic injection unless explicitly selected by id/tag).

### `tests/context-prompt-core.js`

- Added 4 new tests (14–17) covering the title/alias trigger independence and plain text matching:
  - Test 14: plain title in beat text matches in mention mode
  - Test 15: plain alias in beat text matches in mention mode
  - Test 16: disabling title trigger prevents plain title match
  - Test 17: disabling aliases trigger prevents alias match while title match still works

## failure_analysis

No failures. The fix was narrow and self-contained:
- Title and alias matching now gate on `triggers.title` and `triggers.aliases` independently for both explicit `@[...]` mentions and plain text mentions.
- Plain text title/alias matching is only activated for `mention` and `auto` modes, using the existing `textMentionsTerm()` helper for consistent ASCII boundary safety.
- All existing tests (1–13) pass without modification, confirming backward compatibility.

## next_suggestion

Consider whether `manual` mode should also support plain text title/alias matching in the future, but this is out of scope for the current narrow fix.
