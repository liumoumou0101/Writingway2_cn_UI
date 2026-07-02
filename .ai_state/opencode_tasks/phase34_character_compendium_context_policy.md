# OpenCode Task: phase34_character_compendium_context_policy

## task_id

phase34_character_compendium_context_policy

## task_type

complex implementation

## objective

Upgrade character cards and compendium cards from passive notes into controllable writing-context sources.

The user explicitly wants:

- Every character card and compendium card should have a switch controlling whether it can be injected into prompts.
- Cards should support simple first-pass conditions/rules for when they are injected.
- This belongs to the writing feature, because these cards constrain generated prose by adding relevant context to the prompt.

Do not attempt a full rule engine in this phase. Implement a conservative first version that is easy to test and easy to expand later.

## model_selection

- model: deepseek/deepseek-reasoner
- reasoning: ON
- rationale: this changes context resolution behavior, schema compatibility, writer prompt behavior, and tests. It requires careful root-cause-style reasoning to avoid breaking existing context injection.

## files_allowed

- `src/core/knowledge/compendium-schema.js`
- `src/core/context/context-resolver.js`
- `src/core/generation/prompt-builder.js`
- `src/desktop/desktop-shell.js`
- `desktop.html`
- `src/styles/desktop.css`
- `desktop/services/compendium-service.js`
- `desktop/storage/compendium-store.js`
- `tests/context-prompt-core.js`
- `tests/unit-context-tags.js`
- `tests/compendium-service.js`
- `tests/writer-button-audit.js`
- `docs/DESKTOP_UI_TODOLIST.md`
- `.ai_state/test_reports/phase34_character_compendium_context_policy_opencode_report.md`

If a small helper module is clearly cleaner, you may add it under:

- `src/core/context/`
- `src/core/knowledge/`

## files_forbidden

- Provider/model settings and streaming logic
- Prompt template library
- Workflow engine
- Backup/recovery
- Release artifacts
- Git operations

## existing_behavior_to_preserve

Current context resolution already supports:

- Manual compendium selection by entry id.
- Manual compendium selection by tag.
- `alwaysInContext`.
- `@[Title]` / alias mentions.
- Plain tag matching in beat text and current scene text.
- Recent previous scene summaries.
- `#[]` scene mention.
- ASCII boundary safety for short tags.

These must keep working unless a card explicitly disables automatic injection.

## implementation_requirements

### 1. Schema: per-card injection policy

Extend compendium entries with a normalized, backward-compatible context policy.

Recommended shape:

```js
contextPolicy: {
  mode: 'manual' | 'mention' | 'auto' | 'always' | 'disabled',
  triggers: {
    title: true,
    aliases: true,
    tags: true,
    pov: true,
    sceneCharacters: true
  }
}
```

Interpretation:

- `disabled`: never automatically injected; explicit manual selection may still include it because the user deliberately selected it.
- `manual`: only manual selection by card/tag, or explicit `@[Title]` mention. This should be the default for new cards unless existing `alwaysInContext` says otherwise.
- `mention`: inject on explicit `@[Title]`, title/alias mention, or tag mention depending on enabled triggers.
- `auto`: inject on mention conditions plus writer-specific conditions such as current POV or scene characters.
- `always`: equivalent to old `alwaysInContext`.

Backward compatibility:

- Existing `alwaysInContext: true` should normalize to `contextPolicy.mode = 'always'`.
- Existing entries without policy should not suddenly inject more aggressively than before, except for existing behavior that already worked.
- Keep `alwaysInContext` field for compatibility, deriving it from `contextPolicy.mode === 'always'` where appropriate.

### 2. Character-specific fields, first pass

Add a small first-pass `characterProfile` object for `type === 'character'` entries:

```js
characterProfile: {
  role: '',
  goal: '',
  motivation: '',
  conflict: '',
  voice: '',
  currentState: '',
  knowledge: '',
  relationshipNotes: ''
}
```

This is not a full character system yet, but it gives prompt context stronger, structured constraints.

Normalize these fields in `compendium-schema.js`.

### 3. Context resolver behavior

Update `resolveContext()` so each entry can be included for explicit reasons:

- manual entry id
- manual tag
- `always`
- explicit `@[Title]` / alias mention
- title/alias plain mention when enabled
- tag mention when enabled
- POV match for character cards when enabled and `input.povCharacter` or `selection.povCharacter` matches title/alias
- scene character match when enabled and current scene metadata lists characters

Add metadata for diagnostics if practical:

```js
context.includedEntryReasons = {
  [entryId]: ['manual', 'tag', 'pov', ...]
}
```

If adding metadata is too invasive, at least keep internal tests that prove each reason.

Important:

- Manual explicit selection by entry id should still include entries even if `contextPolicy.mode === 'disabled'`, because user explicitly chose it in the context panel.
- Automatic sources must respect `disabled`.
- `alwaysInContext` must behave like `always`.

### 4. Prompt formatting

Improve compendium prompt formatting so character cards are stronger constraints:

- For `type === 'character'`, include structured character fields when present:
  - role
  - goal
  - motivation
  - conflict
  - voice
  - currentState
  - knowledge
  - relationshipNotes
- Keep existing body/summary output.
- Non-character entries can remain mostly unchanged.

Do not change prompt templates.

### 5. Desktop UI

In the compendium editor:

- Add an injection-policy section.
- Add a mode select with Chinese labels:
  - 不自动注入 (`disabled`)
  - 仅手动/明确提及 (`manual`)
  - 提及时注入 (`mention`)
  - 条件自动注入 (`auto`)
  - 总是注入 (`always`)
- Add simple trigger checkboxes:
  - 标题
  - 别名
  - 标签
  - POV 人物匹配
  - 场景人物匹配
- Keep the old “默认加入生成上下文” behavior visually mapped to `always`.
- For character entries, show the first-pass character profile fields.
- For non-character entries, hide or disable character profile fields.

Keep the UI compact. Do not redesign the whole compendium page.

### 6. Writer behavior

When building native writer prompts:

- Pass current scene POV and current scene character information into the context resolver.
- If current project/scene already has a POV field, use it.
- If scene metadata has character tags/list, use it; if no such field exists yet, support a simple comma-separated field only if it already exists. Do not invent a large scene schema migration.

If there is currently no scene character metadata field, at minimum implement POV-based character injection and leave sceneCharacters trigger supported in core resolver/tests for future UI.

### 7. Tests

Extend tests so they prove:

- `alwaysInContext` still includes entries.
- `disabled` prevents automatic tag/title/POV injection.
- Manual entry id selection still includes a disabled entry.
- `mention` mode injects on `@[Title]` / alias or title/tag mention according to triggers.
- `auto` mode injects a character card when POV matches title or alias.
- Character profile fields appear in generated prompt text.
- Existing plain tag matching and ASCII boundary behavior still work.
- Desktop writer audit can create/edit a character card policy and verify prompt preview includes the expected character context.

## test_plan

Run sequentially:

1. `node tests/context-prompt-core.js`
2. `node tests/unit-context-tags.js`
3. `node tests/compendium-service.js`
4. `npm run writer-audit`
5. `npm run desktop-mainline-test`
6. `npm run unit`

If the full suite risks timing out, prioritize the first four and clearly report anything not run.

## success_criteria

- Per-card injection switch and simple conditions are implemented.
- Character cards have structured first-pass fields.
- Context resolver respects policies while preserving existing behavior.
- Prompt text includes structured character constraints when relevant.
- Tests pass.
- Report is saved.

## failure_conditions

- Existing `alwaysInContext`, manual context, or tag matching regresses.
- Disabled cards are auto-injected.
- Prompt preview loses compendium references.
- UI changes break writer audit or compendium save.
- Implementation expands into provider/model settings, workflow, backup, or release.

## required_report_format

Save a report at `.ai_state/test_reports/phase34_character_compendium_context_policy_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
