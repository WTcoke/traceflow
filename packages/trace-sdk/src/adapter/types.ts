/**
 * 适配器接口定义
 * 定义网络、存储、配置的接口契约
 * @packageDocumentation
 */

import type { DeviceInfo, TraceEvent } from '../core/types';

// ============================================================
// 网络适配器接口
// ============================================================

/** 网络适配器接口 */
export interface INetworkAdapter {
  /** 批量发送事件 */
  sendBatch(events: TraceEvent[]): Promise<void>;
}

// ============================================================
// 存储适配器接口
// ============================================================

/** 存储适配器接口 */
export interface IStorageAdapter {
  /** 获取数据 */
  get(key: string): string | null;
  /** 设置数据 */
  set(key: string, value: string, expire?: number): void;
  /** 删除数据 */
  remove(key: string): void;
  /** 清空所有数据 */
  clear(): void;
  /** 获取所有键 */
  keys(): string[];
  /** 检查键是否存在 */
  has(key: string): boolean;
}

// ============================================================
// 配置提供者接口
// ============================================================

/** 配置提供者接口 */
export interface ConfigProvider {
  /** 获取设备信息 */
  getDeviceInfo(): Promise<DeviceInfo>;
  /** 获取用户 ID (可选) */
  getUserId?(): Promise<string | undefined>;
}
