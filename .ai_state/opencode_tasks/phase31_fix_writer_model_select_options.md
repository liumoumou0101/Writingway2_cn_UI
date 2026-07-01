# OpenCode Task: phase31_fix_writer_model_select_options

## task_id

phase31_fix_writer_model_select_options

## task_type

writer_ui_bugfix

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: OFF

## objective

修复阶段 31 写作页模型控制 UI 的阻塞问题：`data-native-model-select` 当前没有任何 option，用户无法实际选择“继承全局 / DeepSeek V4 Flash / DeepSeek V4 Pro”。

## files_allowed

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/writer-button-audit.js`
- `.ai_state/execution_log.md`（追加执行摘要）
- `.ai_state/test_reports/phase31_fix_writer_model_select_options_opencode_report.md`

## files_forbidden

- `src/core/generation/provider-stream.js`
- `tests/provider-stream.js`
- `desktop/storage/**`
- `desktop/services/**`
- `src/core/context/**`
- `src/core/project/**`
- `src/core/workflow/**`
- `release/**`
- package metadata and lockfiles
- any Git history operation

## required_changes

1. 确保写作页模型下拉框有三个可选项：
   - `inherit`：继承全局
   - `deepseek-v4-flash`：DeepSeek V4 Flash
   - `deepseek-v4-pro`：DeepSeek V4 Pro

2. `renderWriterModelControl()` 应保证 option 存在并能正确恢复 `writerModelOverride.model`。

3. 非 DeepSeek API provider 时：
   - 可以禁用 select 和 checkbox；
   - 但提示文字必须可读；
   - 不要用 `pointer-events: none` 阻止用户 hover/复制提示。

4. Thinking details 可见性小修：
   - 如果用户启用 thinking 且正在生成，即使还没收到 reasoning token，也应能看到“推理/思考”区域或至少明确显示“等待思考流...”状态。
   - 不能把 reasoning 混入正文。

## test_plan

按顺序执行：

1. `npm run writer-audit`
2. `npm run desktop-mainline-test`
3. `node tests/provider-stream.js`

如果修改 writer audit，请增加/保持以下断言：

- 模型 select 至少有 3 个 option；
- 可以选择 DeepSeek V4 Pro；
- 可以勾选深度思考；
- 生成 stub 收到 `model: deepseek-v4-pro` 和 `enableThinking: true`。

## success_criteria

- 写作页模型下拉框实际可用。
- DeepSeek provider 下选择模型和 thinking 后，生成配置收到正确 override。
- 非 DeepSeek provider 下提示可读，控件禁用但 UI 不显得坏掉。
- 所有 test_plan 测试通过。

## failure_conditions

- 模型 select 仍为空。
- UI 显示了控件但生成配置没有使用 override。
- 任一测试失败。
- 修改 files_forbidden 文件。

## required_report_format

请输出并保存报告到 `.ai_state/test_reports/phase31_fix_writer_model_select_options_opencode_report.md`：

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
