# OpenCode 任务单：phase37B_followup_laptop_visual_fixes

## task_id

phase37B_followup_laptop_visual_fixes

## task_type

ui_followup_laptop_visual_fix

## objective

根据 Codex 视觉复核报告修正 37B 在笔记本小屏下的视觉问题。范围只限书库和资料库的小屏视觉收口，不改变业务逻辑、数据结构、导入导出、资料保存或上下文注入规则。

参考：

- `.ai_state/test_reports/phase37_visual_recheck_2026-07-02.md`
- `docs/DESKTOP_UI_PHASE37A_PRODUCTIZATION_SPEC.md`
- `docs/DESKTOP_UI_TODOLIST.md`

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

1. 书库左侧工作台在 1280x720 和 1366x768 下不再截断维护区按钮。
   - 可以压缩间距、降低按钮高度、让左侧成为内部滚动区、或把维护入口改为更紧凑的次级行。
   - 不得删除“刷新书库”“打开项目目录”入口。
2. 书库保存路径文本在窄屏下使用省略或折行策略，不再显得硬挤。
   - 保留完整路径信息的可访问性，例如 `title`。
3. 资料库未打开项目 / 未选择资料的空状态继续隐藏 disabled 表单，并更明确地引导去书库打开项目或新建资料。
   - 未打开项目时不要显示一整页可操作但实际禁用的表单。
   - 资料库侧栏在无项目状态下应更紧凑，不要像“筛选表单 + 大空白”。

禁止：

- 删除任何现有按钮入口。
- 改变项目或资料 API。
- 改变资料注入策略保存逻辑。
- 触碰写作页核心生成逻辑。

## test_plan

必须运行：

- `npm run desktop-mainline-test`
- `npm run writer-audit`

必须做 Playwright 视觉检查：

- 书库、资料库
- 1280x720
- 1366x768
- 1536x864

检查：

- 无横向溢出。
- 书库维护区入口可见或可通过内部滚动访问，不被无反馈截断。
- 资料库空状态下表单不可见。

## success_criteria

- 小屏书库首屏不再出现维护按钮被裁切的尴尬状态。
- 保存路径视觉更克制。
- 资料库无项目状态更像明确空状态，而不是半禁用工作台。
- 自动测试通过。
- 输出结构化报告到 `.ai_state/test_reports/phase37B_followup_laptop_visual_fixes_opencode_report.md`。

## failure_conditions

- 维护按钮入口丢失。
- 资料库表单在无项目 / 未选择资料时再次可见。
- 测试未运行。
- 只改颜色，没有解决小屏高度问题。
