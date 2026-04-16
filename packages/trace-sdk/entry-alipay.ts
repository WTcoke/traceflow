/**
 * 支付宝小程序平台入口
 */
export { TraceSDK } from './src/core/SDK';
export {
  AlipayNetworkAdapter,
  AlipayStorageAdapter,
  AlipayConfigProvider,
} from './src/platform/alipay';
export { BasePlugin } from './src/core/BasePlugin';
