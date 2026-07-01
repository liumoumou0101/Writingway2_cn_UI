# OpenCode Task: phase29_fix_project_more_toggle_label

## task_id

phase29_fix_project_more_toggle_label

## task_type

desktop_ui_bugfix

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: OFF

## objective

修复阶段 29 书库项目卡片“更多”折叠按钮的状态文案反转问题。

当前问题：第一次点击展开后，按钮仍显示“更多”；再次点击收起后，按钮显示“收起”。这会误导用户。

正确行为：

- 初始折叠：按钮显示“更多”。
- 点击展开：抽屉显示，按钮显示“收起”，并带有展开状态样式。
- 再次点击收起：抽屉隐藏，按钮显示“更多”，展开状态样式移除。

## files_allowed

- `src/desktop/desktop-shell.js`
- `tests/desktop-library.js`
- `.ai_state/execution_log.md`（追加执行摘要）
- `.ai_state/test_reports/phase29_fix_project_more_toggle_label_opencode_report.md`

## files_forbidden

- `desktop.html`
- `src/styles/desktop.css`
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

1. `npm run desktop-mainline-test`
2. `npm run writer-audit`

如修改测试，必须保持断言强度：至少验证点击“更多”后目标动作可点击，并且按钮文案切换正确。

## success_criteria

- “更多”按钮展开/收起文案正确。
- 抽屉 hidden 状态、展开样式和文案一致。
- 指定测试通过。
- 改动范围只在 files_allowed 内。

## failure_conditions

- 仍然出现文案反转。
- 任一指定测试失败。
- 修改了 files_forbidden 文件。
- 改动业务逻辑或项目卡片动作语义。

## required_report_format

请输出并保存报告到 `.ai_state/test_reports/phase29_fix_project_more_toggle_label_opencode_report.md`：

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
