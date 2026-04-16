/**
 * 支付宝小程序配置提供者
 * 收集支付宝小程序环境信息和设备信息
 */

import type { Platform, DeviceInfo } from '../../core/types';
import type { ConfigProvider } from '../../adapter/types';

/** 设备信息存储键名 */
const DEVICE_ID_KEY = 'deviceId';
/** 匿名ID存储键名 */
const ANONYMOUS_ID_KEY = 'anonymousId';

/** 支付宝小程序配置提供者 */
export class AlipayConfigProvider implements ConfigProvider {
  /**
   * 获取 my 全局对象，带存在性检查
   */
  private getMy(): typeof my | null {
    if (typeof my === 'undefined' || my === null) {
      return null;
    }
    return my;
  }

  /**
   * 生成随机设备ID
   */
  private generateDeviceId(): string {
    return 'alipay_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const my = this.getMy();
    if (!my) {
      return {
        deviceId: '',
        platform: 'miniapp-alipay' as Platform,
      };
    }

    // 获取或生成设备ID
    let deviceId = '';
    try {
      // 支付宝存储API是异步的，这里使用同步方式获取
      const stored = await this.getStorage(my, DEVICE_ID_KEY);
      if (stored && typeof stored === 'string') {
        deviceId = stored;
      } else {
        // 生成新设备ID并存储
        deviceId = this.generateDeviceId();
        await this.setStorage(my, DEVICE_ID_KEY, deviceId);
      }
    } catch (e) {
      // 存储失败时生成临时ID
      deviceId = this.generateDeviceId();
    }

    // 获取系统信息
    const systemInfo = this.getSystemInfo();

    return {
      deviceId,
      platform: 'miniapp-alipay' as Platform,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      os: systemInfo.platform,
      osVersion: systemInfo.system,
      language: systemInfo.language,
      appVersion: systemInfo.appVersion,
      // 支付宝小程序特有信息
      alipayVersion: systemInfo.version,
      brand: systemInfo.brand,
      model: systemInfo.model,
    };
  }

  /**
   * 异步获取存储值
   */
  private getStorage(myObj: unknown, key: string): Promise<string | null> {
    return new Promise((resolve) => {
      const my = myObj as {
        getStorage(options: {
          key: string;
          success?: (res: { data: unknown }) => void;
          fail?: () => void;
        }): void;
      };
      my.getStorage({
        key,
        success: (res) => {
          resolve(res.data as string);
        },
        fail: () => {
          resolve(null);
        },
      });
    });
  }

  /**
   * 异步设置存储值
   */
  private setStorage(myObj: unknown, key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      const my = myObj as {
        setStorage(options: {
          key: string;
          data: unknown;
          success?: () => void;
          fail?: () => void;
        }): void;
      };
      my.setStorage({
        key,
        data: value,
        success: () => {
          resolve();
        },
        fail: () => {
          resolve();
        },
      });
    });
  }

  /** 获取支付宝小程序系统信息 */
  private getSystemInfo(): {
    screenWidth?: number;
    screenHeight?: number;
    platform?: string;
    system?: string;
    language?: string;
    appVersion?: string;
    version?: string;
    brand?: string;
    model?: string;
  } {
    const my = this.getMy();
    if (!my) return {};

    try {
      // my.getSystemInfo 返回的是同步结果对象
      type SystemInfoResult = {
        screenWidth?: number;
        screenHeight?: number;
        platform?: string;
        system?: string;
        language?: string;
        version?: string;
        brand?: string;
        model?: string;
      };
      const info = (
        my as unknown as { getSystemInfoSync?: () => SystemInfoResult }
      ).getSystemInfoSync?.();
      if (info) {
        return {
          screenWidth: info.screenWidth,
          screenHeight: info.screenHeight,
          platform: info.platform,
          system: info.system,
          language: info.language,
          appVersion: info.version,
          version: info.version,
          brand: info.brand,
          model: info.model,
        };
      }
    } catch (e) {
      // 忽略错误
    }
    return {};
  }

  async getUserId(): Promise<string | undefined> {
    const my = this.getMy();
    if (!my) return undefined;

    try {
      const userId = await this.getStorage(my, 'userId');
      if (userId) {
        return userId;
      }
    } catch (e) {
      // 忽略错误
    }
    return undefined;
  }

  async getAnonymousId(): Promise<string | undefined> {
    const my = this.getMy();
    if (!my) return undefined;

    try {
      const stored = await this.getStorage(my, ANONYMOUS_ID_KEY);
      if (stored) {
        return stored;
      }
      // 生成新的匿名ID并存储
      const anonymousId =
        'a_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
      await this.setStorage(my, ANONYMOUS_ID_KEY, anonymousId);
      return anonymousId;
    } catch (e) {
      // 忽略错误
    }
    return undefined;
  }
}
