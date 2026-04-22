/**
 * TraceFlow SDK 全局类型定义
 * @packageDocumentation
 */

// 从适配器模块引入接口类型（供 SDKConfig 等引用）
import type { INetworkAdapter, IStorageAdapter, ConfigProvider } from '../adapter/types';

// Re-export 适配器类型，保持向后兼容
export type { INetworkAdapter, IStorageAdapter, ConfigProvider } from '../adapter/types';

// ============================================================
// 事件类型
// ============================================================

/** 事件类型枚举 */
export type EventType = 'track' | 'page' | 'error' | 'identify' | 'custom';

/** 事件优先级 */
export type EventPriority = 'critical' | 'normal' | 'low';

/** 平台类型 */
export type Platform =
  | 'web'
  | 'miniapp-weixin'
  | 'miniapp-alipay'
  | 'miniapp-baidu'
  | 'miniapp-toutiao'
  | 'nodejs';

// ============================================================
// 设备信息
// ============================================================

/** 设备信息接口 */
export interface DeviceInfo {
  /** 设备唯一标识 */
  deviceId: string;
  /** 平台类型 */
  platform: Platform;
  /** User Agent */
  userAgent?: string;
  /** 屏幕宽度 */
  screenWidth?: number;
  /** 屏幕高度 */
  screenHeight?: number;
  /** 操作系统 */
  os?: string;
  /** 操作系统版本 */
  osVersion?: string;
  /** 浏览器名称 */
  browser?: string;
  /** 浏览器版本 */
  browserVersion?: string;
  /** 语言 */
  language?: string;
  /** 时区 */
  timezone?: string;
  /** 网络类型 */
  networkType?: string;
  /** 应用版本 */
  appVersion?: string;
  /** SDK 版本 */
  sdkVersion?: string;
  /** 渠道来源 */
  channel?: string;
  /** 额外属性 */
  [key: string]: unknown;
}

// ============================================================
// 事件模型
// ============================================================

/** 埋点事件结构 */
export interface TraceEvent {
  /** 事件唯一 ID */
  eventId: string;
  /** 事件类型 */
  eventType: EventType;
  /** 事件名称 (track 事件时使用) */
  eventName?: string;
  /** 事件发生时间戳 (毫秒) */
  timestamp: number;
  /** 用户 ID (登录用户) */
  userId?: string;
  /** 匿名 ID (设备唯一标识) */
  anonymousId: string;
  /** 会话 ID */
  sessionId: string;
  /** 设备信息 */
  deviceInfo: DeviceInfo;
  /** 当前页面 URL */
  url?: string;
  /** 当前页面标题 */
  title?: string;
  /** 来源页面 */
  referrer?: string;
  /** 事件属性 */
  properties?: Record<string, unknown>;
  /** 事件优先级 */
  priority?: EventPriority;
  /** 是否已发送 */
  _sent?: boolean;
  /** 重试次数 */
  _retryCount?: number;
  /** 事件创建时间 */
  _createdAt?: number;
  /** 扩展字段 */
  [key: string]: unknown;
}

// ============================================================
// 插件系统
// ============================================================

/** 插件上下文 */
export interface PluginContext {
  /** SDK 配置 */
  config: SDKConfig;
  /** 设备信息 */
  deviceInfo: DeviceInfo;
  /** 匿名 ID */
  anonymousId: string;
  /** 会话 ID */
  sessionId: string;
  /** 用户 ID */
  userId?: string;
  /** 更新匿名 ID */
  setAnonymousId: (id: string) => void;
  /** 更新用户 ID */
  setUserId: (id: string | undefined) => void;
  /** 上报事件（插件自动采集事件通过此方法进入 SDK 上报管道） */
  reportEvent: (event: TraceEvent) => void;
}

/** 插件接口 */
export interface Plugin {
  /** 插件名称 (唯一标识) */
  name: string;
  /** 插件优先级 (数值越大越先执行，默认 0) */
  priority?: number;
  /** 插件加载时调用 */
  onLoad?(context: PluginContext): void | Promise<void>;
  /** 事件处理钩子 (返回 void 表示丢弃事件) */
  onEvent?(event: TraceEvent): TraceEvent | void;
  /** 错误处理钩子 */
  onError?(error: Error): void;
  /** 批量上报前处理钩子 */
  onReport?(events: TraceEvent[]): TraceEvent[];
  /** 插件卸载时调用 */
  onUnload?(): void;
}

/** 基础插件抽象类 */
export abstract class BasePlugin implements Plugin {
  abstract name: string;
  priority?: number;

  onLoad?(context: PluginContext): void | Promise<void>;
  onEvent?(event: TraceEvent): TraceEvent | void;
  onError?(error: Error): void;
  onReport?(events: TraceEvent[]): TraceEvent[];
  onUnload?(): void;
}

// ============================================================
// 配置系统
// ============================================================

/** 上报配置 */
export interface ReportConfig {
  /** 批量上报数量阈值 (默认 10) */
  batchSize?: number;
  /** 批量上报时间间隔 (毫秒，默认 3000) */
  flushInterval?: number;
  /** 最大重试次数 (默认 3) */
  maxRetries?: number;
  /** 重试间隔 (毫秒，默认 1000) */
  retryInterval?: number;
}

/** 采样配置 */
export interface SamplingConfig {
  /** 全局采样率 0-1 (默认 1) */
  rate?: number;
  /** 事件类型级别采样配置 */
  byEventType?: Partial<Record<EventType, number>>;
  /** 基于用户 ID 的采样一致性 (相同用户始终相同结果) */
  consistentByUser?: boolean;
}

/** 存储配置 */
export interface StorageConfig {
  /** 是否启用本地存储 (默认 true) */
  enabled?: boolean;
  /** 本地存储 Key 前缀 */
  prefix?: string;
  /** 本地存储有效期 (毫秒，默认 7 天) */
  expire?: number;
  /** 存储容量上限 (条数) */
  maxSize?: number;
}

/** SDK 配置 */
export interface SDKConfig {
  /** 应用 ID (必填) */
  appId: string;
  /** 上报地址 (必填) */
  serverUrl: string;
  /** 平台类型（可选，默认自动检测） */
  platform?: Platform;
  /** 调试模式 */
  debug?: boolean;
  /** 上报配置 */
  reportConfig?: ReportConfig;
  /** 采样配置 */
  samplingConfig?: SamplingConfig;
  /** 存储配置 */
  storageConfig?: StorageConfig;
  /** 配置提供者 */
  configProvider?: ConfigProvider;
  /** 网络适配器 */
  networkAdapter?: INetworkAdapter;
  /** SDK 就绪回调 */
  onReady?: () => void;
  /** 事件发送前回调 (返回 false 丢弃事件) */
  beforeSend?(event: TraceEvent): TraceEvent | false | void;
  /** 上报成功回调 */
  onReportSuccess?(event: TraceEvent): void;
  /** 上报失败回调 */
  onReportFail?(event: TraceEvent, error: Error): void;

  /** 存储适配器（可选，未提供时根据平台自动选择） */
  storageAdapter?: IStorageAdapter;
}
