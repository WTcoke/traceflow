/**
 * 微信小程序配置提供者
 * 收集微信小程序环境信息和设备信息
 */

import type { Platform, DeviceInfo } from '../../core/types';
import type { ConfigProvider } from '../../adapter/types';

/** 微信小程序配置提供者 */
export class WeixinConfigProvider implements ConfigProvider {
  async getDeviceInfo(): Promise<DeviceInfo> {
    // 尝试从存储获取设备ID
    let deviceId = '';
    try {
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        const storedDeviceId = wx.getStorageSync('deviceId');
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
      platform: 'miniapp-weixin' as Platform,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      os: systemInfo.platform,
      osVersion: systemInfo.system,
      language: systemInfo.language,
      sdkVersion: systemInfo.SDKVersion,
      // 微信小程序特有信息
      weixinVersion: systemInfo.version,
      brand: systemInfo.brand,
      model: systemInfo.model,
    };
  }

  /** 获取微信小程序系统信息 */
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
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      try {
        return wx.getSystemInfoSync();
      } catch (e) {
        // 忽略错误
      }
    }
    return {};
  }

  async getUserId(): Promise<string | undefined> {
    try {
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        const userId = wx.getStorageSync('userId');
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
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        const anonymousId = wx.getStorageSync('anonymous_id');
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
