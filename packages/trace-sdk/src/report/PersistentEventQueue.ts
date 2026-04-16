import type { TraceEvent } from '../core/types';
import type { IStorageAdapter } from '../adapter/types';
import { EventQueue, type QueueConfig } from './EventQueue';
import { PersistentStorage, type PersistentStorageConfig } from '../storage/PersistentStorage';
import { WebStorageAdapter } from '../platform/web/WebStorageAdapter';
import {
  crossSetTimeout,
  crossSetInterval,
  crossClearTimeout,
  crossClearInterval,
  type TimerId,
} from '../utils/timer';

/**
 * 持久化事件队列配置
 */
export interface PersistentQueueConfig extends QueueConfig {
  /** 存储适配器（可选，未提供时创建默认持久化存储） */
  storageAdapter?: IStorageAdapter;
  /** 持久化存储配置（可选） */
  persistentConfig?: Omit<PersistentStorageConfig, 'adapter'>;
  /** 存储键前缀（默认 'queue_'） */
  storageKeyPrefix?: string;
  /** 是否在初始化时从存储加载事件（默认 true） */
  loadOnInit?: boolean;
  /** 是否自动保存事件到存储（默认 true） */
  autoSave?: boolean;
  /** 保存间隔（毫秒，默认 1000） */
  saveInterval?: number;
}

/**
 * 持久化事件队列
 * 在内存队列基础上增加本地存储能力
 */
export class PersistentEventQueue extends EventQueue {
  private storage: PersistentStorage;
  private saveTimer: TimerId | null = null;
  private autoSaveTimer: TimerId | null = null;
  private pendingSave: boolean = false;
  private storageKeyPrefix: string;
  private persistentConfig: {
    storageAdapter?: IStorageAdapter;
    persistentConfig?: Omit<PersistentStorageConfig, 'adapter'>;
    storageKeyPrefix: string;
    loadOnInit: boolean;
    autoSave: boolean;
    saveInterval: number;
  };

  constructor(config: PersistentQueueConfig = {}) {
    // 先调用父类构造函数
    super(config);

    // 确定存储适配器
    const adapter = config.storageAdapter || this.createDefaultAdapter();

    // 初始化存储
    this.storage = new PersistentStorage({
      adapter,
      maxSize: config.persistentConfig?.maxSize ?? 5 * 1024 * 1024,
      maxEntries: config.persistentConfig?.maxEntries ?? 1000,
      defaultExpire: config.persistentConfig?.defaultExpire ?? 7 * 24 * 60 * 60 * 1000,
      autoCleanup: config.persistentConfig?.autoCleanup ?? true,
    });

    this.storageKeyPrefix = config.storageKeyPrefix ?? 'queue_';
    this.persistentConfig = {
      storageAdapter: config.storageAdapter,
      persistentConfig: config.persistentConfig || {},
      storageKeyPrefix: config.storageKeyPrefix ?? 'queue_',
      loadOnInit: config.loadOnInit ?? true,
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval ?? 1000,
    };

    // 初始化时从存储加载事件
    if (this.persistentConfig.loadOnInit) {
      this.loadFromStorage();
    }

    // 启动自动保存定时器
    if (this.persistentConfig.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 添加事件到队列（并持久化）
   */
  push(event: TraceEvent): boolean {
    const result = super.push(event);

    if (result && this.persistentConfig.autoSave) {
      this.scheduleSave();
    }

    return result;
  }

  /**
   * 批量添加事件
   */
  pushBatch(events: TraceEvent[]): void {
    super.pushBatch(events);

    if (this.persistentConfig.autoSave && events.length > 0) {
      this.scheduleSave();
    }
  }

  /**
   * 取出待上报事件（并从存储中删除）
   */
  pop(count?: number): TraceEvent[] {
    const events = super.pop(count);

    if (events.length > 0 && this.persistentConfig.autoSave) {
      this.scheduleSave();
    }

    return events;
  }

  /**
   * 清空队列（并从存储中删除）
   */
  clear(): TraceEvent[] {
    const events = super.clear();

    // 清理存储中的事件
    this.clearStorage();

    return events;
  }

  /**
   * 移除特定事件（并从存储中删除）
   */
  remove(eventId: string): boolean {
    const result = super.remove(eventId);

    if (result && this.persistentConfig.autoSave) {
      // 从存储中删除该事件
      this.storage.remove(this.getEventStorageKey(eventId));
      this.saveMetadata();
    }

    return result;
  }

  /**
   * 销毁队列，释放资源
   */
  destroy(): void {
    this.stopAutoSave();

    // 确保保存未保存的更改
    if (this.pendingSave) {
      this.saveToStorage();
    }

    // 清空内存队列但保留存储
    super.clear();
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    return this.storage.getStats();
  }

  /**
   * 手动保存到存储
   */
  save(): void {
    this.saveToStorage();
  }

  /**
   * 手动从存储加载
   */
  load(): void {
    this.loadFromStorage();
  }

  /**
   * 获取队列中所有事件的 ID
   */
  getEventIds(): string[] {
    const queue = this.getQueue();
    return queue.map((e) => e.eventId);
  }

  private createDefaultAdapter(): IStorageAdapter {
    // 默认使用 Web localStorage
    return new WebStorageAdapter('local');
  }

  private getEventStorageKey(eventId: string): string {
    return `${this.storageKeyPrefix}event_${eventId}`;
  }

  private getMetadataKey(): string {
    return `${this.storageKeyPrefix}metadata`;
  }

  private loadFromStorage(): void {
    try {
      // 加载元数据获取事件 ID 列表
      const metadata = this.storage.get(this.getMetadataKey());
      if (!metadata) return;

      const eventIds = JSON.parse(metadata) as string[];

      // 按顺序加载事件
      for (const eventId of eventIds) {
        const eventData = this.storage.get(this.getEventStorageKey(eventId));
        if (eventData) {
          try {
            const event = JSON.parse(eventData) as TraceEvent;
            // 检查事件是否过期（基于 _createdAt）
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 天
            if (event._createdAt && Date.now() - event._createdAt > maxAge) {
              // 过期事件，删除
              this.storage.remove(this.getEventStorageKey(eventId));
              continue;
            }

            // 添加到内存队列（跳过容量检查，因为存储中已存在）
            super.push(event);
          } catch {
            // 解析失败，删除损坏的数据
            this.storage.remove(this.getEventStorageKey(eventId));
          }
        }
      }

      // 重新保存元数据（清理无效条目）
      this.saveMetadata();
    } catch (error) {
      console.error('[PersistentEventQueue] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const eventIds: string[] = [];
      const queue = this.getQueue();

      // 保存每个事件
      for (const event of queue) {
        const eventKey = this.getEventStorageKey(event.eventId);
        this.storage.set(eventKey, JSON.stringify(event));
        eventIds.push(event.eventId);
      }

      // 保存元数据（事件 ID 列表）
      this.saveMetadata(eventIds);

      this.pendingSave = false;
    } catch (error) {
      console.error('[PersistentEventQueue] Failed to save to storage:', error);
    }
  }

  private saveMetadata(eventIds?: string[]): void {
    if (!eventIds) {
      // 从当前队列生成
      const queue = this.getQueue();
      eventIds = queue.map((e) => e.eventId);
    }

    this.storage.set(this.getMetadataKey(), JSON.stringify(eventIds));
  }

  private clearStorage(): void {
    // 清理所有相关键
    const keys = this.storage.keys();
    for (const key of keys) {
      if (key.startsWith(this.storageKeyPrefix)) {
        this.storage.remove(key);
      }
    }
  }

  private scheduleSave(): void {
    if (!this.persistentConfig.autoSave) return;

    this.pendingSave = true;

    // 如果已经有 setTimeout 定时器，不重复设置
    if (this.saveTimer !== null) return;

    this.saveTimer = crossSetTimeout!(() => {
      if (this.pendingSave) {
        this.saveToStorage();
      }
      this.saveTimer = null;
    }, this.persistentConfig.saveInterval);
  }

  private startAutoSave(): void {
    // 如果已经有任何定时器，不重复设置
    if (this.autoSaveTimer !== null) return;

    // 定期保存，即使没有新事件（防止数据丢失）
    this.autoSaveTimer = crossSetInterval!(
      () => {
        if (this.pendingSave) {
          this.saveToStorage();
        }
      },
      Math.max(this.persistentConfig.saveInterval * 5, 5000),
    ); // 至少 5 秒
  }

  private stopAutoSave(): void {
    // 清理 scheduleSave 的 setTimeout
    if (this.saveTimer !== null) {
      crossClearTimeout!(this.saveTimer);
      this.saveTimer = null;
    }
    // 清理 startAutoSave 的 setInterval
    if (this.autoSaveTimer !== null) {
      crossClearInterval!(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

/**
 * 创建默认的持久化事件队列
 */
export function createDefaultPersistentEventQueue(): PersistentEventQueue {
  return new PersistentEventQueue({
    maxSize: 500,
    batchSize: 10,
    enablePriority: true,
    loadOnInit: true,
    autoSave: true,
    saveInterval: 1000,
  });
}
