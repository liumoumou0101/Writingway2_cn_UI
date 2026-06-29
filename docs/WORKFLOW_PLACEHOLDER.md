# 半自动小说工作流占位设计

最后更新：2026-06-27

Status update: Phase 18 has implemented the minimal real semi-automatic workflow. The older placeholder notes below remain as historical boundary notes; the authoritative current implementation summary is at the end of this document.

这份文档只定义未来工作流功能的边界和最小契约，不实现真正的自动化引擎。

小说工作流会是 Writingway 里最复杂的功能，复杂度可能超过前面编辑器、生成、备份、恢复等功能的总和。因此当前阶段只做占位，等桌面主线继续稳定后再正式实现。

## 当前阶段不做什么

- 不做全自动长篇生成。
- 不做复杂状态机。
- 不做多分支回滚 UI。
- 不做步骤编排器。
- 不做自动连续调用模型。
- 不把工作流逻辑塞进按钮事件或旧 iframe writer。

## 最小目标

当前只保留这些地基：

- `WorkflowTemplate`：描述一个工作流模板。
- `WorkflowStep`：描述一个步骤。
- `WorkflowArtifact`：描述步骤产物。
- `WorkflowEvent`：描述事件日志。
- `WorkflowRun.preRunSnapshot`：记录运行前快照。
- 一个最小模板：项目设定 -> 章节大纲 -> 场景草稿 -> 人工确认。

## 运行前快照策略

未来每次正式启动工作流前，都必须先创建项目快照。

建议格式：

```json
{
  "backupId": "example--before-workflow.json",
  "reason": "before-workflow",
  "createdAt": "2026-06-27T00:00:00.000Z"
}
```

当前 schema 只保留 `preRunSnapshot` 字段，不自动创建真实快照。正式工作流实现时再接入现有备份 API。

## 事件日志格式

事件日志仍写入：

```text
workflows/runs/{runId}.events.jsonl
```

每行一个 JSON：

```json
{
  "id": "event-...",
  "runId": "workflow-...",
  "type": "step_started",
  "stepId": "chapter-outline",
  "artifactId": "",
  "payload": {},
  "createdAt": "2026-06-27T00:00:00.000Z"
}
```

事件日志只追加，不原地修改。

## Generation Core 复用方式

未来每个生成步骤都应该复用：

- `src/core/generation/prompt-builder.js`
- `src/core/generation/provider-stream.js`
- `src/core/generation/generation-result.js`
- `src/core/generation/generation-history.js`

步骤不直接拼接 prompt，不直接调用旧 `src/generation.js`。

每个生成步骤至少产出：

- `prompt`
- `generation_result`
- 需要用户确认的业务 artifact，比如 `chapter_outline` 或 `draft_text`

## 最小模板

当前占位模板在 `src/core/workflow/workflow-schema.js`：

```text
项目设定
  -> 章节大纲
  -> 场景草稿
  -> 人工确认
```

每一步都默认需要人工确认。这个选择是故意的：先建立可暂停、可检查、可回滚的半自动流程，后面再逐步增加自动化程度。

## 何时才开始真正实现

只有当以下能力稳定后，才应该开始正式工作流：

- 原生编辑器。
- 原生生成。
- 原生备份/恢复。
- 项目目录数据模型。
- 生成历史和 prompt/result 契约。

当前这些能力已经有了主线基础，但工作流仍应保持占位，下一轮只适合做设计准备和极小 UI 入口。

## 阶段 18 当前实现

阶段 18 已经把占位契约推进为最小真实半自动工作流，但仍然坚持“逐步生成、人工确认、可恢复”的边界。

已经落地：

- `src/core/workflow/workflow-engine.js`：纯核心状态推进、prompt 构建、artifact 生成、审批和草稿应用计划。
- `desktop/services/workflow-service.js`：工作流 run/event 持久化、generation history 写入、最终项目保存。
- `/api/workflows/start`：创建 `before-workflow` 本地备份并启动 run。
- `/api/workflows/prepare-step`：生成当前步骤 prompt。
- `/api/workflows/complete-generation`：保存生成结果和 artifact。
- `/api/workflows/approve-step`：批准步骤，最终确认时写入项目。
- `/api/workflows/reject-step`：退回步骤并保留事件日志。
- `desktop.html` / `src/desktop/desktop-shell.js`：原生工作流 UI。

当前最小闭环：

```text
项目设定
  -> 章节大纲生成
  -> 人工批准
  -> 场景草稿生成
  -> 人工批准
  -> 最终人工确认
  -> 写入当前项目正文
```

仍然不做：

- 不做全自动长篇生成。
- 不做自动连续调用模型。
- 不做复杂分支回滚 UI。
- 不做可视化步骤编排器。
- 不把工作流逻辑塞进旧 iframe writer。

## 阶段 19 当前实现

阶段 19 没有扩展成复杂自动化，而是补齐最小工作流的控制边界：

- `artifact_applied` 事件：记录草稿 artifact 被采纳到哪个 scene。
- `/api/workflows/apply-artifact`：把 draft artifact 写入当前项目，但不完成 run。
- `/api/workflows/cancel`：取消 run，并把未完成步骤标记为 `cancelled`。
- 原生工作流 UI 增加“采纳草稿”和“取消运行”按钮。
- 终态 run（`completed` / `cancelled` / `failed`）会禁用继续生成、批准、退回、采纳和取消。

这仍然是地基层能力，不是正式复杂小说自动化。后续真正做自动/半自动长流程时，可以直接复用 run、step、artifact、event 和人工确认契约。
