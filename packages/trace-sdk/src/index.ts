// ============================================================
// 核心类型导出
// ============================================================
export type {
  SDKConfig,
  TraceEvent,
  Plugin,
  DeviceInfo,
  EventType,
  EventPriority,
  Platform,
  PluginContext,
  ReportConfig,
  SamplingConfig,
  StorageConfig,
} from './core/types';

// ============================================================
// 适配器接口导出
// ============================================================
export type { INetworkAdapter, IStorageAdapter, ConfigProvider } from './adapter/types';

// ============================================================
// 核心类导出
// ============================================================
export { BasePlugin } from './core/BasePlugin';
export { TraceSDK } from './core/SDK';
export { PluginManager } from './core/PluginManager';
export type { PluginHookResult } from './core/PluginManager';
export { EventBus, eventBus, EventBusEvents } from './core/EventBus';
export type { EventBusEvent } from './core/EventBus';

// ============================================================
// 适配器模块导出
// ============================================================
export { BaseNetworkAdapter } from './adapter/base/BaseNetworkAdapter';
export { BaseStorageAdapter } from './adapter/base/BaseStorageAdapter';
export { PlatformAdapterFactory, createAdaptersByDetection } from './adapter';

// ============================================================
// 平台模块导出（按平台聚合）
// ============================================================

// 微信小程序
export {
  WeixinNetworkAdapter,
  WeixinStorageAdapter,
  WeixinConfigProvider,
} from './platform/weixin';

// 支付宝小程序
export {
  AlipayNetworkAdapter,
  AlipayStorageAdapter,
  AlipayConfigProvider,
} from './platform/alipay';

// 百度小程序
export { BaiduNetworkAdapter, BaiduStorageAdapter, BaiduConfigProvider } from './platform/baidu';

// 头条小程序
export {
  ToutiaoNetworkAdapter,
  ToutiaoStorageAdapter,
  ToutiaoConfigProvider,
} from './platform/toutiao';

// Node.js
export { NodeNetworkAdapter, NodeStorageAdapter, NodeConfigProvider } from './platform/nodejs';

// Web
export {
  WebNetworkAdapter,
  WebStorageAdapter,
  localStorageAdapter,
  sessionStorageAdapter,
  WebConfigProvider,
} from './platform/web';

// ============================================================
// 插件模块导出
// ============================================================
export { WebTestClickPlugin } from './plugins/web/WebTestClickPlugin';

// ============================================================
// 上报模块导出
// ============================================================
export { EventQueue } from './report/EventQueue';
export { Sampler } from './report/Sampler';
export { RetryStrategy } from './report/RetryStrategy';
export { BatchReporter } from './report/BatchReporter';
export { ReportManager } from './report/ReportManager';

// ============================================================
// 平台检测导出
// ============================================================
export {
  detectPlatform,
  isWeixin,
  isAlipay,
  isBaidu,
  isToutiao,
  isNodeJS,
  isWeb,
  platformDetector,
  DefaultPlatformDetector,
} from './platform/detector';
export type { PlatformDetectionResult, PlatformDetector } from './platform/types';

// ============================================================
// 平台模块（命名空间导出）
// ============================================================
export * as platform from './platform';
export * as adapter from './adapter';

// ============================================================
// 工具函数导出
// ============================================================
export {
  generateId,
  randomString,
  uuid,
  shortId,
  getSessionManager,
  parseStackFrames,
  parseError,
  getErrorMessage,
  categorizeError,
} from './utils';

// ============================================================
// 向后兼容导出（旧名称别名）
// ============================================================

/** @deprecated 使用 WeixinNetworkAdapter */
export { WeixinNetworkAdapter as MiniappNetworkAdapter } from './platform/weixin';

/** @deprecated 使用 WeixinStorageAdapter */
export { WeixinStorageAdapter as MiniappStorageAdapter } from './platform/weixin';

// 向后兼容：从旧路径导出基类
/** @deprecated 使用 adapter/base/BaseStorageAdapter */
export { BaseStorageAdapter as BaseStorage } from './adapter/base/BaseStorageAdapter';

/** @deprecated 使用 adapter/base/BaseNetworkAdapter */
export { BaseNetworkAdapter as NetworkAdapter } from './adapter/base/BaseNetworkAdapter';
