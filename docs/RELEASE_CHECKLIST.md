# 发布与维护检查清单

最后更新：2026-06-27

这份文档记录桌面版当前的发布验证步骤。项目仍处于重构期，发布检查的目标是确认包能构建、核心路径能测试通过、旧兼容入口没有被意外破坏。

## 标准验证命令

```powershell
npm test
npm run backup-test
npm run pack
npm run packaged-smoke
npm run dist
```

说明：

- `npm test` 会顺序运行 smoke、unit、desktop mainline、legacy UI，避免多个测试同时抢占 `127.0.0.1:8000`。
- `npm run backup-test` 单独运行备份 API 和旧备份浏览器测试。
- `npm run pack` 生成 `release/win-unpacked`。
- `npm run packaged-smoke` 启动 `release/win-unpacked/Writingway.exe`，用临时数据目录验证打包产物能打开、创建项目、保存正文、读回正文和创建备份。
- `npm run dist` 生成 Windows installer 和 portable 包。
- `npm run unit` 包含 `tests/release-config.js`，会检查 Electron 主入口、打包文件清单、asar 决策和运行时依赖边界。

`packaged-smoke` 依赖 `npm run pack` 已经生成的 `release/win-unpacked/Writingway.exe`。它会通过 `WRITINGWAY_DATA_ROOT` 指向临时目录，不会写入真实用户数据目录。

## 当前 Windows 产物

`npm run dist` 成功后应看到：

```text
release/Writingway Setup 1.0.0.exe
release/Writingway 1.0.0.exe
release/win-unpacked/Writingway.exe
```

其中实际产品名以 `package.json` 的 `build.productName` 为准；当前为 `Writingway`。

阶段 20 在 2026-06-27 已重新验证：

```text
release/Writingway Setup 1.0.0.exe
release/Writingway 1.0.0.exe
release/win-unpacked/Writingway.exe
release/win-unpacked/resources/app/node_modules/jszip
```

`jszip` 是项目包导入/导出的运行时依赖，必须保留在 `dependencies`，不能只放在 `devDependencies`。

## asar 决策

当前 `package.json` 中仍保持：

```json
"asar": false
```

原因：

- 桌面主进程会启动本地 HTTP server，并以应用根目录为静态文件根读取 `desktop.html`、`main.html`、`src/**` 等文件。
- Electron 的 `fs` 理论上可以读取 asar 内文件，但当前架构仍把前端资源当作普通目录服务。
- 现在启用 asar 的收益有限，风险主要在静态资源路径、旧 iframe writer、以及本地服务读取路径。

阶段 11 的结论：

- 可以继续保持 `asar: false`。
- 不应在没有端到端启动验证的情况下直接启用 asar。
- 阶段 20 复测后仍维持该结论。
- 后续若要启用，应先新增一个 asar 打包验证分支，重点检查：
  - `desktop.html` 能从本地服务打开。
  - `main.html?runtime=desktop&embedded=writer` 能作为 iframe 加载。
  - `src/**`、`desktop/**`、图标、样式、vendor 脚本都能被服务读取。
  - 新项目目录、备份、恢复、生成历史都写入 `userData` 或用户选择的目录，而不是写入应用安装目录。

## 发布前人工检查

- 启动 `release/win-unpacked/Writingway.exe`，确认桌面主界面打开。
- 启动 portable exe，确认不会和开发服务器端口冲突。
- 运行 installer，确认可选择安装目录。
- 创建一个项目，保存，关闭应用后重新打开，确认项目仍在书架。
- 在原生编辑器保存正文，确认阅读器能刷新。
- 创建一次备份，打开恢复中心，确认可预览和恢复。
