# Codex Review: phase29_desktop_ui_structure_second_pass

日期：2026-07-01

## 结论

状态：success_after_followups

阶段 29 桌面 UI 第二轮结构收口已通过 Codex 验收。主任务由 OpenCode 完成，Codex 发现两个回归风险后拆成小 follow-up 交给 OpenCode 修复：

- `phase29_fix_project_more_toggle_label`：修复书库项目卡“更多/收起”文案反转。
- `phase29_fix_workflow_step_card_css`：修复工作流 run/step 卡片基础样式丢失风险。

## 验收依据

OpenCode 报告：

- `.ai_state/test_reports/phase29_desktop_ui_structure_second_pass_opencode_report.md`
- `.ai_state/test_reports/phase29_fix_project_more_toggle_label_opencode_report.md`
- `.ai_state/test_reports/phase29_fix_workflow_step_card_css_opencode_report.md`

Codex 独立测试：

- `npm run writer-audit`：通过
- `npm run desktop-mainline-test`：通过
- `npm run unit`：通过

Codex 独立视觉/行为检查：

- 1366x768：书库、设置、工作流、恢复、阅读页无横向溢出。
- 1920x1080：书库、设置、工作流、恢复、阅读页无横向溢出。
- 书库项目卡初始显示“更多”，展开后显示“收起”，折叠区内“复制路径”可用。
- 设置分类导航可切换 active，Provider / 生成默认值 / 朗读区可定位。
- 工作流空状态显示 4 步指引，指引卡片保留边框、背景、padding。
- 恢复页无备份/未选择备份时显示产品化空状态，恢复动作保持 disabled。
- 阅读页导入、显示、进度分组可见，控件没有明显重叠。

## 范围审查

产品代码修改集中在：

- `desktop.html`
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js`

测试适配：

- `tests/desktop-library.js` 增加一行：先展开项目卡“更多”折叠区，再点击“复制路径”。断言强度未降低，仍验证复制路径结果。

文档/状态文件：

- `docs/DESKTOP_UI_TODOLIST.md` 已改为中文并更新阶段 29 完成状态。
- `.ai_state/opencode_tasks/*` 记录本轮任务拆解。
- `.ai_state/execution_log.md` 记录任务和 follow-up。

未发现 provider、存储、上下文、工作流执行、备份恢复语义被改动。

## 残余建议

- 后续可为书库“更多”折叠区补点击外部关闭和键盘可访问性。
- 设置页可进一步加入滚动联动高亮和兼容/路径设置入口。
- 2K / 笔记本双屏适配建议在人工测试后再做第三轮细修。
