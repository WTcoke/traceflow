/**
 * 微信小程序存储适配器
 */

import type { IStorageAdapter } from '../../adapter/types';

/** 微信小程序存储类型 */
export type WeixinStorageType = 'local' | 'session';

/** 微信小程序存储适配器 */
export class WeixinStorageAdapter implements IStorageAdapter {
  private prefix: string;

  constructor(type: WeixinStorageType = 'local', prefix: string = 'trace_') {
    this.prefix = prefix;
    // 标记 type 参数为已使用（避免警告）
    void type;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 获取 wx 全局对象，带存在性检查
   */
  private getWx(): typeof wx | null {
    if (typeof wx === 'undefined' || wx === null) {
      return null;
    }
    return wx;
  }

  get(key: string): string | null {
    const wx = this.getWx();
    if (!wx) return null;

    try {
      const value = wx.getStorageSync(this.getKey(key));
      if (value === null || value === undefined) {
        return null;
      }
      // 检查是否过期
      if (
        typeof value === 'object' &&
        value &&
        'expire' in value &&
        typeof value.expire === 'number'
      ) {
        if (Date.now() > value.expire) {
          this.remove(key);
          return null;
        }
        if ('value' in value && typeof value.value === 'string') {
          return value.value;
        }
      }
      return String(value);
    } catch (e) {
      return null;
    }
  }

  set(key: string, value: string, expire?: number): void {
    const wx = this.getWx();
    if (!wx) return;

    try {
      if (expire) {
        const data = {
          value,
          expire: Date.now() + expire,
        };
        wx.setStorageSync(this.getKey(key), data);
      } else {
        wx.setStorageSync(this.getKey(key), value);
      }
    } catch (e) {
      // ignore
    }
  }

  remove(key: string): void {
    const wx = this.getWx();
    if (!wx) return;

    try {
      wx.removeStorageSync(this.getKey(key));
    } catch (e) {
      // ignore
    }
  }

  clear(): void {
    const wx = this.getWx();
    if (!wx) return;

    try {
      const info = wx.getStorageInfoSync();
      if (info && info.keys) {
        info.keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            wx.removeStorageSync(key);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }

  keys(): string[] {
    const wx = this.getWx();
    if (!wx) return [];

    try {
      const info = wx.getStorageInfoSync();
      if (info && info.keys) {
        return info.keys
          .filter((key) => key.startsWith(this.prefix))
          .map((key) => key.substring(this.prefix.length));
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
