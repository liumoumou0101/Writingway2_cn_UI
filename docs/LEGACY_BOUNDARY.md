# Writingway 旧代码边界

最后更新：2026-06-27

这份文档用于说明旧 Web/iframe 代码在重构期还负责什么，以及后续开发不应该继续往哪里加新功能。

## 总原则

- `desktop.html` 是新的桌面主线入口。
- `src/desktop/`、`desktop/services/`、`desktop/storage/` 和 `src/core/` 是新功能优先落点。
- `main.html` 和 `src/app.js` 是旧写作器兼容运行时，不再承载新的产品主线。
- 旧 JSON snapshot 只作为兼容、导入、导出、备份格式，不再作为新项目主存储。
- 半自动小说工作流最后实现，不能提前塞进旧 Alpine 事件和 UI 状态里。

## 旧运行时仍然负责的能力

这些能力目前仍由 `main.html` / `src/app.js` / 旧模块提供，迁移前可以维护 bug，但不应扩大职责：

- 按需打开的旧写作器兼容界面，用于迁移对照和兜底编辑。
- 旧 IndexedDB 项目数据读取和兼容逻辑。
- 旧 Web UI 自身的回归行为，例如 legacy generation、旧 sidebar、旧场景移动。
- 旧 GitHub/Gist 备份扩展逻辑，当前只作为兼容能力保留。
- 老 UI 测试仍覆盖的 `main.html` 行为。

## 新主线已经接管的能力

这些能力已经有新主线实现，后续应该继续在新主线增强：

- 桌面书架入口和项目目录识别。
- 新项目目录格式的创建、读取、保存、删除到 `.removed-projects`。
- 新项目目录与旧 snapshot 的兼容适配。
- 原生项目编辑器，包括章节/场景创建、重命名、删除、排序、元数据、查找替换、保存。
- 原生生成面板，包括 provider 设置、prompt/context 构建、预览、生成、接受、重试、丢弃、历史记录。
- 原生设置页和 provider 配置。
- 原生资料库/世界观。
- 原生提示词模板和上下文解析。
- 原生 workshop/创作对话。
- 原生导入导出和迁移入口。
- 原生阅读器文档转换。
- 原生恢复中心和本地备份恢复主线。
- 纯核心项目模型、章节/场景排序、稿件组装。
- 纯核心 prompt 构建、generation request/result 契约、provider 错误类型。
- 工作流 run 占位 schema 和最小持久化挂钩。

## 文件边界

### `desktop.html`

桌面主线入口。新导航、新书架、新编辑器、新阅读器、新恢复页、新设置页都应该优先从这里生长。

### `main.html`

旧 Web 写作器入口。现在只用于：

- 被 `desktop.html` 按需作为 iframe 兼容写作器加载；默认打开项目不会加载它。
- 运行旧 UI 测试。
- 作为旧功能迁移时的参考实现。

不要继续向 `main.html` 增加新的桌面产品 shell、书架、阅读器或工作流功能。

### `src/app.js`

旧 Alpine 应用主体。仍然是旧写作器的状态中心，但不应该继续新增跨领域业务规则。

允许修改：

- 修 bug。
- 为迁移暴露必要兼容接口。
- 把旧逻辑委托到 `src/core`。

避免修改：

- 新增桌面主线 UI。
- 新增半自动工作流状态机。
- 新增项目目录存储规则。
- 新增复杂 provider 编排。

### `src/generation.js`

当前仍被 `main.html` 实际加载的旧生成适配层。它可以继续作为旧 UI 的兼容入口，但核心规则应该委托给 `src/core/generation/*`。

### `src/modules/generation.js`

已删除。这个文件曾经只是未加载的历史占位，真实旧兼容生成入口是 `src/generation.js`。

### `desktop/local-server.js`

桌面本地 HTTP/API 边界。它应该保持为薄适配层，把项目业务逻辑交给 `desktop/services/*`，把纯规则交给 `src/core/*`。

### `src/core/*`

纯业务规则层。这里不应该依赖 DOM、Electron、IndexedDB、localStorage 或 Node 文件系统。

## 测试边界

推荐脚本分组：

```bash
npm run unit
npm run desktop-mainline-test
npm run legacy-ui-test
npm run backup-test
```

- `unit`：核心模型、存储、兼容适配、prompt 构建等快速检查。
- `desktop-mainline-test`：只测 `desktop.html` 和新桌面主线。
- `legacy-ui-test`：只测 `main.html` 旧 UI 兼容行为，不作为桌面主线功能验收。
- `backup-test`：备份 API 和旧恢复浏览器交互，后续迁移到原生恢复页后再拆分。

注意：多个测试会占用 `127.0.0.1:8000`，不要并行运行端口型测试。

## 迁移顺序

1. 旧写作器现在只按需作为 iframe 兜底。
2. 原生编辑器、生成、设置、资料、提示词、workshop、导入导出、恢复已经接管主线。
3. 后续只在发现真实缺口时迁移旧能力，不再照搬旧 UI。
4. 旧 iframe 只保留迁移/对照/兜底入口。
5. 开始正式实现半自动小说工作流。

## 删除旧代码的条件

某个旧模块可以删除或归档，需要同时满足：

- 新主线已经提供等价或更好的用户功能。
- 有对应测试覆盖新路径。
- 文档已经说明旧路径不再支持。
- 旧入口中没有脚本标签或运行时引用。
