# OpenCode 任务单：phase37_desktop_ui_productization_design_ready

## task_id

phase37_desktop_ui_productization_design_ready

## task_type

ui_productization_implementation_after_codex_design

## 当前状态

ready_after_codex_design

## 背景

用户复核后明确指出：除了写作和阅读两个经过多轮打磨的模块，书库、资料库、Workshop、Workflow、恢复中心、设置页整体 UI 仍然别扭。问题不只是单个控件样式，而是页面结构、主操作层级、状态表达和模块联动语言不够成熟。

Codex 已将阶段 37 设计目标写入 `docs/DESKTOP_UI_TODOLIST.md`。OpenCode 后续不得自行改变产品方向，只能按 Codex 给出的阶段拆分执行。

## model_selection

- 推荐模型：deepseek-v4-pro
- reasoning：LOW
- 原因：主要是模块级 HTML/CSS/轻量 JS UI 实现，不涉及复杂根因推理。

## objective

在 Codex 后续给出更细的 37A/37B/37C/37D 子任务后，按子任务范围实现非写作 / 非阅读模块 UI 产品化，不改动核心业务逻辑和数据结构。

## files_allowed

按具体子任务决定，预计包括：

- `desktop.html`
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js`
- `tests/desktop-library.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/**`

## files_forbidden

除非具体子任务明确允许，否则禁止修改：

- `desktop/storage/**`
- `desktop/services/**`
- `src/core/generation/**`
- `src/core/context/**`
- `src/core/settings/**`
- 打包配置
- 项目数据迁移逻辑

## test_plan

每个实现子任务至少运行：

- `npm run desktop-mainline-test`
- 与修改模块相关的 Playwright / 审计测试
- 如触及写作上下文、资料库、设置、模型配置，则必须运行 `npm run writer-audit`
- 阶段收口时运行 `npm run unit`

## success_criteria

- 只修改子任务允许范围。
- 不改变现有数据、生成、备份、导入导出、模型调用业务行为。
- 视觉优化服务于明确模块目标，不做装饰性堆叠。
- 1366x768、1920x1080、2560x1440 下无横向溢出。
- 输出结构化执行报告。

## failure_conditions

- 修改业务逻辑或存储结构。
- 删除或隐藏现有功能入口。
- 未运行要求测试。
- 未输出结构化报告。
- 只做零散颜色/边距调整，没有改善页面结构和操作层级。
