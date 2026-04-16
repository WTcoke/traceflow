/**
 * Web 平台配置提供者
 */

import type { DeviceInfo, Platform } from '../../core/types';
import type { IStorageAdapter, ConfigProvider } from '../../adapter/types';
import { WebStorageAdapter } from './WebStorageAdapter';

export class WebConfigProvider implements ConfigProvider {
  private deviceInfo?: DeviceInfo;
  private storageAdapter: IStorageAdapter;

  constructor(storageAdapter?: IStorageAdapter) {
    this.storageAdapter = storageAdapter ?? new WebStorageAdapter('local');
  }

  /**
   * 获取设备信息
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    this.deviceInfo = await this.collectDeviceInfo();
    return this.deviceInfo;
  }

  /**
   * 获取用户 ID
   */
  async getUserId(): Promise<string | undefined> {
    return this.storageAdapter.get('user_id') || undefined;
  }

  /**
   * 获取匿名 ID
   */
  async getAnonymousId(): Promise<string | undefined> {
    let anonId = this.storageAdapter.get('anonymous_id');
    if (!anonId) {
      anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      this.storageAdapter.set('anonymous_id', anonId);
    }
    return anonId;
  }

  /**
   * 收集设备信息
   */
  private async collectDeviceInfo(): Promise<DeviceInfo> {
    // SSR 环境中 navigator/window 不存在，需要检查
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const screen = typeof window !== 'undefined' ? window.screen : { width: 0, height: 0 };
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'unknown';

    return {
      deviceId: (await this.getAnonymousId()) || this.generateDeviceId(),
      platform: 'web' as Platform,
      userAgent: ua,
      screenWidth: screen.width,
      screenHeight: screen.height,
      language: lang,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      os: this.parseOS(ua),
      browser: this.parseBrowser(ua),
    };
  }

  private parseOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private parseBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('IE')) return 'IE';
    return 'Unknown';
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
