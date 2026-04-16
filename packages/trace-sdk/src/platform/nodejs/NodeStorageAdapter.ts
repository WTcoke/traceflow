/**
 * Node.js 存储适配器
 * 使用内存存储（适用于无持久化需求的场景）
 */

import type { IStorageAdapter } from '../../adapter/types';

/** Node.js 存储适配器 */
export class NodeStorageAdapter implements IStorageAdapter {
  private prefix: string;
  private storage: Map<string, { value: string; expire?: number }>;

  constructor(prefix: string = 'trace_') {
    this.prefix = prefix;
    this.storage = new Map();
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get(key: string): string | null {
    const item = this.storage.get(this.getKey(key));
    if (!item) return null;

    if (item.expire && Date.now() > item.expire) {
      this.remove(key);
      return null;
    }

    return item.value;
  }

  set(key: string, value: string, expire?: number): void {
    this.storage.set(this.getKey(key), {
      value,
      expire: expire ? Date.now() + expire : undefined,
    });
  }

  remove(key: string): void {
    this.storage.delete(this.getKey(key));
  }

  clear(): void {
    // 只清除带前缀的
    for (const key of this.storage.keys()) {
      if (key.startsWith(this.prefix)) {
        this.storage.delete(key);
      }
    }
  }

  keys(): string[] {
    const result: string[] = [];
    for (const key of this.storage.keys()) {
      if (key.startsWith(this.prefix)) {
        result.push(key.substring(this.prefix.length));
      }
    }
    return result;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
