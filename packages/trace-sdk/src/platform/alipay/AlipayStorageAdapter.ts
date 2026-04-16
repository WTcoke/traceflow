/**
 * 支付宝小程序存储适配器
 */

import type { IStorageAdapter } from '../../adapter/types';

/** 支付宝存储适配器 */
export class AlipayStorageAdapter implements IStorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'trace_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 获取 my 全局对象，带存在性检查
   */
  private getMy(): typeof my | null {
    if (typeof my === 'undefined' || my === null) {
      return null;
    }
    return my;
  }

  get(key: string): string | null {
    const my = this.getMy();
    if (!my) return null;

    try {
      const res = my.getStorage({ key: this.getKey(key) });
      const value = res.data;
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
    const my = this.getMy();
    if (!my) return;

    try {
      const storageKey = this.getKey(key);
      if (expire) {
        const data = { value, expire: Date.now() + expire };
        my.setStorage({ key: storageKey, data });
      } else {
        my.setStorage({ key: storageKey, data: value });
      }
    } catch (e) {
      // ignore
    }
  }

  remove(key: string): void {
    const my = this.getMy();
    if (!my) return;

    try {
      my.removeStorage({ key: this.getKey(key) });
    } catch (e) {
      // ignore
    }
  }

  clear(): void {
    const my = this.getMy();
    if (!my) return;

    try {
      // 只清除带前缀的键，避免清空用户其他数据
      const info = my.getStorageInfoSync?.();
      if (info && info.keys) {
        info.keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            my.removeStorage({ key });
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }

  keys(): string[] {
    const my = this.getMy();
    if (!my) return [];

    try {
      const info = my.getStorageInfoSync?.();
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
