/**
 * Web平台模块
 */

// 网络适配器
export { WebNetworkAdapter } from './WebNetworkAdapter';

// 存储适配器
export { WebStorageAdapter, localStorageAdapter, sessionStorageAdapter } from './WebStorageAdapter';

// 配置提供者
export { WebConfigProvider } from './WebConfigProvider';
export { WebLifecycleReporter } from './WebLifecycleReporter';
export type { IWebNetworkAdapter, WebOptions } from './types';
