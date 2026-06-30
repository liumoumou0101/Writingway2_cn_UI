# OpenCode Task: phase27_desktop_plain_tag_context_mentions

## task_id
phase27_desktop_plain_tag_context_mentions

## task_type
frontend_core_context_bugfix

## model_selection
- model: deepseek-v4-pro-reasoning
- reasoning: ON
- rationale: This is a core writing-context behavior with edge cases around mention parsing, plain tag matching, and avoiding false positives.

## objective
Add the missing new-desktop/core behavior where compendium entries are automatically included in generation context when the current scene text or beat text plainly mentions one of the entry's tags. Existing `@[Title/Alias]` and manual context tag selection already work and must continue to work.

## current_findings_from_codex
- New desktop `buildNativePrompt()` calls `WritingwayContextResolver.resolveContext()`.
- `src/core/context/context-resolver.js` currently resolves compendium by:
  - `alwaysInContext`
  - manual `selection.compendiumIds`
  - manual `selection.compendiumTags`
  - explicit `@[title-or-alias]` in beat text
- It does not currently scan current scene text or beat text for plain compendium tag strings.
- Legacy/compat code in `src/modules/beat-mentions.js` already supports this behavior via `textMentionsTerm(mentionText, tag)` over `beat + currentScene.content`, including an important ASCII boundary rule to avoid `art` matching `Cartography`.

## desired_behavior
In the core/new desktop resolver:

1. If beat text contains a compendium tag as plain text, include that entry.
2. If current scene text contains a compendium tag as plain text, include that entry.
3. Include both Chinese/non-ASCII tags by substring match and ASCII tags by token-boundary match:
   - tag `moon-gate-tag` should match `... moon-gate-tag ...`
   - tag `art` must not match `Cartography`
4. Keep existing `@[Title]`, `@[Alias]`, always-in-context, manual ID selection, and manual tag selection behavior intact.
5. Do not include entries just because a title or alias appears as plain text unless you intentionally decide and document that extension. The requested missing behavior is specifically tag mention scanning.
6. Preserve context budget behavior.

## files_allowed
- `src/core/context/context-resolver.js`
- `tests/context-prompt-core.js`
- `tests/unit-context-tags.js`
- `tests/writer-button-audit.js` only if a desktop UI regression check is needed
- `.ai_state/execution_log.md`

## forbidden_scope
- Do not modify provider/API logic.
- Do not modify prompt templates.
- Do not modify compendium storage schema.
- Do not redesign UI.
- Do not touch release artifacts.
- Do not commit or print API keys.

## test_plan
Run:
- `node tests/context-prompt-core.js`
- `node tests/unit-context-tags.js`
- `npm run desktop-mainline-test`

Add or extend tests so they prove:
- plain tag in beat text includes the matching compendium entry
- plain tag in current scene text includes the matching compendium entry
- ASCII short tag boundary rule prevents false positives, e.g. tag `art` does not match `Cartography`
- existing `@[Title]` / alias behavior still passes
- resulting prompt includes the resolved compendium body

## success_criteria
- Required tests pass.
- New tests fail on the current pre-fix behavior and pass after the fix.
- Diff stays within allowed files.
- OpenCode returns a structured report with modified files, commands, test results, diff summary, failure analysis, and next suggestion.

## failure_conditions
- Any required test fails.
- Plain tag matching only works in legacy modules but not `src/core/context/context-resolver.js`.
- False positive ASCII partial matching is introduced.
- Existing `@[Title]` / alias behavior regresses.
