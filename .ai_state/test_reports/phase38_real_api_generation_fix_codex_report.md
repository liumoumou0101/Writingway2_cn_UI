# phase38_real_api_generation_fix_codex_report

## 结论

PASS。

写作页“继承全局设置”生成时的 401 已修复。根因是 UI 侧使用脱敏后的 `publicSettings` 重新计算 generation runtime config，导致全局 API key 被清空；DeepSeek 收到无效鉴权后返回 401。

## 修改范围

- `src/desktop/desktop-shell.js`
  - `nativeGenerationConfig()` 改为统一调用 `runtimeProviderConfig(extras)`。
  - 保持 provider profile 路径继续使用 `runtimeProviderProfiles` 的真实本地运行时 key。
  - 全局继承路径现在使用 `/api/settings` 返回的 `runtimeProvider`，不会从脱敏设置重算。
- `tests/writer-button-audit.js`
  - 增加断言：全局继承生成和全局继承 + Thinking 生成 config 必须保留 runtime API key。
- `docs/DESKTOP_UI_TODOLIST.md`
  - 补充本次真实 API 401 修复记录。

## 真实 API 验证

使用用户提供的 DeepSeek API key 做真实请求，测试过程未写入仓库或报告明文密钥。

- `/models`：200，返回 `deepseek-v4-flash`、`deepseek-v4-pro`。
- `deepseek-v4-flash` 非 Thinking 最小 chat：200，返回正文。
- `deepseek-v4-pro` 非 Thinking：200，返回正文。
- `deepseek-v4-pro` Thinking：200，返回正文与 reasoning stream。
- 写作页 UI 真实生成：
  - 临时数据目录。
  - 全局 DeepSeek 配置。
  - 写作页选择 `deepseek-v4-pro`。
  - 点击生成后返回正文，无 401。

## 自动测试

- `node -c src/desktop/desktop-shell.js` PASS
- `node tests/provider-stream.js` PASS
- `npm run writer-audit` PASS
- `npm run desktop-mainline-test` PASS
- `npm run unit` PASS
- `git diff --check` PASS
- `npm run dist` PASS
- `npm run packaged-smoke` PASS

## 备注

一次 `npm run unit` 初跑失败是因为另一个测试进程仍占用固定端口 `127.0.0.1:8000`；端口释放后单独重跑通过。
