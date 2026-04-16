/**
 * 平台相关类型定义
 */

import type { Platform } from '../core/types';

/** 平台检测结果 */
export interface PlatformDetectionResult {
  /** 平台类型 */
  platform: Platform;
  /** 平台版本（可选） */
  version?: string;
  /** 环境信息 */
  env: Record<string, unknown>;
}

/** 平台检测器接口 */
export interface PlatformDetector {
  /** 执行平台检测并返回完整结果 */
  detect(): PlatformDetectionResult;

  /** 是否为微信小程序 */
  isWeixin(): boolean;

  /** 是否为支付宝小程序 */
  isAlipay(): boolean;

  /** 是否为百度小程序 */
  isBaidu(): boolean;

  /** 是否为头条小程序 */
  isToutiao(): boolean;

  /** 是否为Node.js环境 */
  isNodeJS(): boolean;

  /** 是否为Web环境 */
  isWeb(): boolean;
}

/** 平台配置提供者接口 */
export interface PlatformConfigProvider {
  /** 获取平台特定的设备信息 */
  getDeviceInfo(): Promise<Record<string, unknown>>;

  /** 获取平台特定的配置 */
  getPlatformConfig(): Record<string, unknown>;
}

/** 平台适配器类型 */
export type PlatformAdapterType = 'network' | 'storage' | 'config';

/** 平台适配器工厂函数 */
export type PlatformAdapterFactory<T> = (platform: Platform, config: unknown) => T;

/** 平台检测选项 */
export interface PlatformDetectOptions {
  /** 手动指定平台（覆盖自动检测） */
  platform?: Platform;
  /** 是否启用详细环境信息收集 */
  collectEnvInfo?: boolean;
}
