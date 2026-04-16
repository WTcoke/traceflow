/**
 * 存储适配器抽象基类
 * 提供通用的键名前缀管理
 */

import type { IStorageAdapter } from '../types';

/**
 * 存储适配器抽象基类
 * 提供键名前缀管理功能
 */
export abstract class BaseStorageAdapter implements IStorageAdapter {
  protected prefix: string;

  constructor(prefix: string = 'trace_') {
    this.prefix = prefix;
  }

  /** 获取前缀（公开访问） */
  getPrefix(): string {
    return this.prefix;
  }

  /** 添加前缀的键名 */
  protected getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  abstract get(key: string): string | null;
  abstract set(key: string, value: string, expire?: number): void;
  abstract remove(key: string): void;
  abstract clear(): void;
  abstract keys(): string[];
  abstract has(key: string): boolean;
}
