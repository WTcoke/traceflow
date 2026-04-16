/**
 * 平台模块入口
 */

export * from './types';
export * from './detector';

// 导出各平台模块
export * as weixin from './weixin';
export * as alipay from './alipay';
export * as baidu from './baidu';
export * as toutiao from './toutiao';
export * as nodejs from './nodejs';
export * as web from './web';

// 便捷导出
export { platformDetector, detectPlatform } from './detector';
export type { PlatformDetector, PlatformDetectionResult } from './types';
