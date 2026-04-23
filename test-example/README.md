# test-example

最简单的静态页，用来手动验证 `trace-sdk -> trace-server` 链路。

## 启动

1. 启动 `trace-server`
2. 确保 `packages/trace-sdk/dist/trace-sdk.iife.js` 已经构建
3. 在仓库根目录运行：

```bash
node test-example/server.js
```

4. 打开 `http://localhost:8088`
5. 点击 `Init SDK`
6. 再点 `Send Page Event` / `Send Custom Event` / `Send Error Event`

## 成功标志

- 日志里能看到 `/api/v1/collect/*` 请求
- 日志里能看到 `report success`
