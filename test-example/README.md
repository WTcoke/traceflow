# test-example

最简单的静态页，用来手动验证 `trace-sdk -> trace-server` 链路。

## 启动

1. 启动 `trace-server`
2. 构建 Web SDK：
   ```bash
   cd packages/trace-sdk
   npm run build:web
   ```
3. 在仓库根目录运行：
   ```bash
   node test-example/server.js
   ```
4. 打开 `http://localhost:8088`
5. 填写 `Server URL` 和 `SDK App ID`
6. 点击 `Init SDK`
7. 再点 `Send Page Event` / `Send Custom Event` / `Send Error Event`

## 配置说明

- **Server URL**: 后端 API 地址，例如 `http://localhost:3000/api/v1`
- **SDK App ID**: 应用标识，例如 `traceflow-demo-app`

## 成功标志

- 日志里能看到 `sdk ready`
- 日志里能看到 `report success`
- 后端能收到事件
