# DeepSeek V4 Optimization Summary

## 结论

本轮 DeepSeek v4 适配优化已经按计划完成。核心目标是让 DeepSeek API 模式更可控、更符合 v4 官方行为，并避免思考内容污染正文。

目前已经实现：

- DeepSeek v4 Pro / Flash 均可选择思考或非思考模式。
- 非思考模式会显式关闭 `thinking`，并继续支持 `temperature`。
- 思考模式会显式开启 `thinking`，不发送 `temperature`。
- `reasoning_content` 会被隐藏并单独保存，不会进入正文。
- 用户可以点击按钮查看 DeepSeek 的思考内容。
- 生成过程中可以停止请求。
- DeepSeek 常见 API 错误有更友好的提示。

## 修改文件

本轮实际修改了以下文件：

- `main.html`
- `src/app.js`
- `src/generation.js`
- `src/modules/ai-settings.js`
- `src/state/app-state.js`

另有一个未跟踪快捷方式文件：

- `start.bat - 快捷方式 (2).lnk`

该快捷方式文件与本次改动无关，没有修改。

## 阶段完成情况

### 阶段 0：确认范围

已确认 DeepSeek 相关逻辑原本分散在三处：

- `main.html`：AI 设置 UI 和 provider 切换内联逻辑
- `src/modules/ai-settings.js`：模型列表、设置保存/加载
- `src/generation.js`：实际 API 请求和流式解析

后续因为需要集中配置和新增 UI 状态，合理扩展到：

- `src/app.js`
- `src/state/app-state.js`

### 阶段 1：DeepSeek v4 请求逻辑

已完成 DeepSeek 模型 alias 到真实 API 模型的转换。

UI 模型：

- `deepseek-v4-pro`
- `deepseek-v4-pro-thinking`
- `deepseek-v4-flash`
- `deepseek-v4-flash-thinking`

真实请求映射：

- `deepseek-v4-pro` -> `model: deepseek-v4-pro`, `thinking: disabled`
- `deepseek-v4-pro-thinking` -> `model: deepseek-v4-pro`, `thinking: enabled`
- `deepseek-v4-flash` -> `model: deepseek-v4-flash`, `thinking: disabled`
- `deepseek-v4-flash-thinking` -> `model: deepseek-v4-flash`, `thinking: enabled`

兼容旧模型：

- `deepseek-chat` -> `deepseek-v4-flash`
- `deepseek-reasoner` -> `deepseek-v4-flash-thinking`

参数规则：

- 非思考模式：发送 `temperature` 和 `max_tokens`
- 思考模式：发送 `max_tokens` 和 `reasoning_effort`，不发送 `temperature`
- 所有 DeepSeek 请求都会显式发送 `thinking`

### 阶段 2：集中 DeepSeek 配置

已将 DeepSeek 模型列表集中到 `src/modules/ai-settings.js` 和 `src/state/app-state.js`。

`main.html` 中原本很长的内联 provider 切换逻辑已替换为：

```html
@change="handleAIProviderChange()"
```

实际逻辑由 `src/app.js` 代理到 `window.AISettings.handleProviderChange(this)`。

### 阶段 3：reasoning 内容分流

已处理 DeepSeek 的思考内容分流。

现在：

- `reasoning_content` -> `lastReasoningText`
- `content` -> 正文

支持两种返回形式：

- 非流式：`message.reasoning_content`
- 流式：`delta.reasoning_content`

如果 DeepSeek 只返回了思考内容、没有最终正文，会提示用户：

```text
DeepSeek returned reasoning content but no final prose. Try increasing Max Length, or switch to a non-thinking DeepSeek mode.
```

### 阶段 4-8：用户体验优化

已完成以下体验优化：

1. DeepSeek 思考模式下禁用温度滑条。
2. 温度滑条旁增加提示，说明 thinking 模式不发送 temperature。
3. 增加 `View Thinking` 按钮。
4. 增加 `DeepSeek Thinking` 弹窗。
5. 增加 `Stop` 按钮，可以中止生成。
6. 中止生成后，如果已有部分正文，会保留已生成内容。
7. DeepSeek API 错误提示更友好。

新增状态：

```js
lastReasoningText: ''
reasoningInProgress: false
showReasoningModal: false
generationAbortController: null
```

### 阶段 9：验证

已完成以下验证：

- 全部 `src/**/*.js` 通过 `node --check`。
- 专项 DeepSeek 回归测试通过。
- 验证了 DeepSeek 四种 v4 模式的请求体。
- 验证了旧模型迁移。
- 验证了 thinking 模式不发送 `temperature`。
- 验证了非 thinking 模式发送 `temperature`。
- 验证了 `reasoning_content` 不进入正文。
- 验证了 reasoning-only 的错误提示。
- 验证了停止生成后保留部分正文。

完整 `npm run test` 没能完全通过，原因是测试环境问题：

- 项目默认测试会直接用 `file://` 打开页面，但应用现在会提示用户使用 `start.bat`。
- 改用 `http://localhost:8000/main.html` 后，页面依赖 CDN 加载 Dexie/JSZip。
- 当前 Playwright 浏览器环境禁止这些外部 CDN 请求，导致 `db is not defined`。

这不是 DeepSeek 改动本身导致的问题。后续如果想让测试稳定运行，建议把 Dexie 和 JSZip 也本地 vendor 化。

## 当前 DeepSeek 使用行为

### 推荐日常写作

选择：

```text
DeepSeek V4 Pro - Creative
```

行为：

- thinking 关闭
- temperature 生效
- 速度和可控性更适合日常续写

### 推荐大纲推演/复杂规划

选择：

```text
DeepSeek V4 Pro - Deep Reasoning
```

行为：

- thinking 开启
- temperature 不发送
- 思考内容隐藏
- 可点击 `View Thinking` 查看思考内容

### 快速续写

选择：

```text
DeepSeek V4 Flash - Fast Draft
```

行为：

- thinking 关闭
- temperature 生效
- 更适合快速生成草稿

### 快速推理

选择：

```text
DeepSeek V4 Flash - Fast Reasoning
```

行为：

- thinking 开启
- temperature 不发送
- 比 Pro reasoning 更偏快速推理

## 后续建议

优先级较高：

- 将 Dexie 和 JSZip 本地 vendor 化，避免 CDN 失败导致页面和测试不可用。
- 给 DeepSeek 增加一个隐藏的请求调试区，展示真实模型、thinking 状态、是否发送 temperature、是否流式。

优先级中等：

- 增加生成长度预设，例如短段落、标准续写、长场景、大纲推演。
- 将模型能力配置进一步抽象成 capability 表，减少未来增加模型时的判断分散。

当前不急：

- 给 reasoning 弹窗增加复制按钮。
- 保存每次生成的 reasoning 历史。
- 将 `src/modules/generation.js` 这个旧占位文件清理或标注为废弃，避免未来误改。

