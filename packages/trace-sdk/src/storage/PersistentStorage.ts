import type { IStorageAdapter } from '../adapter/types';
import { BaseStorageAdapter } from '../adapter/base/BaseStorageAdapter';

/**
 * 持久化存储配置
 */
export interface PersistentStorageConfig {
  /** 存储适配器（底层实现） */
  adapter: IStorageAdapter;
  /** 最大存储容量（字节数，可选） */
  maxSize?: number;
  /** 最大存储条目数（可选） */
  maxEntries?: number;
  /** 默认过期时间（毫秒，可选） */
  defaultExpire?: number;
  /** 是否自动清理过期数据（默认 true） */
  autoCleanup?: boolean;
}

/**
 * 存储条目元数据
 */
interface StorageEntryMeta {
  /** 数据键 */
  key: string;
  /** 存储时间戳 */
  storedAt: number;
  /** 过期时间戳（可选） */
  expireAt?: number;
  /** 数据大小（字节） */
  size: number;
}

/**
 * 持久化存储包装器
 * 提供容量管理、过期清理等高级功能
 */
export class PersistentStorage extends BaseStorageAdapter {
  private adapter: IStorageAdapter;
  private config: Required<PersistentStorageConfig>;
  private metaKey: string;
  private entriesMeta: Map<string, StorageEntryMeta>;

  constructor(config: PersistentStorageConfig) {
    // 使用适配器的前缀
    super(
      config.adapter instanceof BaseStorageAdapter
        ? (config.adapter as BaseStorageAdapter).getPrefix()
        : 'persistent_',
    );

    this.adapter = config.adapter;
    this.config = {
      maxSize: config.maxSize ?? 10 * 1024 * 1024, // 默认 10MB
      maxEntries: config.maxEntries ?? 1000, // 默认 1000 条
      defaultExpire: config.defaultExpire ?? 7 * 24 * 60 * 60 * 1000, // 默认 7 天
      autoCleanup: config.autoCleanup ?? true,
      adapter: config.adapter,
    };

    this.metaKey = '_meta';
    this.entriesMeta = new Map();

    // 初始化时加载元数据
    this.loadMetadata();

    // 如果启用自动清理，启动时清理过期数据
    if (this.config.autoCleanup) {
      this.cleanupExpired();
    }
  }

  /**
   * 获取数据
   */
  get(key: string): string | null {
    // 检查是否过期
    const meta = this.entriesMeta.get(key);
    if (meta && meta.expireAt && Date.now() > meta.expireAt) {
      this.remove(key);
      return null;
    }

    const data = this.adapter.get(key);
    if (data && this.config.autoCleanup) {
      // 更新最后访问时间
      this.updateMeta(key, { storedAt: Date.now() });
    }

    return data;
  }

  /**
   * 设置数据
   */
  set(key: string, value: string, expire?: number): void {
    const size = new Blob([value]).size;
    const expireAt = expire
      ? Date.now() + expire
      : this.config.defaultExpire
        ? Date.now() + this.config.defaultExpire
        : undefined;

    // 检查容量限制
    this.ensureCapacity(size);

    // 存储数据
    this.adapter.set(key, value, expire);

    // 更新元数据
    const meta: StorageEntryMeta = {
      key,
      storedAt: Date.now(),
      expireAt,
      size,
    };

    this.entriesMeta.set(key, meta);
    this.saveMetadata();

    // 如果启用自动清理，检查是否需要清理
    if (this.config.autoCleanup) {
      this.cleanupIfNeeded();
    }
  }

  /**
   * 删除数据
   */
  remove(key: string): void {
    this.adapter.remove(key);
    this.entriesMeta.delete(key);
    this.saveMetadata();
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.adapter.clear();
    this.entriesMeta.clear();
    this.saveMetadata();
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.entriesMeta.keys());
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return this.entriesMeta.has(key) && this.get(key) !== null;
  }

  /**
   * 获取存储统计信息
   */
  getStats(): {
    totalSize: number;
    totalEntries: number;
    usage: number; // 0-1
  } {
    let totalSize = 0;
    for (const meta of this.entriesMeta.values()) {
      totalSize += meta.size;
    }

    const usage = Math.min(totalSize / this.config.maxSize, 1);

    return {
      totalSize,
      totalEntries: this.entriesMeta.size,
      usage,
    };
  }

  /**
   * 清理过期数据
   */
  cleanupExpired(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, meta] of this.entriesMeta.entries()) {
      if (meta.expireAt && meta.expireAt < now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.remove(key);
    }

    return expiredKeys.length;
  }

  /**
   * 获取底层适配器
   */
  getAdapter(): IStorageAdapter {
    return this.adapter;
  }

  private loadMetadata(): void {
    try {
      const metaData = this.adapter.get(this.metaKey);
      if (metaData) {
        const parsed = JSON.parse(metaData);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: StorageEntryMeta) => {
            this.entriesMeta.set(item.key, item);
          });
        }
      }
    } catch {
      // 忽略解析错误
    }
  }

  private saveMetadata(): void {
    const metaArray = Array.from(this.entriesMeta.values());
    this.adapter.set(this.metaKey, JSON.stringify(metaArray));
  }

  private updateMeta(key: string, updates: Partial<StorageEntryMeta>): void {
    const existing = this.entriesMeta.get(key);
    if (existing) {
      this.entriesMeta.set(key, { ...existing, ...updates });
      this.saveMetadata();
    }
  }

  private ensureCapacity(newSize: number): void {
    const stats = this.getStats();

    // 检查容量限制
    if (stats.totalSize + newSize > this.config.maxSize) {
      this.cleanupOldest();
    }

    // 检查条目数限制
    if (this.entriesMeta.size >= this.config.maxEntries) {
      this.cleanupOldest();
    }
  }

  private cleanupIfNeeded(): void {
    const stats = this.getStats();
    if (stats.usage > 0.9) {
      // 使用率超过 90%
      this.cleanupOldest();
    }
  }

  private cleanupOldest(): number {
    // 按存储时间排序，删除最旧的数据
    const sorted = Array.from(this.entriesMeta.entries()).sort(
      ([, a], [, b]) => a.storedAt - b.storedAt,
    );

    let removedCount = 0;
    let removedSize = 0;
    const targetSize = this.config.maxSize * 0.2; // 清理 20% 的空间

    for (const [key, meta] of sorted) {
      if (removedSize >= targetSize || removedCount >= 10) {
        break;
      }

      this.remove(key);
      removedCount++;
      removedSize += meta.size;

      if (removedSize >= targetSize || removedCount >= 10) {
        break;
      }
    }

    return removedCount;
  }
}

/**
 * 创建默认的持久化存储
 * @param adapter - 存储适配器（必须由调用方提供）
 */
export function createDefaultPersistentStorage(adapter: IStorageAdapter): PersistentStorage {
  return new PersistentStorage({
    adapter,
    maxSize: 5 * 1024 * 1024, // 5MB
    maxEntries: 500,
    defaultExpire: 7 * 24 * 60 * 60 * 1000, // 7 天
  });
}
