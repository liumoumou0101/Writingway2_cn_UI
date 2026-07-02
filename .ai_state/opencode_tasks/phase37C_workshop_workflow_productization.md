# OpenCode 任务单：phase37C_workshop_workflow_productization

## task_id

phase37C_workshop_workflow_productization

## task_type

ui_productization

## objective

按 Codex 37A 设计规格重排 Workshop 和 Workflow UI，让 Workshop 像创作讨论与输出转化空间，让 Workflow 像创作流程看板。不得修改生成、工作流引擎或会话存储业务逻辑。

## model_selection

- model = deepseek-v4-pro
- reasoning = LOW

## files_allowed

- `desktop.html`
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js`
- `tests/desktop-library.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/**`

## files_forbidden

- `desktop/services/**`
- `desktop/storage/**`
- `src/core/generation/**`
- `src/core/workflow/**`
- `package.json`
- `release/**`

## scope

必须完成：

- Workshop 无项目 / 无对话 / 有对话 / 有助手输出状态更清楚。
- Workshop 消息流区分用户和助手，输出转资料 / 摘要 / 正文动作更像转化面板。
- Workflow 从“按钮 + 日志”改成步骤看板，当前步骤和下一步操作更明显。
- Workflow 事件日志降为次级信息，不抢当前步骤和产物预览视觉重心。

禁止：

- 改变 workshop message schema。
- 改变 workflow run/step/artifact/event schema。
- 改变 provider 调用逻辑。

## test_plan

- `npm run desktop-mainline-test`
- `npm run writer-audit`
- Playwright 截图检查 Workshop、Workflow 在 1366x768、1920x1080、2560x1440 下无横向溢出。

## success_criteria

- Workshop 第一屏能看出如何开始讨论。
- 有助手输出时转化动作清晰可见。
- Workflow 第一眼能看出当前步骤、当前产物和下一步按钮。
- 自动测试通过。
- 输出结构化报告到 `.ai_state/test_reports/phase37C_workshop_workflow_productization_opencode_report.md`。

## failure_conditions

- 对话发送或输出转化动作回归。
- 工作流启动、生成、采纳、批准、退回、取消任一入口丢失。
- 未运行要求测试。
