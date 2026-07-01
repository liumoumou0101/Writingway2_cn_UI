# OpenCode Task: phase31_writer_model_capability_thinking_stream

## task_id

phase31_writer_model_capability_thinking_stream

## task_type

writer_generation_model_capability_ui

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: LOW

## objective

实现写作页的第一版模型能力配置层：用户可以在写作界面选择 DeepSeek V4 Flash / Pro，并切换 Thinking 模式；软件自动处理模型能力差异，不要求用户记住底层 API 参数限制。Thinking 模式必须流式显示 reasoning / 思考过程，不再长时间无反馈。

本轮只覆盖 DeepSeek API provider 的写作页体验。不要改完整设置页架构，不要实现叙事控制辅助系统。

## background

当前问题：

- 写作页只消费全局 provider 设置，不能在写作界面快速切换模型。
- `src/core/generation/provider-stream.js` 在 DeepSeek Thinking 模式下把 `stream` 关掉，导致用户等待完整 response 才看到内容。
- Thinking 模式下 reasoning 内容没有流式分流展示。
- DeepSeek Thinking 模式不支持 temperature/top_p/presence_penalty/frequency_penalty 等采样参数，软件应自动隐藏/禁用或不发送无效参数。

官方文档依据（由 Codex 查验）：

- DeepSeek V4 当前模型：`deepseek-v4-flash`、`deepseek-v4-pro`。
- 两者均支持 Thinking / Non-Thinking，默认按 1M 上下文能力处理。
- Thinking 模式下不支持 temperature/top_p/presence_penalty/frequency_penalty 等采样参数。
- Thinking 模式应通过流式 `reasoning_content` 提供思考过程，最终正文仍通过 `content`。

## files_allowed

- `desktop.html`
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js`
- `src/core/generation/provider-stream.js`
- `tests/writer-button-audit.js`
- `tests/core-generation.js`
- `tests/context-prompt-core.js`
- 新增 focused test file under `tests/` if useful, e.g. `tests/provider-stream.js`
- `package.json` only if adding a test script is necessary; prefer direct node test or existing test script if possible.
- `.ai_state/execution_log.md`（追加执行摘要）
- `.ai_state/test_reports/phase31_writer_model_capability_thinking_stream_opencode_report.md`

## files_forbidden

- `desktop/main.js`
- `desktop/preload.js`
- `desktop/storage/**`
- `desktop/services/project-service.js`
- `desktop/services/prompt-service.js`
- `src/core/project/**`
- `src/core/context/**`
- `src/core/workflow/**`
- `src/core/workshop/**`
- `release/**`
- package lockfiles
- any Git history operation

## required_changes

1. 写作页模型控制 UI
   - 在写作页“生成”面板中增加紧凑的模型控制区。
   - 至少包含：
     - 模型选择：继承全局 / DeepSeek V4 Flash / DeepSeek V4 Pro
     - Thinking 开关：启用/禁用深度思考
   - UI 文案必须是中文，避免暴露过多 API 术语。
   - 如果当前全局 provider 不是 DeepSeek API，可以禁用或弱化该区域，并显示“当前 provider 使用全局模型设置”之类提示。

2. 写作页 runtime override
   - 当用户选择 DeepSeek V4 Flash / Pro 时，本次写作生成、改写、选区重生成、历史重试应使用该模型覆盖全局 model。
   - Thinking 开关启用时，应传递明确的 thinking intent，例如 `enableThinking: true` / `thinkingMode: true`。
   - 选择“继承全局”时保持当前全局设置行为。
   - 选择状态建议保存到 localStorage，至少在当前桌面会话/项目内保持。

3. Provider stream reasoning 分流
   - 更新 `src/core/generation/provider-stream.js`：
     - DeepSeek Thinking 模式也应 `stream: true`。
     - 流式解析 `delta.reasoning_content` 和 `delta.content`。
     - 调用 token callback 时保持向后兼容：老代码仍能 `onToken(token)`；新代码可接收第二参数 `{ type: 'reasoning' | 'content' }`。
     - Thinking 模式下不要发送 temperature/max_tokens 等不支持或可能无效的采样参数；max_tokens 如官方仍支持可保留，否则不要在本轮强行处理。至少 temperature/top_p/presence_penalty/frequency_penalty 不应在 thinking 模式发送。
     - Non-thinking 模式保持当前流式正文行为。

4. 写作页 reasoning 显示
   - `nativeEditorState.generation.reasoning` 应在 Thinking 流式过程中持续更新。
   - 现有确认框里的“推理/思考” details 应在有 reasoning 或正在 thinking 时可见。
   - 流式思考时显示阶段状态，例如“正在思考...”；开始收到正文后显示“正在成文...”或类似文案。
   - 最终正文仍进入生成结果确认框，保留/重试/撤回行为不变。

5. 模型能力自动配置
   - 在代码中增加轻量模型能力表或 helper，至少覆盖：
     - `deepseek-v4-flash`
     - `deepseek-v4-pro`
   - 能力信息至少包括：是否支持 thinking、thinking 时禁用采样参数、上下文说明（可用于 UI 文案，不需要完整 token 预算算法）。
   - UI 不要求用户手动输入 `deepseek-v4-pro-thinking` 这种内部模型名。

## test_plan

按顺序执行：

1. Focused provider-stream test（如果新增 test 文件，请运行它；否则说明已有测试覆盖在哪里）
2. `npm run writer-audit`
3. `npm run desktop-mainline-test`
4. `npm run unit`

测试必须覆盖：

- DeepSeek V4 Pro + Thinking 请求体使用真实模型 `deepseek-v4-pro`，`stream: true`，`thinking.enabled` 或等价字段启用。
- Thinking 流式 chunk 中的 `reasoning_content` 能进入 reasoning 回调/状态，`content` 能进入正文回调/状态。
- Thinking 模式下不发送 temperature 等无效采样参数。
- 写作页选择模型/Thinking 后，生成调用能收到 override config。
- 旧的非 Thinking 生成、保留、重试、撤回测试不回退。

## success_criteria

- DeepSeek flash/pro + Thinking UI 出现在写作生成面板，中文文案清楚。
- Thinking 模式能流式显示思考过程，不再等完整 JSON response 才反馈。
- 模型能力差异由软件自动处理，用户无需知道 `*-thinking` 内部模型名。
- 所有 test_plan 测试通过。
- 改动范围只在 files_allowed 内。
- 不改变项目存储格式、prompt 模板结构、上下文解析逻辑或工作流引擎。

## failure_conditions

- Thinking 模式仍然非流式。
- reasoning_content 被混入正文结果，或正文 content 被塞进思考区。
- 写作页模型选择破坏全局设置页保存/读取。
- 任一指定测试失败。
- 修改 files_forbidden 文件。
- 没有输出结构化报告。

## required_report_format

请输出并保存报告到 `.ai_state/test_reports/phase31_writer_model_capability_thinking_stream_opencode_report.md`：

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
