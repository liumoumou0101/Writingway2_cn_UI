# Phase 37B Codex 验收报告：书库 + 资料库 UI 产品化

日期：2026-07-02

## 结论

通过，状态为 `success_after_codex_followup`。

OpenCode 完成了书库和资料库第一轮产品化改造，并输出报告。Codex 验收时发现两个 UI 问题并已兜底修复：

- 资料库空状态出现后，disabled 表单仍然显示。原因是 `.desktop-compendium-editor form { display: grid }` 覆盖了 HTML `hidden` 默认行为。已增加 `.desktop-compendium-editor form[hidden] { display: none; }`。
- 带上下文条的页面顶部出现大面积空白。原因是 `.desktop-main` 网格只有两行，但 DOM 中存在 topbar、context strip、view 三个直接子元素，context strip 占用了 `1fr` 行。已改为 `grid-template-rows: auto auto minmax(0, 1fr)`。

## 验收范围

- 书库：左侧入口分组、无项目空状态、主操作层级。
- 资料库：无项目 / 未选择资料空状态、资料内容与上下文注入分区、注入 badge、触发条件、人物约束字段。
- 全局影响：context strip 网格行修复。

## 验证命令

- `node -c src\desktop\desktop-shell.js`
- `npm run desktop-mainline-test`
- `npm run writer-audit`

## 视觉检查

截图目录：

- `.ai_state/test_reports/phase37B_visual_check/`

检查视口：

- 1366x768
- 1920x1080
- 2560x1440

结果：

- 书库无横向溢出。
- 资料库无横向溢出。
- 资料库无项目状态不再显示 disabled 表单。
- context strip 不再占据大半屏。

## 剩余观察

- 书库左侧保存路径在窄屏上仍偏长，当前不阻塞 37B 验收；后续可在全局细节阶段统一做路径折行 / 省略策略。
- 资料库无项目状态已经可接受，但有项目、有资料卡时还需要人工审美复核；自动审计已覆盖功能不退化。
