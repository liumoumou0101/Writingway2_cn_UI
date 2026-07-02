# OpenCode Task: phase35_cross_module_linkage_ui_first_pass

## task_id

phase35_cross_module_linkage_ui_first_pass

## task_type

medium UI/product integration

## objective

Implement the first pass of cross-module linkage UI so Bookshelf, Writer, Compendium, Workshop, and Workflow feel like one writing workspace instead of separate rooms.

The user specifically feels the module linkage is not smooth enough. Build a conservative first version that is immediately testable and does not require a new data model migration.

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: LOW
- rationale: mostly UI integration and existing-flow wiring. The architecture already exists; do not redesign it.

## files_allowed

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/desktop-library.js`
- `tests/writer-button-audit.js`
- `docs/DESKTOP_UI_TODOLIST.md`
- `.ai_state/test_reports/phase35_cross_module_linkage_ui_first_pass_opencode_report.md`

If absolutely necessary for tiny helper extraction:

- `src/core/workshop/workshop-prompt.js`
- `src/core/knowledge/compendium-schema.js`

## files_forbidden

- Provider/model settings and streaming logic
- Core context resolver behavior
- Prompt template library
- Workflow engine internals
- Backup/recovery internals
- Release artifacts
- Git operations

## implementation_requirements

### 1. Shared project context strip

Add a compact shared context strip/component to the main desktop workspace area or per core view.

It should be visible on at least:

- Writer
- Compendium
- Workshop
- Workflow

It should show:

- current project title
- current scene title if available
- current scene word count or total project word count if cheap
- current compendium injection summary, e.g. "自动上下文 3 张" or "资料 12 张"
- quick actions:
  - 写作
  - 资料
  - 讨论

Behavior:

- If no project is open, show a unified empty state and a "返回书库" action.
- Quick actions should switch views without losing current writer scene selection.
- Keep it compact; do not create a marketing hero or large banner.

### 2. Writer quick handoff actions

Add compact writer actions near the editor header or assistant tools:

- "发送到讨论"
- "保存为资料"

Expected behavior:

- "发送到讨论":
  - If selected text exists in the editor, use selected text.
  - Else use current scene title + current scene summary/first useful excerpt.
  - Open Workshop view.
  - Ensure a workshop session exists.
  - Pre-fill the workshop input with a useful Chinese prompt that references the current scene and includes the selected/excerpted text.
  - Do not automatically send unless the existing app pattern clearly supports it; prefill is safer.

- "保存为资料":
  - If selected text exists, use it as body.
  - Else use current scene summary or selected scene excerpt.
  - Save a `note` compendium entry through the existing `/api/compendium` path.
  - Title should be meaningful, e.g. "来自《Scene 1》的片段".
  - After save, refresh compendium state and show a clear status. It may remain in writer view or switch to compendium; choose the smoother option and make it testable.

### 3. Workshop output conversion polish

Improve the existing Workshop output actions without a large redesign:

- When converting assistant output to compendium, use a more meaningful default title than "Workshop note".
- Include a short summary.
- Add tags such as `workshop` and current scene title if available.
- After conversion, refresh compendium and show a status that includes the new entry title.
- Provide a compact "查看资料" route if feasible; otherwise switching to compendium after conversion is acceptable.

### 4. Compendium card injection status

In compendium list/card rendering, show a small status label for each entry:

- 总是注入
- 条件注入
- 提及时注入
- 手动
- 不自动注入

This label should derive from `entry.contextPolicy.mode` / `entry.alwaysInContext`.

Do not change context resolver semantics.

### 5. Tests

Extend automated tests to cover the new flow:

- Open/create project.
- In Writer, select or use scene text and click "发送到讨论".
- Verify Workshop opens and input is prefilled with scene/selected text.
- Create/send a Workshop response through the existing stub path if needed.
- Convert Workshop output to compendium and verify the compendium entry exists with meaningful title/body/tags.
- Verify compendium list shows injection status labels.
- Verify quick actions in the shared context strip switch between Writer/Compendium/Workshop.

Prefer stable `data-*` selectors over visible Chinese text.

## test_plan

Run:

1. `npm run desktop-mainline-test`
2. `npm run writer-audit`
3. `npm run unit`

If full `writer-audit` becomes flaky due unrelated existing state, report exact failure and run focused `tests/desktop-library.js`.

## success_criteria

- Users can move from Writer to Workshop with selected/current scene context prefilled.
- Users can save writer-selected/current scene text to Compendium.
- Workshop output conversion creates clearer compendium entries.
- Core views expose a compact current-project/current-scene context strip with quick navigation.
- Compendium entries show injection policy status.
- Tests pass.
- Report is saved.

## failure_conditions

- Existing writer generation/rewrite flow regresses.
- Existing Workshop send/convert/insert actions regress.
- Context resolver behavior changes.
- Provider/model settings change.
- UI creates obvious overflow at 1366x768.

## required_report_format

Save a report at `.ai_state/test_reports/phase35_cross_module_linkage_ui_first_pass_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
