# OpenCode Task: phase31_fix_writer_model_control_audit_and_inherit_thinking

## task_id

phase31_fix_writer_model_control_audit_and_inherit_thinking

## task_type

test_failure_diagnosis_and_writer_ui_logic_fix

## model_selection

- model: deepseek/deepseek-reasoner
- reasoning: ON

## objective

修复阶段 31 follow-up 的失败状态：

1. `npm run writer-audit` 当前失败，因为测试在全局 provider 仍为 local 时强行启用写作页 DeepSeek 模型控件，随后真实渲染逻辑把它重置。
2. 写作页模型控制存在语义缺口：当模型选择为“继承全局”但用户勾选“深度思考”时，如果全局 provider 是 DeepSeek，`nativeGenerationConfig()` 应传递 `enableThinking: true`；当前只在选择具体模型时传递。

## files_allowed

- `src/desktop/desktop-shell.js`
- `tests/writer-button-audit.js`
- `.ai_state/execution_log.md`（追加执行摘要）
- `.ai_state/test_reports/phase31_fix_writer_model_control_audit_and_inherit_thinking_opencode_report.md`

## files_forbidden

- `src/core/generation/provider-stream.js`
- `tests/provider-stream.js`
- `desktop.html`
- `src/styles/desktop.css`
- `desktop/storage/**`
- `desktop/services/**`
- `src/core/context/**`
- `src/core/project/**`
- `src/core/workflow/**`
- `release/**`
- package metadata and lockfiles
- any Git history operation

## required_changes

1. 修复 `nativeGenerationConfig(signal)`：
   - 如果 `writerModelOverride.model !== 'inherit'`，继续按当前逻辑覆盖 `base.model`。
   - 如果 `writerModelOverride.thinking === true` 且最终 provider 是 DeepSeek，应设置 `base.enableThinking = true`，即使 model 是 `inherit`。
   - 如果 provider 不是 DeepSeek，不要传递 DeepSeek-only thinking override。

2. 修复 `tests/writer-button-audit.js`：
   - 不要通过强行 `select.disabled = false` / `classList.remove('is-disabled')` 绕过产品 UI。
   - 在测试 DeepSeek 写作页模型控件前，使用真实设置 API 或应用内设置流程把 provider 配成 DeepSeek API。
   - 然后通过正常用户操作选择 `deepseek-v4-pro`、勾选“深度思考”。
   - 断言生成 stub 收到 `model: 'deepseek-v4-pro'` 和 `enableThinking: true`。
   - 额外覆盖“继承全局 + 深度思考”：选择 `inherit`、勾选 thinking 后，生成 stub 应收到 `enableThinking: true` 且保留全局 DeepSeek 模型。

3. 保持现有 provider-stream test 不变。

## test_plan

按顺序执行：

1. `npm run writer-audit`
2. `node tests/provider-stream.js`
3. `npm run desktop-mainline-test`

如时间允许再执行：

4. `npm run unit`

## success_criteria

- `npm run writer-audit` 不再超时。
- 测试通过真实 DeepSeek provider 设置验证模型控件，不再绕过 UI disabled 逻辑。
- `inherit + thinking` 对 DeepSeek provider 生效。
- 指定测试通过。
- 改动范围只在 files_allowed 内。

## failure_conditions

- writer audit 仍失败或依旧通过强行启用 disabled 控件实现。
- inherit + thinking 不生效。
- 修改 files_forbidden 文件。
- 没有输出结构化报告。

## required_report_format

请输出并保存报告到 `.ai_state/test_reports/phase31_fix_writer_model_control_audit_and_inherit_thinking_opencode_report.md`：

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
