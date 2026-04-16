/**
 * 平台检测器
 * 识别当前运行环境并提供平台信息
 */

import type { Platform } from '../core/types';
import type { PlatformDetectionResult, PlatformDetector } from './types';

/** 默认平台检测器实现 */
export class DefaultPlatformDetector implements PlatformDetector {
  detect(): PlatformDetectionResult {
    const platform = this.detectPlatform();
    const env = this.collectEnvironmentInfo(platform);

    return {
      platform,
      env,
      version: this.getPlatformVersion(platform),
    };
  }

  isWeixin(): boolean {
    return this.detectPlatform() === 'miniapp-weixin';
  }

  isAlipay(): boolean {
    return this.detectPlatform() === 'miniapp-alipay';
  }

  isBaidu(): boolean {
    return this.detectPlatform() === 'miniapp-baidu';
  }

  isToutiao(): boolean {
    return this.detectPlatform() === 'miniapp-toutiao';
  }

  isNodeJS(): boolean {
    return this.detectPlatform() === 'nodejs';
  }

  isWeb(): boolean {
    return this.detectPlatform() === 'web';
  }

  /** 检测当前平台类型 */
  private detectPlatform(): Platform {
    // 微信小程序
    if (typeof wx !== 'undefined' && typeof wx.request === 'function') {
      return 'miniapp-weixin';
    }

    // 支付宝小程序
    if (typeof my !== 'undefined' && typeof my.httpRequest === 'function') {
      return 'miniapp-alipay';
    }

    // 百度小程序
    if (typeof swan !== 'undefined' && typeof swan.request === 'function') {
      return 'miniapp-baidu';
    }

    // 头条小程序
    if (typeof tt !== 'undefined' && typeof tt.request === 'function') {
      return 'miniapp-toutiao';
    }

    // Node.js 环境
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'nodejs';
    }

    // 默认为 Web
    return 'web';
  }

  /** 收集环境信息 */
  private collectEnvironmentInfo(platform: Platform): Record<string, unknown> {
    const env: Record<string, unknown> = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      platform,
    };

    // 平台特定信息收集
    switch (platform) {
      case 'miniapp-weixin':
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
          try {
            const systemInfo = wx.getSystemInfoSync();
            Object.assign(env, systemInfo);
          } catch (e) {
            // 忽略错误
          }
        }
        break;
      case 'miniapp-alipay':
        if (typeof my !== 'undefined') {
          try {
            // 支付宝使用 getSystemInfoSync 获取系统信息
            const alipay = my as {
              getSystemInfoSync?: () => {
                screenWidth?: number;
                screenHeight?: number;
                platform?: string;
                system?: string;
                language?: string;
                version?: string;
                brand?: string;
                model?: string;
              };
            };
            const systemInfo = alipay.getSystemInfoSync?.();
            if (systemInfo) {
              Object.assign(env, systemInfo);
            }
          } catch (e) {
            // 忽略错误
          }
        }
        break;
      case 'nodejs':
        if (typeof process !== 'undefined') {
          env.nodeVersion = process.version;
          env.platform = process.platform;
          env.arch = process.arch;
        }
        break;
    }

    return env;
  }

  /** 获取平台版本 */
  private getPlatformVersion(platform: Platform): string | undefined {
    switch (platform) {
      case 'miniapp-weixin':
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
          try {
            const systemInfo = wx.getSystemInfoSync();
            return systemInfo.SDKVersion || systemInfo.version;
          } catch (e) {
            return undefined;
          }
        }
        break;
      case 'miniapp-alipay':
        if (typeof my !== 'undefined') {
          try {
            const alipay = my as {
              getSystemInfoSync?: () => { version?: string };
            };
            const systemInfo = alipay.getSystemInfoSync?.();
            return systemInfo?.version;
          } catch (e) {
            return undefined;
          }
        }
        break;
      case 'nodejs':
        if (typeof process !== 'undefined') {
          return process.version;
        }
        break;
    }
    return undefined;
  }
}

/** 默认检测器实例 */
export const platformDetector = new DefaultPlatformDetector();

/** 便捷函数：检测当前平台 */
export function detectPlatform(): Platform {
  return platformDetector.detect().platform;
}

/** 便捷函数：检查是否为微信小程序 */
export function isWeixin(): boolean {
  return platformDetector.isWeixin();
}

/** 便捷函数：检查是否为支付宝小程序 */
export function isAlipay(): boolean {
  return platformDetector.isAlipay();
}

/** 便捷函数：检查是否为百度小程序 */
export function isBaidu(): boolean {
  return platformDetector.isBaidu();
}

/** 便捷函数：检查是否为头条小程序 */
export function isToutiao(): boolean {
  return platformDetector.isToutiao();
}

/** 便捷函数：检查是否为Node.js */
export function isNodeJS(): boolean {
  return platformDetector.isNodeJS();
}

/** 便捷函数：检查是否为Web */
export function isWeb(): boolean {
  return platformDetector.isWeb();
}
