import type { TraceEvent } from '../core/types';
import { EventQueue } from './EventQueue';
import { PersistentEventQueue, type PersistentQueueConfig } from './PersistentEventQueue';
import { RetryStrategy } from './RetryStrategy';
import { crossSetInterval, crossClearInterval, type TimerId } from '../utils/timer';

/**
 * 批量上报器配置
 */
export interface BatchReporterConfig {
  /** 批量大小 */
  batchSize?: number;
  /** 上报间隔 (ms) */
  flushInterval?: number;
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
  // 重试回调，由 ReportManager 提供
  private scheduleRetryFn: (event: TraceEvent) => boolean;
  // 取消重试回调，由 ReportManager 提供
  private cancelRetryFn: (eventId: string) => void;

  constructor(
    sendFn: (events: TraceEvent[]) => Promise<void>,
    config: BatchReporterConfig = {},
    retryStrategy?: {
      scheduleRetry: (event: TraceEvent) => boolean;
      cancelRetry: (eventId: string) => void;
    },
  ) {
    this.config = {
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 3000,
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

    // 使用 ReportManager 提供的重试策略
    if (retryStrategy) {
      this.scheduleRetryFn = retryStrategy.scheduleRetry;
      this.cancelRetryFn = retryStrategy.cancelRetry;
    } else {
      // 兜底：使用独立的 RetryStrategy（向后兼容）
      const fallbackRetry = new RetryStrategy();
      this.scheduleRetryFn = (event) => fallbackRetry.scheduleRetry(event);
      this.cancelRetryFn = (eventId) => fallbackRetry.cancelRetry(eventId);
    }

    this.sendFn = sendFn;

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

  /**
   * 触发上报
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.isEmpty()) {
      return;
    }

    this.isFlushing = true;

    try {
      // 使用 peek() 而非 getBatch()，避免事件被提前移除
      const eventsToSend = this.queue.peek(this.config.batchSize);

      if (eventsToSend.length === 0) {
        this.isFlushing = false;
        return;
      }

      await this.sendFn(eventsToSend);

      // 发送成功：从队列移除已发送的事件
      this.queue.pop(this.config.batchSize);
      eventsToSend.forEach((e) => this.cancelRetryFn(e.eventId));
    } catch (error) {
      // 发送失败：eventsToSend 仍在队列中（因为只 peek 没 pop）
      // 使用统一的 ReportManager 重试策略
      const eventsToRetry = this.queue.peek(this.config.batchSize);

      for (const event of eventsToRetry) {
        if (!this.scheduleRetryFn(event)) {
          // 达到最大重试次数，从队列移除
          this.queue.remove(event.eventId);
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
    this.queue.clear();
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
