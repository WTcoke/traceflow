/**
 * 微信小程序平台入口
 */
export { TraceSDK } from './src/core/SDK';
export {
  WeixinNetworkAdapter,
  WeixinStorageAdapter,
  WeixinConfigProvider,
} from './src/platform/weixin';
export { BasePlugin } from './src/core/BasePlugin';
