# OpenCode 任务单：phase37D_recovery_settings_productization

## task_id

phase37D_recovery_settings_productization

## task_type

ui_productization

## objective

按 Codex 37A 设计规格重排恢复中心和设置页 UI，让恢复中心更有安全感，让设置页从大表单变成配置中心。不得修改备份恢复业务逻辑、Provider 调用逻辑或设置存储结构。

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
- `src/core/settings/**`
- `src/core/generation/**`
- `package.json`
- `release/**`

## scope

必须完成：

- 恢复中心无备份、未选择、已选择备份状态更清楚。
- 恢复操作分成安全操作和危险操作，替换原项目必须视觉降级并带明确危险区。
- 设置页分类导航增加配置状态感，减少长表单压迫感。
- API 配置组卡片显示厂商、模型、endpoint 简写、密钥状态、测试状态、是否可用于写作。
- 新建/编辑配置组区域不应让整页显得像数据库表单。

禁止：

- 改变备份恢复接口语义。
- 改变 settings schema。
- 泄露真实 API Key。
- 让不可用 Provider 在写作页伪装成可执行模型。

## test_plan

- `npm run desktop-mainline-test`
- `npm run writer-audit`
- `npm run unit`
- Playwright 截图检查恢复中心、设置页在 1366x768、1920x1080、2560x1440 下无横向溢出。

## success_criteria

- 恢复中心能清楚表达恢复范围和危险操作。
- 设置页能快速定位添加 API、测试配置、生成默认值、朗读设置。
- 配置组不会显示真实 API Key。
- 自动测试通过。
- 输出结构化报告到 `.ai_state/test_reports/phase37D_recovery_settings_productization_opencode_report.md`。

## failure_conditions

- 备份恢复按钮语义回归。
- Provider 保存、测试、配置组编辑、写作页模型选择回归。
- 泄露 API Key。
- 未运行要求测试。
