# @traceflow/sdk

TraceFlow SDK 是一个客户端遥测 SDK，用于收集用户行为、性能和错误事件，并上报到 TraceFlow 采集 API。

当前推荐接入入口是 Web SDK：`@traceflow/sdk/web`。仓库中也保留了微信小程序、支付宝小程序、百度小程序、字节跳动小程序和 Node.js 的基础适配器与构建入口，但这些平台的接入文档仍待补齐。

## 安装

```bash
npm install @traceflow/sdk
```

如果使用 pnpm：

```bash
pnpm add @traceflow/sdk
```

## Web 快速开始

```ts
import { initWeb } from '@traceflow/sdk/web';

const sdk = await initWeb({
  appId: 'your-app-id',
  baseUrl: 'https://trace.example.com/api/v1',
});

sdk.setUserId('user-123');
sdk.page();
sdk.track('button_click', {
  buttonName: 'submit',
});
```

`baseUrl` 会自动拼接 `/collect`，上例最终请求：

```text
https://trace.example.com/api/v1/collect
```

完整 Web 接入说明见 [docs/web-guide.md](./docs/web-guide.md)。

## 包入口

| 入口                     | 说明                                         | 状态                       |
| ------------------------ | -------------------------------------------- | -------------------------- |
| `@traceflow/sdk`         | 核心类型、核心类、平台适配器和工具导出       | 可用                       |
| `@traceflow/sdk/web`     | Web SDK 入口，包含 `initWeb` 和 Web 平台能力 | 推荐使用                   |
| `@traceflow/sdk/weixin`  | 微信小程序构建入口                           | 基础适配器可用，文档待补齐 |
| `@traceflow/sdk/alipay`  | 支付宝小程序构建入口                         | 基础适配器可用，文档待补齐 |
| `@traceflow/sdk/baidu`   | 百度小程序构建入口                           | 基础适配器可用，文档待补齐 |
| `@traceflow/sdk/toutiao` | 字节跳动小程序构建入口                       | 基础适配器可用，文档待补齐 |
| `@traceflow/sdk/nodejs`  | Node.js 构建入口                             | 基础适配器可用，文档待补齐 |

## 核心能力

- 统一事件模型：`behavior`、`performance`、`error`
- 批量上报：按数量和时间间隔触发
- 失败重试：内置指数退避重试策略
- 采样控制：支持全局采样、按事件类型采样和一致性采样
- 插件系统：支持 `onLoad`、`onEvent`、`onReport`、`onError`、`onUnload`
- Web 平台能力：设备信息采集、Web Storage、`fetch` 上报、页面隐藏/卸载期 `sendBeacon` 尽力补发

## 目录结构

```text
packages/trace-sdk/
├── docs/                 # 使用文档
│   ├── user-guide.md     # 平台文档索引
│   └── web-guide.md      # Web SDK 接入指南
├── src/
│   ├── adapter/          # 平台适配器抽象和工厂
│   ├── core/             # SDK 核心、插件管理、事件总线和类型
│   ├── platform/         # Web、小程序、Node.js 平台实现
│   ├── plugins/          # 插件集合
│   ├── report/           # 队列、批量上报、重试和采样
│   ├── storage/          # 持久化存储
│   └── utils/            # 工具函数
├── entry-*.ts            # 各平台构建入口
├── vite.config*.ts       # 构建配置
└── package.json
```

## 常用脚本

```bash
npm run build       # 构建默认入口
npm run build:web   # 构建 Web 入口
npm run build:all   # 构建所有平台入口
npm test            # 运行测试
```

## 文档

- [Web SDK 使用指南](./docs/web-guide.md)
- [平台文档索引](./docs/user-guide.md)
- [Roadmap](./docs/roadmap.md)

## 许可证

MIT
