/**
 * Web 平台入口
 * 用于 CDN 和独立 Web 应用
 */
export { TraceSDK } from './src/core/SDK';
export {
  WebNetworkAdapter,
  WebStorageAdapter,
  localStorageAdapter,
  sessionStorageAdapter,
  WebConfigProvider,
} from './src/platform/web';
export { WebErrorPlugin } from './src/plugins/web/ErrorPlugin';
export { WebPageViewPlugin } from './src/plugins/web/PageViewPlugin';
export { WebClickPlugin } from './src/plugins/web/ClickPlugin';
export { WebPerformancePlugin } from './src/plugins/web/PerformancePlugin';
export { BasePlugin } from './src/core/BasePlugin';
