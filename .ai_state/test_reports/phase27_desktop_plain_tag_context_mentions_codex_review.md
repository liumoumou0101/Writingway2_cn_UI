# Codex Review: phase27_desktop_plain_tag_context_mentions

## Result

success

## Scope

OpenCode implemented automatic plain compendium tag matching in the new desktop/core context resolver.

## Changed Files

- `src/core/context/context-resolver.js`
- `tests/context-prompt-core.js`
- `.ai_state/execution_log.md`
- `.ai_state/opencode_tasks/phase27_desktop_plain_tag_context_mentions.md`

## Behavior Accepted

- Plain tag in beat text includes the matching compendium entry.
- Plain tag in current scene text includes the matching compendium entry.
- Chinese/non-ASCII tags match by substring.
- ASCII tags match with token boundaries, so short tags such as `art` do not match longer words such as `Cartography`.
- Existing `@[Title]` / alias mention behavior still works.
- Manual context tag selection still remains separate and unchanged.

## Codex Independent Verification

Codex ran a focused desktop Playwright check with a temporary project:

- scene text containing `moon-gate-tag` included the matching compendium body in prompt preview
- scene text containing `月门标签` included the matching compendium body in prompt preview
- beat text containing `moon-gate-tag` included the matching compendium body in prompt preview
- beat text containing `Cartography` did not include an entry whose only tag was `art`

## Tests

- `node tests/context-prompt-core.js`: passed
- `node tests/unit-context-tags.js`: passed
- `npm run desktop-mainline-test`: passed
- `npm run writer-audit`: passed
- `npm run dist`: passed
- `npm run packaged-smoke`: passed

## Residual Risk

This feature can intentionally pull more context into prompts when users reuse broad tags. Writers should use reasonably specific compendium tags for high-signal automatic context injection.
