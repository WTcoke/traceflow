/**
 * 适配器模块入口
 */

import { PlatformAdapterFactory as PlatformAdapterFactoryClass } from './PlatformAdapterFactory';

// 导出适配器类型（统一来源）
export type { INetworkAdapter, IStorageAdapter, ConfigProvider } from './types';

// 导出适配器基类
export { BaseNetworkAdapter } from './base/BaseNetworkAdapter';
export { BaseStorageAdapter } from './base/BaseStorageAdapter';

// 导出工厂类
export const PlatformAdapterFactory = PlatformAdapterFactoryClass;

// 便捷导出：创建适配器的快捷方法
export const createAdaptersByDetection =
  PlatformAdapterFactory.createAdaptersByDetection.bind(PlatformAdapterFactory);
