# TraceFlow SDK Roadmap

本文记录 TraceFlow SDK 后续演进方向。状态以当前代码为准，优先级会随业务接入反馈调整。

## 当前已具备

- 统一事件模型：`behavior`、`performance`、`error`
- Web SDK 入口：`@traceflow/sdk/web`
- Web 上报：`fetch` 批量 POST 到采集接口
- Web 卸载期补发：可选 `navigator.sendBeacon`
- 批量上报：按数量和时间间隔触发
- 失败重试：指数退避重试
- 采样控制：全局采样、按事件类型采样、一致性采样
- 插件系统：`onLoad`、`onEvent`、`onReport`、`onError`、`onUnload`
- Web Storage：设备 ID 和可选持久化事件队列
- 基础平台适配器：Web、微信小程序、支付宝小程序、百度小程序、字节跳动小程序、Node.js

## 高优先级

### Web 自动采集插件

- [ ] 路由变化自动采集插件
- [ ] JS 运行时错误自动采集插件
- [ ] Promise `unhandledrejection` 自动采集插件
- [ ] 资源加载错误自动采集插件
- [ ] 更完整的点击行为采集插件，替换当前测试用途的 `WebTestClickPlugin`

### 性能监控增强

- [ ] Core Web Vitals 指标采集：LCP、INP、CLS
- [ ] Navigation Timing 指标采集
- [ ] Resource Timing 资源加载指标采集
- [ ] API 请求耗时采集
- [ ] Long Task 采集

### Web 接入体验

- [ ] 提供常用框架示例：Vue、React、原生 SPA
- [ ] 提供浏览器端完整 demo
- [ ] 补充 CDN/IIFE 接入说明
- [ ] 明确 SSR 接入边界和示例

## 中优先级

### 上报可靠性

- [ ] 网络状态感知：离线时暂停普通上报，恢复联网后 flush
- [ ] 页面可见性感知：后台降低普通上报频率
- [ ] 上报 payload 大小保护
- [ ] `sendBeacon` 数据大小限制处理
- [ ] Web 卸载期补发增强：明确当前只补发一个 batch，后续支持 `beaconMaxEvents` / `beaconBatchSize` 控制最多补发事件数和分批发送
- [ ] 后端幂等和重复投递策略文档

### 数据治理

- [ ] 内置敏感字段脱敏能力
- [ ] 字段白名单/黑名单配置
- [ ] 事件 schema 校验
- [ ] 超大字段裁剪

### 存储增强

- [ ] IndexedDB 队列适配器
- [ ] 队列按时间和容量自动清理策略增强
- [ ] 本地队列状态可观测 API

## 低优先级

### 多平台文档

- [ ] 微信小程序接入文档
- [ ] 支付宝小程序接入文档
- [ ] 百度小程序接入文档
- [ ] 字节跳动小程序接入文档
- [ ] Node.js 接入文档

### 工程化

- [ ] TypeDoc API 文档生成
- [ ] CI 构建和测试流程
- [ ] 发布流程和版本规范
- [ ] Bundle size 检查

### 测试覆盖

- [ ] WebNetworkAdapter 单元测试
- [ ] WebLifecycleReporter 单元测试
- [ ] 插件生命周期测试
- [ ] 浏览器集成测试
- [ ] 多平台适配器 smoke test

## 暂不计划

- [ ] 在 SDK 内实现监控看板
- [ ] 在 SDK 内实现 Source Map 解析服务
- [ ] 在 SDK 内做复杂用户画像或分析计算

这些能力更适合放在服务端、数据处理链路或 TraceFlow 控制台中实现。
