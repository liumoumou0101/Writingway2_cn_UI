# Writingway 干净重构与重写 TODO

最后更新：2026-06-29

这份清单用于跟踪桌面版干净重构进度和下一轮重写计划。当前大部分功能性重写已经完成，工作重心已经从“补齐旧功能”转向“打磨核心写作体验”。小说半自动/自动工作流仍然是系统里最复杂的长期能力，目前只保留最小闭环和基础能力；复杂编排、批量生成、分支回滚和高自动化设计应等写作页、资料库、提示词、上下文和恢复体验稳定后再继续。

## 当前完成度判断

- 地基重构：约 98% 完成。
- 完整桌面产品替换旧 Web/iframe：约 94% 完成；日常新建、打开、写作、生成、阅读、备份、恢复、导入导出已经基本走桌面主线，旧 `main.html`/`src/app.js` 继续作为兼容和参考入口。
- 原软件核心能力重写：约 98% 完成；设置、资料库、上下文/提示词、workshop、导入导出、原生写作页核心功能和最小半自动工作流均已完成原生重写，剩余主要是写作页体验、人工发布验收、查找替换细节、编辑器偏好、导出选项和 TTS 设置。
- 半自动小说工作流：最小真实闭环和 draft 采纳/取消能力已完成；复杂编排、批量连续生成、分支回滚和更高自动化程度明确后置。
- 当前最高优先级：原生写作页体验重做。目标不是继续复刻旧 Web UI，而是把写作页打磨成真正适合长期写作的桌面工作台。

## 后续重写原则

- 不逐项照搬旧软件功能；旧项目只作为参考实现。
- 新功能优先落在 `desktop.html`、`src/desktop/`、`desktop/services/`、`desktop/storage/`、`src/core/`。
- 对旧功能按价值筛选：必须支撑写作闭环的重写，理解成本高但价值明确的重做，重复或不直观的旧入口弱化或归档。
- 小说半自动工作流最后做，前置的设置、资料库、提示词、上下文、生成和恢复能力必须先稳定。
- 详细取舍见 `docs/FEATURE_REWRITE_PLAN.md`。

## Codex / OpenCode 执行规则

- Codex 负责阶段判断、任务拆解、模型选择、验收和失败重规划。
- OpenCode 负责产品代码修改、测试执行、日志收集和结构化执行报告。
- DeepSeek V4 Pro 只作为 OpenCode 的生成层，不做架构决策。
- 所有会修改产品代码、测试、样式或构建配置的任务，必须先在 `.ai_state/opencode_tasks/` 生成 OpenCode 任务单。
- 如果当前环境没有可调用的 OpenCode 工具，Codex 只生成任务单并标记为 `ready_for_opencode` 或 `blocked_waiting_for_opencode_execution`，不默认接管实现。
- Codex 只有在用户明确授权直接实现，或同一 OpenCode 任务连续失败两次后，才接管具体代码实现。
- 文档、计划、状态记录和验收记录可由 Codex 直接更新。
- 当前工作区已验证可通过本地 `opencode` CLI 桥接执行层；详见 `.ai_state/opencode_bridge.md`。

## 已完成：阶段 0 - 边界确认

- [x] 将 `main.html` 和 `src/app.js` 视为旧写作器/参考实现。
- [x] 在 `docs/NEW_ARCHITECTURE.md` 记录新架构方向。
- [x] 在 `docs/DATA_MODEL.md` 记录新数据模型。
- [x] 明确旧 JSON snapshot 降级为兼容读取/导入/备份格式，不再作为新项目创建和保存的主格式。

## 已完成：阶段 1 - 纯核心模型

- [x] 新增项目、章节、场景工厂函数。
- [x] 新增项目数据规范化逻辑。
- [x] 新增中英文混合字数统计。
- [x] 新增章节/场景排序工具。
- [x] 新增稿件组装器。
- [x] 新增阅读器文档转换。
- [x] 新增工作流占位 schema。
- [x] 新增核心模型测试。

## 已完成：阶段 2 - 桌面项目存储

- [x] 新增原子写入工具。
- [x] 新增作品库路径工具。
- [x] 新增项目目录读写 store。
- [x] 新增项目 service 封装。
- [x] 让 `/api/list-projects` 同时列出旧 JSON 快照和新项目目录。
- [x] 让 `/api/get-project` 将新项目目录转换成旧 writer/reader 可用的 snapshot。
- [x] 让 `/api/create-project` 创建新项目目录格式。
- [x] 让 `/api/update-project-metadata` 编辑新项目目录。
- [x] 让 `/api/remove-project-from-library` 将新项目目录移到 `.removed-projects`。
- [x] 让 `/api/reveal-project-file` 定位新项目目录。
- [x] 将磁盘保存从旧单文件 JSON 快照迁移到新项目目录格式。

## 已完成：阶段 3 - 桌面界面迁移 MVP

- [x] 调整书架 UI，使项目目录和旧快照的显示/操作更清晰。
- [x] 新增基于 project service 的原生项目编辑器 MVP。
- [x] 原生项目编辑器支持章节/场景列表、正文编辑、保存到新项目目录。
- [x] 原生项目编辑器支持新增章节、新增场景、重命名场景、删除场景。
- [x] 新增基于 `src/core/document/reader-document.js` 的原生阅读器集成。
- [x] 重做原生恢复/备份页面 MVP：本地备份列表 + 旧恢复入口。

## 已完成：阶段 4 - 生成基础层

- [x] 拆分 prompt 构建和 provider 客户端。
- [x] 新增结构化 generation request/result 契约。
- [x] 统一 provider 错误类型。
- [x] 将 prompt/result 历史从 UI 状态中移出。
- [x] 旧 `window.Generation.buildPrompt` 已委托给核心 prompt builder。

## 已完成：阶段 5 - 工作流占位

- [x] 新增工作流 run 占位 schema。
- [x] 添加最小持久化挂钩：`workflows/runs.json` 和 `workflows/runs/*.events.jsonl`。
- [x] 在核心编辑、阅读、备份、生成基础稳定前，不实现真正的半自动小说工作流。

## 已完成：阶段 6 - 旧代码边界与清理

- [x] 新增 `docs/LEGACY_BOUNDARY.md`，明确旧 iframe writer 还负责哪些功能。
- [x] 标注旧 `src/app.js` 中仍被依赖的能力：生成 UI、AI 设置、复杂备份恢复、提示词编辑等。
- [x] 标注未加载或重复的旧模块：真实旧适配层是 `src/generation.js`，历史占位 `src/modules/generation.js` 已在阶段 17 删除。
- [x] 将旧 UI 测试分为 `legacy-ui-test` 和 `desktop-mainline-test` 两组，避免测试目标混淆。
- [x] 给 `main.html` 入口加醒目标注：仅兼容/迁移用途，不再承载新主线功能。
- [x] 修复默认 `npm test` 链路，使 smoke、unit、desktop mainline、legacy UI 分组可以顺序通过。

## 已完成：阶段 7 - 原生编辑器产品化

- [x] 支持章节重命名。
- [x] 支持章节删除，并处理章内场景删除确认。
- [x] 支持场景拖拽排序和上/下移动。
- [x] 支持章节拖拽排序。
- [x] 支持场景摘要、标签、POV、时态等元数据编辑，并纳入项目目录数据模型。
- [x] 支持自动保存和保存状态恢复。
- [x] 支持未保存变更提示。
- [x] 支持编辑器快捷键：保存、新建场景、切换场景。
- [x] 支持查找/替换。
- [x] 支持按章节/场景导出 Markdown/TXT。

## 已完成：阶段 8 - 原生生成界面迁移

- [x] 在桌面原生 writer 中新增 beat 输入区。
- [x] 将生成按钮接入 `src/core/generation` 契约。
- [x] 将 provider streaming 逻辑迁入独立 `src/core/generation/provider-stream.js` adapter。
- [x] 支持生成中取消。
- [x] 支持接受、重试、丢弃生成结果。
- [x] 支持 reasoning 展示入口。
- [x] 支持 prompt 预览。
- [x] 支持 generation history 原生列表。
- [x] 支持按项目/场景存储生成记录，而不是依赖旧 IndexedDB UI 状态。

## 已完成：阶段 9 - 原生备份与恢复

- [x] 将备份列表从 MVP 升级为可筛选、可搜索、可按项目分组。
- [x] 支持备份预览。
- [x] 支持单场景恢复。
- [x] 支持整项目恢复。
- [x] 支持恢复为新项目。
- [x] 支持恢复前自动创建快照。
- [x] 支持正文 diff 预览。
- [x] 将旧恢复 modal 降级为兼容入口；桌面主线恢复流程已使用原生页面。

## 已完成：阶段 10 - 半自动小说工作流占位准备

- [x] 完成工作流占位设计文档：模板、步骤、人工确认点、回滚策略边界。
- [x] 定义 `WorkflowTemplate`、`WorkflowStep`、`WorkflowArtifact` 的最小 schema。
- [x] 定义工作流事件日志格式。
- [x] 定义工作流运行前快照字段策略。
- [x] 定义每一步 prompt/result 未来如何复用 generation core。
- [x] 先实现一个最小模板：项目设定 -> 章节大纲 -> 场景草稿 -> 人工确认。
- [x] 严格避免一开始做全自动长篇生成；当前只保留占位契约，不实现复杂编排引擎。

## 已完成：阶段 11 - 发布和维护质量

- [x] 整理测试脚本，避免多个测试抢占 `127.0.0.1:8000`。
- [x] 增加 `desktop-mainline-test`，只测新桌面主线。
- [x] 打包验证 portable/installer。
- [x] 检查 `asar` 是否可以启用；当前结论是继续保持关闭，并在正式启用前增加端到端 asar 验证。
- [x] 更新 README：桌面主线、测试分组、旧版兼容说明。
- [x] 更新 SESSION_HANDOFF，记录当前重构进度。

## 已完成：阶段 12 - 原生设置和 Provider 配置

- [x] 梳理旧 AI 设置页中真正需要保留的配置项，删除重复和不直观入口。
- [x] 定义 `ProviderSettings`、`GenerationDefaults`、`LocalModelSettings` 的 schema。
- [x] 新增桌面 settings storage/service，避免原生生成继续依赖旧 Alpine 状态。
- [x] 在原生设置页实现 provider 切换、API key、endpoint、model、默认参数编辑。
- [x] 实现 provider 配置检查 API，并给出可诊断错误。
- [x] 让原生生成面板读取新 settings service。
- [x] 保留旧 AI 设置页为兼容入口，但不再作为新主线配置中心。
- [x] 增加 settings/provider 的单元测试和桌面主线测试。

## 已完成：阶段 13 - 原生资料库 / 世界观

- [x] 定义资料条目 schema：角色、地点、组织、物品、设定、时间线、笔记。
- [x] 将资料库存入项目目录，而不是旧 IndexedDB。
- [x] 实现资料库 storage/service。
- [x] 实现原生资料库 UI：列表、搜索、类型筛选、编辑、删除。
- [x] 支持资料条目标签、别名、摘要、正文和“默认加入上下文”标记。
- [x] 实现旧 compendium 导入适配：旧 snapshot compendium 会被规范化进新项目目录。
- [x] 增加资料库核心/API 和桌面 UI 测试。
- [x] 和生成上下文的深度联动留到阶段 14，通过 `ContextResolver` 统一实现，避免在资料库阶段硬塞临时逻辑。

## 已完成：阶段 14 - 上下文和提示词系统

- [x] 定义 `PromptTemplate` schema：写作、改写、总结、workshop、工作流步骤。
- [x] 定义 `ContextSelection` 和 `ContextResolver` core。
- [x] 支持从当前项目、章节、场景、资料库、手动选择项构建上下文。
- [x] 增加 context budget，避免 prompt 长度不可控。
- [x] 实现原生 prompt 管理 UI。
- [x] 所有原生生成入口统一走 prompt/context core。
- [x] 保留 prompt preview，并确保最终请求可审计。
- [x] 增加 prompt/context 单元测试、prompt API 测试和桌面主线测试。

## 已完成：阶段 15 - 原生 Workshop / 创作对话

- [x] 定义 workshop session/message schema。
- [x] 将 workshop 对话按项目存入项目目录。
- [x] 实现原生 workshop UI。
- [x] 支持通过 `@[资料]` 和 `#[场景]` 引用项目上下文。
- [x] 复用 provider settings、prompt/context core 和 provider streaming。
- [x] 支持对话输出转资料库条目、场景摘要或正文片段。
- [x] 保留旧 workshop 作为兼容入口，新主线不再依赖旧 iframe workshop。
- [x] 增加 workshop 存储/API 和桌面 UI 测试。

## 已完成：阶段 16 - 导入导出和兼容收束

- [x] 完善旧 JSON snapshot 导入到新项目目录。
- [x] 将 Writingway 1 导入器接入新项目目录。
- [x] 实现项目目录打包导出和导入。
- [x] 提升 Markdown/TXT 导出质量，改为从项目目录服务端导出最新稿件。
- [x] 明确旧 IndexedDB 项目迁移路径：旧 writer 继续作为兼容入口，主线通过 snapshot/import API 迁移进项目目录。
- [x] 评估 GitHub Gist 备份：保留旧兼容实现，未来如需要再作为独立扩展重写，不进入当前本地主线。
- [x] 减少旧 snapshot 在新主线中的必要性：snapshot 只作为导入/兼容载体，项目包和目录项目是迁移主路径。
- [x] 增加迁移和导入导出测试。

## 已完成：阶段 17 - 旧 iframe 退出准备

- [x] 列出旧 iframe 仍独有的功能。
- [x] 对已迁移功能移除旧入口依赖：项目打开、新建、设置、备份入口不再默认进入旧 iframe。
- [x] 清理未加载或重复模块：删除历史占位的旧生成模块 `src/modules/generation.js`。
- [x] 将 legacy tests 缩小为兼容测试，而不是主线功能测试；桌面主线测试确认打开项目不会加载旧 iframe。
- [x] 更新 `docs/LEGACY_BOUNDARY.md`，标注可删除、需保留、需迁移的旧模块。
- [x] 确认 `main.html` 只作为迁移参考和按需兼容工具。

## 已完成：阶段 18 - 正式半自动小说工作流

- [x] 在阶段 12 到 17 完成后，重新审阅 `docs/WORKFLOW_PLACEHOLDER.md`。
- [x] 设计正式 workflow engine：模板、步骤、人工确认、暂停/恢复、事件日志、失败恢复。
- [x] 将运行前快照接入原生备份/恢复。
- [x] 将每个步骤接入 prompt/context core 和 generation history。
- [x] 实现最小真实工作流：项目设定 -> 章节大纲 -> 场景草稿 -> 人工确认 -> 写入项目。
- [x] 增加可视化运行状态和逐步确认 UI。
- [x] 增加 workflow engine 单元测试、恢复测试和端到端测试。

## 已完成：阶段 19 - 工作流后续增强和最终收口

- [x] 为工作流补上 draft artifact 局部采纳：可在最终确认前把草稿写入项目，但不结束 run。
- [x] 为工作流补上取消运行能力：run/step 状态进入 `cancelled`，并写入 `run_cancelled` 事件。
- [x] 为 artifact 采纳补上审计事件：`artifact_applied` 会记录 artifact 与写入 scene。
- [x] 桌面工作流 UI 增加“采纳草稿”和“取消运行”入口，终态 run 自动禁用后续操作。
- [x] 修正原生编辑器刷新项目时不优先选择 `currentSceneId` 的问题，避免工作流写入后 UI 看不到当前场景。
- [x] 增加 workflow service/API 和桌面主线测试。

## 已完成：阶段 20 - 打包、边界和发布前审计

- [x] 复测 `npm run unit`、`npm run desktop-mainline-test`、`npm test`、`npm run backup-test`。
- [x] 复测 `npm run pack` 和 `npm run dist`，确认 Windows unpacked、installer、portable 产物都能生成。
- [x] 增加 `tests/release-config.js`，固化 Electron 主入口、打包文件清单、asar 决策和兼容 writer 边界。
- [x] 修正发布依赖边界：`jszip` 是项目包导入/导出的运行时依赖，已从 dev-only 提升到 `dependencies`。
- [x] 检查 `release/win-unpacked/resources/app`：`desktop.html`、`main.html`、`desktop/main.js`、`node_modules/jszip` 均存在。
- [x] asar 继续保持关闭；当前本地 HTTP server 仍按普通目录读取前端资源，启用 asar 前需要专门端到端验证。
- [x] 旧 `main.html` 仍需留在打包主路径中，但边界明确：只作为显式“兼容写作器”和 legacy 测试目标，不承载新桌面主线。

## 已完成：阶段 21 - 打包产物自动验收基础

- [x] `desktop/main.js` 支持 `WRITINGWAY_DATA_ROOT`，用于打包产物验收时隔离真实用户数据。
- [x] 增加 `tests/packaged-smoke.js`：启动 `release/win-unpacked/Writingway.exe`，等待本地服务可用。
- [x] packaged smoke 会验证临时数据根、生效的项目库路径、创建项目、保存正文、重新读取正文。
- [x] packaged smoke 会创建备份并确认备份列表可见。
- [x] 增加 `npm run packaged-smoke`，该脚本不进入默认 `npm test`，因为它依赖先存在打包产物。
- [x] 已运行 `npm run pack` 和 `npm run packaged-smoke`。

## 阶段 22 - 剩余人工发布验收

- [ ] 启动 portable exe，确认不会和开发服务器端口冲突。
- [ ] 运行 installer，确认可选择安装目录并能正常启动。
- [ ] 人工确认桌面主页、书库、编辑器、阅读器、恢复中心视觉和交互没有明显问题。
- [ ] 做一次真实项目持久化检查：新建项目 -> 写正文 -> 关闭 -> 重开 -> 书库和阅读器仍正确。
- [ ] 做一次真实备份恢复检查：创建备份 -> 预览 -> 恢复为新项目。
- [ ] 在人工验收完成后，再开始复杂小说工作流的正式设计阶段。

## 阶段 23 - 原生写作页体验重做

- [x] 按 `docs/WRITER_REDESIGN_PLAN.md` 启动写作页信息架构重做。
- [x] 第一版完成：三栏布局、正文区优先、右侧辅助面板、主导航/结构栏/辅助栏隐藏、专注模式、生成采纳方式。
- [x] 增加 `docs/WRITER_FEATURE_AUDIT.md`，列出原生写作页已实现、部分实现和未实现的旧功能。
- [x] 增加 `npm run writer-audit`，专项测试写作页按钮。
- [x] 保留章节/场景管理、元数据、查找替换、导出、生成、改写、历史、兼容写作器等高价值能力。
- [x] 补齐旧写作器中的核心写作能力：改写预设、选区重生成、特殊符号、场景/章节摘要生成、手动上下文选择、人物卡快捷创建、朗读、历史复用/写入/删除。
- [x] 将导出扩展到 Markdown、TXT、HTML、EPUB 和项目包。
- [x] 支持生成结果插入光标、替换选区、追加末尾。
- [x] 更新 desktop writer 测试，`npm run writer-audit` 覆盖新建章节/场景、隐藏栏、专注、辅助布局、摘要生成、导出、搜索替换、特殊符号、朗读、正文生成、改写、选区重生成、人物卡、上下文选择、Prompt 管理、历史复用/写入/删除、保存、删除场景。
- [x] 推进 W2：场景标题内联编辑、编辑器字号/行距/正文宽度偏好。
- [x] 复盘流程偏差：该 W2 切片由 Codex 直接实现，未先生成 OpenCode 任务单；已记录为流程违规并补充 retrospective 任务文档。
- [x] 通过 OpenCode 闭环完成 W2：段落间距偏好、保存状态细化，并由 Codex 复审修复了 CSS/test gap。
- [x] 通过 OpenCode 闭环将生成和改写整理为更清晰的任务入口：续写、beat 生成、场景摘要、润色、扩写、精炼、风格改写。
- [x] 通过 OpenCode 闭环强化资料库与当前场景的轻量联动：上下文面板会汇总当前将引用的资料、标签、章节和场景。
- [x] 更新用户验收清单，让手工验收覆盖当前原生写作页而不是旧 iframe。
- [ ] 后续阶段 23 代码任务必须由 OpenCode 执行，Codex 只负责先写任务单和最终验收。

## 阶段 24 - 原生写作页第二轮体验打磨（当前优先级）

目标：在已补齐旧写作核心功能的基础上，重新整理信息架构和交互密度，让写作页成为安静、稳定、可长期使用的桌面写作工作台。

- [ ] 重新评估当前写作页视觉密度：正文编辑区是否足够突出，右侧辅助面板是否过挤，笔记本屏幕下是否可长期使用。
- [x] 优先优化编辑器本体第一步：场景标题可内联编辑，字号/行距/正文宽度可调并持久化到本机偏好。
- [x] OpenCode 任务 `phase23_w2_save_status_paragraph_spacing`：继续优化编辑器本体，包括段落间距、保存状态细化。
- [x] OpenCode follow-up `phase23_w2_fix_paragraph_spacing_css`：修复段距 CSS 和测试覆盖缺口。
- [ ] 后续任务必须先创建或更新 `.ai_state/opencode_tasks/*.md`，再交 OpenCode 执行并产出报告。
- [ ] Codex 根据 OpenCode 报告审查 diff、日志和测试结果，再决定 success / partial / failed。
- [ ] 继续优化编辑器本体：字体选择、字数目标、保存状态细化。
- [x] 通过 OpenCode 闭环优化查找替换第一步：匹配数量、上一处/下一处、当前匹配定位和替换当前。
- [x] 优化生成/改写面板第一步：减少表单感，按写作任务组织入口，保留 Prompt 预览但不打断主流程。
- [x] 优化上下文面板第一步：让资料、标签、章节、场景上下文选择更容易理解，并清楚显示当前生成会带入什么。
- [x] 优化生成历史：复制、插入、重试、删除、按场景过滤和更清楚的历史摘要。
- [x] 梳理导出选项第一步：原生写作页支持“导出包含场景标题”选项，并将 `includeSceneTitles` 传给 Markdown/TXT/HTML/EPUB 导出接口。
- [x] 在原生设置中补充 TTS 语音、语速等设置入口，避免继续依赖旧本地存储项。
- [ ] 保持复杂半自动/自动小说工作流后置，只维护当前最小闭环和兼容入口。
- [ ] 验证计划：由 OpenCode 运行 `npm run writer-audit`、`npm run desktop-mainline-test`、`npm run unit`；涉及打包体验时再运行 `npm run pack` 和 `npm run packaged-smoke`。
## 阶段 24 补记 - 2026-06-29

- [x] OpenCode 任务 `phase24_editor_font_and_word_goal`：为原生写作页补充编辑器字体选择和当前场景字数目标/进度显示。
- [x] Codex 验收发现字数单位出现乱码且测试误接受乱码，按闭环拆分 follow-up。
- [x] OpenCode follow-up `phase24_fix_word_goal_mojibake`：修复字数单位为正确的 `字`，并收紧 `writer-button-audit` 断言。
- [x] 验证：OpenCode 顺序运行 `npm run writer-audit`、`npm run desktop-mainline-test`、`npm run unit`，均通过。
- [x] OpenCode 任务 `phase24_generation_history_filter_copy` 及 follow-up：原生写作页生成历史支持当前场景过滤和复制结果，并将 writer audit 改为稳定 `data-native-history-*` 选择器。
- [x] 验证：OpenCode 顺序运行 `npm run writer-audit`、`npm run desktop-mainline-test`、`npm run unit`，均通过。
- [x] OpenCode/Codex 闭环任务 `phase24_history_retry_audit`：补齐生成历史重试验收，确认重试会使用历史 beat 触发新生成，且不会重复插入旧历史结果；同时保留历史卡片任务标签、字数元信息和预览。
- [x] 验证：Codex 在 OpenCode 连续卡住两次后接管该小切片，并顺序运行 `npm run writer-audit`、`npm run desktop-mainline-test`、`npm run unit`，均通过。
- [x] OpenCode/Codex 闭环任务 `phase24_export_options_dialog`：补充导出场景标题选项、偏好存储、API 参数转发和 writer audit 覆盖。
- [x] 验证：Codex 在 OpenCode 超时后接管半成品修复，并顺序运行 `npm run writer-audit`、`npm run desktop-mainline-test`、`npm run unit`，均通过。
- [x] OpenCode/Codex 闭环任务 `phase24_native_tts_settings`：原生设置页补充 TTS 语音/语速控件，朗读功能读取同一偏好源，并覆盖 writer audit。
- [x] 验证：Codex 在 OpenCode 超时后接管测试加固，并顺序运行 `npm run writer-audit`、`npm run desktop-mainline-test`、`npm run unit`，均通过。
- [x] 最终功能缺口复核：见 `docs/FINAL_FEATURE_GAP_AUDIT.md`；暂未发现发布前必须补齐的新功能阻断项。
- [ ] 下一步候选：进入发布前自动验证和人工验收清单。
