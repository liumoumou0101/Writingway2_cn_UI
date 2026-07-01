# OpenCode Task: phase29_desktop_ui_structure_second_pass

## task_id

phase29_desktop_ui_structure_second_pass

## task_type

desktop_ui_structure_polish

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: LOW

## objective

在阶段 28 已完成的控件统一基础上，继续优化桌面版常用模块的页面结构和操作组织。目标是让书库、设置、工作流、恢复、阅读页更像成熟桌面软件，而不是调试面板或工程后台。

本任务只做 UI 结构、DOM 组织、CSS 和必要的轻量交互调整。不得改变业务逻辑、数据结构、AI provider 调用、上下文解析、备份恢复语义、工作流执行语义。

## files_allowed

- `desktop.html`
- `src/styles/desktop.css`
- `src/desktop/desktop-shell.js`
- `tests/writer-button-audit.js`（仅当稳定选择器或可见结构变化导致现有测试需要同步时）
- `tests/desktop-mainline-test.js`（仅当稳定选择器或可见结构变化导致现有测试需要同步时）
- `.ai_state/execution_log.md`（追加执行摘要）
- `.ai_state/test_reports/phase29_desktop_ui_structure_second_pass_opencode_report.md`

## files_forbidden

- `src/main/**`
- `src/preload/**`
- `src/providers/**`
- `src/services/**`
- `src/context/**`
- `src/workflow/**`
- `src/storage/**`
- `scripts/**`
- `release/**`
- package metadata and lockfiles
- any Git history operation

## required_changes

1. 书库项目卡片动作收口
   - 减少每张项目卡片上直接暴露的按钮数量。
   - 保留主操作入口，例如编辑信息 / 打开 / 继续写作等现有主路径。
   - 将低频或危险动作（定位文件、复制路径、导出包、备份、移出书库）放入“更多”区域、折叠区或菜单式区域。
   - 危险动作必须在视觉层级上和普通动作区分开。
   - 不得破坏现有项目打开、选择、编辑、备份、导出、删除行为。

2. 设置页分类导航
   - 将 Provider、生成默认值、朗读、兼容/路径类设置做成清晰分组。
   - 可以增加紧凑的分类导航、分段按钮、左侧锚点或页内 sticky 分类条。
   - 不要求实现复杂滚动监听，但用户应能快速定位主要设置区。
   - 不得隐藏关键设置，除非隐藏/展开状态足够明显且默认可发现。

3. 工作流页步骤可视化
   - 空运行状态下也要展示“下一步该做什么”的步骤感。
   - 有运行记录时，步骤、产物、事件的层级应更清晰。
   - 可以添加静态步骤条、时间线、空状态引导或分组标题。
   - 不得改变工作流执行接口、状态机、产物格式。

4. 恢复页详情区优化
   - 空状态应更像产品空状态，而不是空白报错页。
   - 有备份时，左侧列表、右侧预览/差异/恢复动作之间的关系要更明确。
   - 恢复按钮在不可用时仍须保持 disabled 语义。
   - 不得改变备份扫描、恢复、diff 的实际逻辑。

5. 阅读页导入和阅读设置区继续精修
   - 优化文件选择、导入说明、字号、行距、版心宽度、段落间距等控件的分组和可扫描性。
   - 保持阅读正文区域稳定，不要让设置变化造成明显布局跳动。

## test_plan

按顺序执行：

1. `npm run writer-audit`
2. `npm run desktop-mainline-test`
3. `npm run unit`

如修改了测试选择器，必须说明原因，并确认修改只适配 UI 结构，没有降低断言强度。

## visual_checks

请用本地可行方式检查或说明：

- 1366x768 下主要页面无横向溢出。
- 1920x1080 下主要内容不过度挤在左侧，也没有明显失衡的大空白。
- 书库卡片动作不再像按钮堆叠。
- 设置页能快速看出 Provider、生成、朗读等设置分类。
- 工作流页无运行记录时不空洞。
- 恢复页无备份时状态清楚；有备份时列表和详情关系清楚。
- 阅读页导入和设置控件更像统一工具面板。

## success_criteria

- 所有 required_changes 完成。
- 允许的测试全部通过。
- 改动范围只在 files_allowed 内。
- 没有新增业务逻辑、数据迁移、provider 改动或危险文件操作。
- 输出结构化 OpenCode 报告，包含强制字段。

## failure_conditions

- 任一必需测试失败。
- 修改了 files_forbidden 中的文件。
- 改变生成、上下文、备份恢复、工作流执行等业务语义。
- UI 看起来更拥挤或出现明显重叠/横向溢出。
- 没有输出结构化报告。

## required_report_format

请输出并保存报告到 `.ai_state/test_reports/phase29_desktop_ui_structure_second_pass_opencode_report.md`：

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
