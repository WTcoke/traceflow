# TraceFlow SDK 使用手册

TraceFlow 是一款轻量级、可扩展的客户端埋点 SDK，支持多平台。

## 支持的平台

| 平台           | 文档链接                               | 状态      |
| -------------- | -------------------------------------- | --------- |
| Web            | [web-guide.md](./web-guide.md)         | ✅ 已完成 |
| 微信小程序     | [weixin-guide.md](./weixin-guide.md)   | ❌ TODO   |
| 支付宝小程序   | [alipay-guide.md](./alipay-guide.md)   | ❌ TODO   |
| 百度小程序     | [baidu-guide.md](./baidu-guide.md)     | ❌ TODO   |
| 字节跳动小程序 | [toutiao-guide.md](./toutiao-guide.md) | ❌ TODO   |
| Node.js        | [nodejs-guide.md](./nodejs-guide.md)   | ❌ TODO   |

## 核心特性

- **轻量高效**：gzip 后仅 8-19KB，对性能影响极小
- **插件化架构**：通过插件系统自由扩展功能
- **可靠上报**：内置批量上报、智能重试机制
- **TypeScript 优先**：完整类型提示
