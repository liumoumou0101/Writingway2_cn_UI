# OpenCode 任务单：phase37B_bookshelf_compendium_productization

## task_id

phase37B_bookshelf_compendium_productization

## task_type

ui_productization

## objective

按 Codex 37A 设计规格重排书库和资料库 UI，让书库更像作品入口、资料库更像写作上下文控制台。不得修改核心业务逻辑、数据结构、导入导出语义或上下文解析规则。

设计依据：

- `docs/DESKTOP_UI_PHASE37A_PRODUCTIZATION_SPEC.md`
- `docs/DESKTOP_UI_TODOLIST.md` 阶段 37

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

- `desktop/storage/**`
- `desktop/services/**`
- `src/core/**`
- `package.json`
- `release/**`

## scope

必须完成：

- 书库左侧重新组织为“创作入口 / 导入迁移 / 维护”三块。
- 书库无项目状态变成可执行空状态，至少提供新建作品和导入入口。
- 项目卡保持“继续写作”为主操作，编辑/更多/危险操作层级更清楚。
- 资料库无项目和未选择资料时隐藏或弱化 disabled 大表单，显示明确空状态。
- 资料库编辑区区分“资料内容”和“写作上下文 / 注入策略 / 人物约束”。
- 注入策略 badge、触发条件、人物字段视觉层级更清楚。

禁止：

- 删除任何现有功能入口。
- 改变项目数据、资料数据、上下文注入逻辑。
- 引入新的业务存储字段。

## test_plan

- `npm run desktop-mainline-test`
- `npm run writer-audit`
- Playwright 截图检查书库、资料库在 1366x768、1920x1080、2560x1440 下无横向溢出。

## success_criteria

- 书库和资料库第一屏主操作清楚。
- 资料库不再像一整页 disabled 表单。
- 危险操作与普通操作视觉分离。
- 现有自动测试通过。
- 输出结构化报告到 `.ai_state/test_reports/phase37B_bookshelf_compendium_productization_opencode_report.md`。

## failure_conditions

- 功能入口丢失。
- 资料保存、注入策略、人物字段回归。
- 未运行要求测试。
- 只做颜色/间距微调，未改善结构。
