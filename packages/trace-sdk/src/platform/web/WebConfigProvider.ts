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
   * 收集设备信息
   */
  private async collectDeviceInfo(): Promise<DeviceInfo> {
    // SSR 环境中 navigator/window 不存在，需要检查
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    return {
      deviceId: this.getDeviceId(),
      platform: 'web' as Platform,
      userAgent: ua,
      os: this.parseOS(ua),
      browser: this.parseBrowser(ua),
    };
  }

  private parseOS(ua: string): string {
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  private parseBrowser(ua: string): string {
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('IE')) return 'IE';
    return 'Unknown';
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getDeviceId(): string {
    let deviceId = this.storageAdapter.get('device_id');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      this.storageAdapter.set('device_id', deviceId);
    }
    return deviceId;
  }
}
