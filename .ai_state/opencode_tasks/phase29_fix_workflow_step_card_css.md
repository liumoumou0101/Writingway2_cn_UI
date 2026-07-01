# OpenCode Task: phase29_fix_workflow_step_card_css

## task_id

phase29_fix_workflow_step_card_css

## task_type

desktop_ui_css_bugfix

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: OFF

## objective

修复阶段 29 工作流页 CSS 选择器拆分后造成的卡片样式丢失风险。

当前可疑问题：`.desktop-workflow-run` 和 `.desktop-workflow-step` 被改成只设置 `display:flex`、`align-items`、`gap`，而原本和 `.desktop-workflow-artifact`、`.desktop-workflow-event` 共用的边框、背景、padding、文字样式可能不再生效。

正确目标：

- `.desktop-workflow-run`、`.desktop-workflow-step`、`.desktop-workflow-artifact`、`.desktop-workflow-event` 都应保留统一卡片基础样式：border、border-radius、background、padding、color、font-size、line-height。
- `.desktop-workflow-step` 额外保留 flex layout，以容纳编号圆点和正文。
- `.desktop-workflow-run` 不应被错误强制成不合适的 flex 布局，除非确认原结构需要。
- 不改变工作流业务逻辑和 DOM 渲染语义。

## files_allowed

- `src/styles/desktop.css`
- `.ai_state/execution_log.md`（追加执行摘要）
- `.ai_state/test_reports/phase29_fix_workflow_step_card_css_opencode_report.md`

## files_forbidden

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `tests/**`
- `src/main/**`
- `src/preload/**`
- `src/providers/**`
- `src/services/**`
- `src/context/**`
- `src/workflow/**`
- `src/storage/**`
- `release/**`
- package metadata and lockfiles
- any Git history operation

## test_plan

按顺序执行：

1. `npm run writer-audit`
2. `npm run desktop-mainline-test`

## success_criteria

- 工作流 run/step/artifact/event 都有统一卡片基础样式。
- 工作流 step 仍能展示编号圆点与文本布局。
- 指定测试通过。
- 改动范围只在 files_allowed 内。

## failure_conditions

- 工作流 run 或 step 丢失边框、背景、padding 等卡片样式。
- 任一指定测试失败。
- 修改了 files_forbidden 文件。
- 改动业务逻辑或测试。

## required_report_format

请输出并保存报告到 `.ai_state/test_reports/phase29_fix_workflow_step_card_css_opencode_report.md`：

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
