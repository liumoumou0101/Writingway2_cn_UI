# Phase 37B Follow-up Codex 验收报告：笔记本小屏视觉修正

日期：2026-07-02

## 结论

通过，状态为 `success_after_codex_review`。

OpenCode 修复了视觉复核中发现的 37B 小屏硬问题：

- 书库左侧工作台增加小高度紧凑规则和内部滚动能力，1280x720 下维护入口不再被无反馈截断。
- 书库保存路径增加省略样式，并通过 `title` 保留完整路径信息。
- 资料库无项目状态隐藏搜索 / 筛选 / 新资料工具区，只保留明确空状态和引导。

## Codex 处理

- OpenCode 临时新增了 `tests/phase37b_visual_check.js` 作为 Playwright 验证脚本；该脚本不在任务允许文件范围内。Codex 已将其作为临时验收工具删除，只保留截图和报告。
- Codex 独立查看了 1280x720 关键截图，确认书库维护入口可见，资料库无项目状态不再显示半禁用工具区。

## 验证命令

- `npm run desktop-mainline-test`
- `npm run writer-audit`
- `git diff --check`

说明：一次 `writer-audit` 因并行测试占用 `127.0.0.1:8000` 失败；端口释放后单独重跑通过。

## 视觉检查

截图目录：

- `.ai_state/test_reports/phase37b_visual_check/`

检查视口：

- 1280x720
- 1366x768
- 1536x864

结果：

- 书库无横向溢出。
- 资料库无横向溢出。
- 书库维护入口在 1280x720 可见。
- 资料库无项目状态表单隐藏、工具区隐藏、空状态可见。

## 剩余观察

- 单本作品时，书库右侧项目卡仍显得偏窄，右侧空白较大。这个属于后续书库陈列体验优化，不阻塞本 follow-up。
- 设置页和 Workshop 的小屏问题仍待 37C / 37D 处理。
