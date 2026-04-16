import { BaseStorageAdapter } from '../../adapter/base/BaseStorageAdapter';

/**
 * Web 端存储适配器实现
 * 支持 LocalStorage 和 SessionStorage
 */
export class WebStorageAdapter extends BaseStorageAdapter {
  private storage: Storage;

  /**
   * @param type - 存储类型，'local' 或 'session'
   * @param prefix - 键名前缀
   */
  constructor(type: 'local' | 'session' = 'local', prefix: string = 'trace_') {
    super(prefix);
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  /**
   * 获取数据
   */
  get(key: string): string | null {
    const raw = this.storage.getItem(this.getKey(key));
    if (!raw) return null;

    try {
      const item = JSON.parse(raw);
      if (item.expire && Date.now() > item.expire) {
        this.remove(key);
        return null;
      }
      return item.value;
    } catch {
      return raw;
    }
  }

  /**
   * 设置数据
   */
  set(key: string, value: string, expire?: number): void {
    const data: { value: string; expire?: number } = { value };
    if (expire) {
      data.expire = Date.now() + expire;
    }
    this.storage.setItem(this.getKey(key), JSON.stringify(data));
  }

  /**
   * 删除数据
   */
  remove(key: string): void {
    this.storage.removeItem(this.getKey(key));
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    const prefix = this.prefix;
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => this.storage.removeItem(key));
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    const prefix = this.prefix;
    const result: string[] = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(prefix)) {
        result.push(key.substring(prefix.length));
      }
    }

    return result;
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// 导出单例（延迟初始化，避免在非浏览器环境中立即执行）
let _localStorageAdapter: WebStorageAdapter | null = null;
let _sessionStorageAdapter: WebStorageAdapter | null = null;

export const localStorageAdapter = new Proxy({} as WebStorageAdapter, {
  get(_target, prop, receiver) {
    if (!_localStorageAdapter) {
      _localStorageAdapter = new WebStorageAdapter('local');
    }
    const value = Reflect.get(_localStorageAdapter, prop, receiver);
    return typeof value === 'function' ? value.bind(_localStorageAdapter) : value;
  },
});

export const sessionStorageAdapter = new Proxy({} as WebStorageAdapter, {
  get(_target, prop, receiver) {
    if (!_sessionStorageAdapter) {
      _sessionStorageAdapter = new WebStorageAdapter('session');
    }
    const value = Reflect.get(_sessionStorageAdapter, prop, receiver);
    return typeof value === 'function' ? value.bind(_sessionStorageAdapter) : value;
  },
});
