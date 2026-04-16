/**
 * 头条小程序配置提供者
 * 收集头条小程序环境信息和设备信息
 */

import type { Platform, DeviceInfo } from '../../core/types';
import type { ConfigProvider } from '../../adapter/types';

/** 头条小程序配置提供者 */
export class ToutiaoConfigProvider implements ConfigProvider {
  async getDeviceInfo(): Promise<DeviceInfo> {
    // 尝试从存储获取设备ID
    let deviceId = '';
    try {
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        const storedDeviceId = tt.getStorageSync('deviceId');
        if (storedDeviceId && typeof storedDeviceId === 'string') {
          deviceId = storedDeviceId;
        }
      }
    } catch (e) {
      // 忽略错误
    }

    // 获取系统信息
    const systemInfo = this.getSystemInfo();

    return {
      deviceId,
      platform: 'miniapp-toutiao' as Platform,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      os: systemInfo.platform,
      osVersion: systemInfo.system,
      language: systemInfo.language,
      sdkVersion: systemInfo.SDKVersion,
      // 头条小程序特有信息
      ttVersion: systemInfo.version,
      brand: systemInfo.brand,
      model: systemInfo.model,
    };
  }

  /** 获取头条小程序系统信息 */
  private getSystemInfo(): {
    screenWidth?: number;
    screenHeight?: number;
    platform?: string;
    system?: string;
    language?: string;
    SDKVersion?: string;
    version?: string;
    brand?: string;
    model?: string;
  } {
    if (typeof tt !== 'undefined' && tt.getSystemInfoSync) {
      try {
        return tt.getSystemInfoSync();
      } catch (e) {
        // 忽略错误
      }
    }
    return {};
  }

  async getUserId(): Promise<string | undefined> {
    try {
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        const userId = tt.getStorageSync('userId');
        if (userId && typeof userId === 'string') {
          return userId;
        }
      }
    } catch (e) {
      // 忽略错误
    }
    return undefined;
  }

  async getAnonymousId(): Promise<string | undefined> {
    try {
      if (typeof tt !== 'undefined' && tt.getStorageSync) {
        const anonymousId = tt.getStorageSync('anonymous_id');
        if (anonymousId && typeof anonymousId === 'string') {
          return anonymousId;
        }
      }
    } catch (e) {
      // 忽略错误
    }
    return undefined;
  }
}
