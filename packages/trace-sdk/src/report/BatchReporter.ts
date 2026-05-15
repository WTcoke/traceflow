import type { TraceEvent } from '../core/types';
import { EventQueue } from './EventQueue';
import { PersistentEventQueue, type PersistentQueueConfig } from './PersistentEventQueue';
import { crossSetInterval, crossClearInterval, type TimerId } from '../utils/timer';

/**
 * 批量上报器配置
 */
export interface BatchReporterConfig {
  /** 批量大小 */
  batchSize?: number;
  /** 上报间隔 (ms) */
  flushInterval?: number;
  /** 单个事件最大失败重试次数（默认 3） */
  maxRetries?: number;
  /** 是否自动启动 */
  autoStart?: boolean;
  /** 是否使用持久化队列（默认 false） */
  usePersistentQueue?: boolean;
  /** 持久化队列配置（当 usePersistentQueue 为 true 时有效） */
  persistentQueueConfig?: PersistentQueueConfig;
}

/**
 * 批量上报器
 * 实现定时 + 定量双触发批量上报
 */
export class BatchReporter {
  private queue: EventQueue;
  private config: Required<BatchReporterConfig>;
  private flushTimer: TimerId | null = null;
  private isFlushing: boolean = false;
  private sendFn: (events: TraceEvent[]) => Promise<void>;
  private onFinalFailure?: (event: TraceEvent, error: Error) => void;

  constructor(
    sendFn: (events: TraceEvent[]) => Promise<void>,
    config: BatchReporterConfig = {},
    callbacks?: {
      onFinalFailure?: (event: TraceEvent, error: Error) => void;
    },
  ) {
    this.config = {
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 3000,
      maxRetries: config.maxRetries ?? 3,
      autoStart: config.autoStart ?? true,
      usePersistentQueue: config.usePersistentQueue ?? false,
      persistentQueueConfig: config.persistentQueueConfig ?? {},
    };

    if (this.config.usePersistentQueue) {
      this.queue = new PersistentEventQueue({
        batchSize: this.config.batchSize,
        ...this.config.persistentQueueConfig,
      });
    } else {
      this.queue = new EventQueue({ batchSize: this.config.batchSize });
    }

    this.sendFn = sendFn;
    this.onFinalFailure = callbacks?.onFinalFailure;

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * 添加事件
   */
  push(event: TraceEvent): void {
    this.queue.push(event);

    // 检查是否达到批量条件
    if (this.queue.isBatchReady()) {
      // 异步 flush，不阻塞，但记录错误
      this.flush().catch((error) => {
        console.error('[BatchReporter] flush error:', error);
      });
    }
  }

  /**
   * 批量添加事件
   */
  pushBatch(events: TraceEvent[]): void {
    for (const event of events) {
      this.push(event);
    }
  }

  peek(count: number = this.config.batchSize): TraceEvent[] {
    return this.queue.peek(count);
  }

  remove(count: number): TraceEvent[] {
    return this.queue.pop(count);
  }

  /**
   * 触发上报
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.isEmpty()) {
      return;
    }

    this.isFlushing = true;
    const eventsToSend = this.queue.peek(this.config.batchSize);

    try {
      // 使用 peek() 而非 getBatch()，避免事件被提前移除
      if (eventsToSend.length === 0) {
        return;
      }

      await this.sendFn(eventsToSend);

      // 发送成功：从队列移除已发送的事件
      for (const event of eventsToSend) {
        this.queue.remove(event.msgId);
      }
    } catch (error) {
      // 发送失败：eventsToSend 仍在队列中（因为只 peek 没 pop）
      // 普通批量事件只保留在批量队列中，避免同时进入独立重试队列导致重复上报。
      for (const event of eventsToSend) {
        const updated = this.queue.update(event.msgId, (current) => ({
          ...current,
          _retryCount: (current._retryCount ?? 0) + 1,
        }));

        if (!updated) continue;

        if ((updated._retryCount ?? 0) > this.config.maxRetries) {
          // 达到最大重试次数，从队列移除，并通知最终失败
          this.queue.remove(updated.msgId);
          this.onFinalFailure?.(updated, error as Error);
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 启动定时器
   */
  start(): void {
    if (this.flushTimer !== null) return;

    this.flushTimer = crossSetInterval!(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * 停止定时器
   */
  stop(): void {
    if (this.flushTimer !== null) {
      crossClearInterval!(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.queue.destroy();
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      queue: this.queue.getStats(),
    };
  }
}
