/**
 * 百度小程序存储适配器
 */

import type { IStorageAdapter } from '../../adapter/types';

/** 百度小程序存储适配器 */
export class BaiduStorageAdapter implements IStorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'trace_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get(key: string): string | null {
    try {
      const value = swan!.getStorageSync(this.getKey(key));
      if (value === null || value === undefined) {
        return null;
      }
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
    try {
      if (expire) {
        const data = { value, expire: Date.now() + expire };
        swan!.setStorageSync(this.getKey(key), data);
      } else {
        swan!.setStorageSync(this.getKey(key), value);
      }
    } catch (e) {
      // ignore
    }
  }

  remove(key: string): void {
    try {
      swan!.removeStorageSync(this.getKey(key));
    } catch (e) {
      // ignore
    }
  }

  clear(): void {
    try {
      const info = swan!.getStorageInfoSync();
      if (info && info.keys) {
        info.keys.forEach((key) => {
          if (key.startsWith(this.prefix)) {
            swan!.removeStorageSync(key);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }

  keys(): string[] {
    try {
      const info = swan!.getStorageInfoSync();
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
