# Phase 37C Codex 验收报告：Workshop + Workflow 产品化

日期：2026-07-02

## 结论

通过，状态为 `success_after_codex_followup`。

OpenCode 完成了 Workshop 和 Workflow 的产品化重排。Codex 验收时发现两个展示状态问题并直接修复：

- Workshop 无项目空状态已经出现，但底部输入区仍显示，造成“未打开项目但像能发送”的假可用感。已改为未选中对话时隐藏输入区。
- Workflow 无运行时仍显示空产物容器，像未加载区域。已改为无产物时隐藏产物区，并补充 `[hidden]` CSS。

## 验收范围

- Workshop：无项目 / 无对话 / 未选择 / 有助手输出状态，消息视觉区分，输出转化面板。
- Workflow：无项目引导，步骤看板，动态操作栏，最新产物区，折叠事件日志。

## 验证命令

- `node -c src\desktop\desktop-shell.js`
- `npm run desktop-mainline-test`
- `npm run writer-audit`

OpenCode 额外运行并通过：

- `npm run unit`

## 视觉检查

截图目录：

- `.ai_state/test_reports/phase37C_visual_check/`

检查视口：

- 1280x720
- 1366x768
- 1536x864
- 1920x1080
- 2560x1440

结果：

- Workshop / Workflow 均无横向溢出。
- Workshop 无项目状态下输入区已隐藏，只保留明确引导。
- Workflow 无项目状态下空产物区已隐藏，只保留流程看板引导。

## 剩余观察

- Workshop 左侧“新对话”在未打开项目时仍显示为 disabled；可接受，但后续可以进一步弱化，避免用户误以为只是按钮失效。
- Workflow 左侧 Brief 和开始按钮在未打开项目时仍可见但禁用，后续 37D/全局状态规范阶段可统一处理“无项目时隐藏依赖项目的表单”。
