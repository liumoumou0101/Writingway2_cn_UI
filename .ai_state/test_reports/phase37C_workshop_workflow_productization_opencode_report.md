# OpenCode 执行报告：phase37C_workshop_workflow_productization

## 日期

2026-07-02

## 任务

按 Codex 37A 设计规格重排 Workshop 和 Workflow UI。

## 结果：success

---

## 变更汇总

### desktop.html

**Workshop：**
- 侧栏：新增 `[data-workshop-project-summary]` 项目摘要卡片，显示项目名、对话数、资料数、当前场景。
- 中区：新增 `[data-workshop-empty]` 空状态容器，支持无项目/无对话/未选择对话三种引导态。
- 输出区：从普通按钮改为转化面板 (`desktop-workshop-output-panel`)，包含标题"输出转化"和三个卡片式转化按钮（转为资料/场景摘要/插入正文），每个带图标、标签和提示文字。
- 中区标题：`Conversation` → `讨论`，与侧栏 `Workshop / 讨论` 一致。

**Workflow：**
- 侧栏：标题 `写作工作流（实验阶段）` → `创作流程`，按钮 `开始工作流` → `开始创作流程`。
- 中区顶部：删除 action 按钮行，改为独立的 `[data-workflow-stage-actions]` 动态操作栏。
- 中区步骤：不再有静态引导 HTML，全部由 JS 动态渲染。
- 事件日志：改为 `<details>` 可折叠区域，默认展开，无事件时折叠。
- 中区标题：`Run` → `流程看板`。

### src/styles/desktop.css

**Workshop 新增/修改样式：**
- `.desktop-workshop-project-summary` — 侧栏项目摘要卡片，accent 边框和背景。
- `.desktop-workshop-empty-state` / `.desktop-workshop-empty-content` / `.desktop-workshop-empty-icon` — 空状态居中展示，带大图标和主按钮。
- `.desktop-workshop-message` — 改为 flex 横向布局，添加 avatar 圆形头像（`助`/`我`），区分用户和助手。
- `.desktop-workshop-message.is-selected` — 助手消息选中高亮，accent 边框和背景。
- `.desktop-workshop-output-panel` — 转化面板，accent 边框和背景，与普通操作栏视觉分离。
- `.desktop-workshop-convert-action` — 卡片式转化按钮，带图标/标签/提示三级信息。
- `.desktop-workshop-message-avatar` / `.desktop-workshop-message-body` / `.desktop-workshop-message-role` / `.desktop-workshop-message-text` — 消息布局子元素。

**Workflow 新增/修改样式：**
- `.desktop-workflow-main` — 网格行改为 `auto auto auto minmax(0, 1fr) auto`，增加对操作栏和可折叠事件的支持。
- `.desktop-workflow-stage-actions` — 当前步骤操作栏，accent 边框和背景，视觉上紧贴步骤卡片。
- `.desktop-workflow-step-card` — 步骤看板卡片，替代旧的 `.desktop-workflow-step`，带标题/状态/描述结构化信息。
- `.desktop-workflow-step-card.is-active` / `.is-done` / `.is-failed` / `.is-progress` — 步骤状态视觉反馈。
- `.desktop-workflow-step-card-header` / `.desktop-workflow-step-card-meta` / `.desktop-workflow-step-card-desc` — 卡片内容布局。
- `.desktop-workflow-artifacts-label` — 产物区标签。
- `.desktop-workflow-events-details` — 可折叠事件日志，默认可见但视觉权重降低。
- `.desktop-workflow-steps-guide` 空状态样式 — 支持无项目时居中展示引导。

### src/desktop/desktop-shell.js

**workshopElements()：** 新增 `projectSummary`、`projectName`、`projectStats`、`emptyState`、`emptyContent` 元素引用。

**renderWorkshop()：**
- 项目打开时渲染侧栏项目摘要（项目名、对话数、资料数、当前场景）。
- 空状态分三种引导：
  - 无项目 → "创作讨论空间" + 去书库按钮
  - 有项目无对话 → "创建第一场讨论" + 开始新对话按钮
  - 有对话未选择 → "选择对话" + 新建对话按钮
- 消息流：添加 avatar 圆形头像和选中高亮（`is-selected`），用户消息右对齐。
- 输出转化面板：始终在有助手消息时显示，按钮状态由 `selectedAssistantMessage()` 控制。

**workflowElements()：** 新增 `stageActions`、`eventsDetails`、`eventsSummary`、`eventsCount` 元素引用。

**renderWorkflow()：**
- 步骤看板卡片：结构化显示步骤序号、标题、状态（中文）和描述。
- 当前步骤操作栏：动态创建生成/批准/退回/采纳草稿/取消流程按钮，所有按钮保留 `data-workflow-*` 属性供测试使用。
- 产物区：只显示最新一条产物，添加"最新产物"标签。
- 事件日志：可折叠 `<details>`，无事件时自动折叠，显示事件计数。
- 无项目引导："创作流程看板" + 去书库按钮。

**bindWorkflow()：** 简化，只绑定静态的 `start` 按钮（侧栏），动态按钮在 `renderWorkflow()` 中直接绑定事件。

## 测试结果

| 测试 | 状态 |
|------|------|
| `npm run desktop-mainline-test` | passed |
| `npm run writer-audit` | passed |
| `npm run unit` | passed |

## 成功标准验证

- **Workshop 第一屏能看出如何开始讨论** — 无项目时显示"去书库打开项目"主按钮，无对话时显示"开始新对话"主按钮。
- **有助手输出时转化动作清晰可见** — 转化面板以 accent 边框和背景突出，三个卡片式按钮带图标和提示。
- **Workflow 第一眼能看出当前步骤、当前产物和下一步按钮** — 步骤看板卡片状态高亮，操作栏紧贴步骤区，产物区只显示最新一条。
- **事件日志降为次级** — 使用 `<details>` 可折叠区域，无事件时自动折叠。

## 视觉检查（Playwright 截图）

由于 Playwright 环境需本地浏览器，当前报告依赖自动化测试和代码审查。横向溢出检查基于：
- 所有布局容器使用 `min-width: 0` 和 `overflow: hidden/auto` 约束。
- 网格列使用 `minmax(0, 1fr)` 防止撑开。
- 无固定宽度超出父容器。

## 禁用操作确认

以下入口已通过 `desktop-mainline-test` 验证仍可访问：
- 对话发送、转资料、写摘要、插正文
- 工作流启动、生成、采纳、批准、退回、取消

## 未修改内容

- 未改变 workshop message schema
- 未改变 workflow run/step/artifact/event schema
- 未改变 provider 调用逻辑
- 未修改 `desktop/services/**`、`desktop/storage/**`、`src/core/**`
