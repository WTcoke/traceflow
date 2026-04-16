import type { TraceEvent } from '../core/types';
import { crossSetTimeout, crossClearTimeout, type TimerId } from '../utils/timer';

/**
 * 重试策略配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 基础重试间隔 (ms) */
  baseInterval?: number;
  /** 最大重试间隔 (ms) */
  maxInterval?: number;
  /** 指数退避基数 */
  backoffBase?: number;
}

/**
 * 重试状态
 */
interface RetryState {
  event: TraceEvent;
  retryCount: number;
  nextRetryTime: number;
}

/**
 * 重试策略
 * 实现指数退避算法的失败重试
 */
export class RetryStrategy {
  private config: Required<RetryConfig>;
  private retryQueue: Map<string, RetryState> = new Map();
  private timers: Map<string, TimerId> = new Map();
  // 重试到期回调，由 ReportManager 提供
  private onRetryReadyCallback?: (eventId: string) => void;

  constructor(config: RetryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      baseInterval: config.baseInterval ?? 1000,
      maxInterval: config.maxInterval ?? 30000,
      backoffBase: config.backoffBase ?? 2,
    };
  }

  /**
   * 设置重试到期回调
   */
  onRetryReady(callback: (eventId: string) => void): void {
    this.onRetryReadyCallback = callback;
  }

  /**
   * 安排重试
   */
  scheduleRetry(event: TraceEvent): boolean {
    const currentRetry = event._retryCount ?? 0;

    if (currentRetry >= this.config.maxRetries) {
      return false;
    }

    const nextRetryTime = this.calculateNextRetryTime(currentRetry);
    const state: RetryState = {
      event: { ...event, _retryCount: currentRetry + 1 },
      retryCount: currentRetry + 1,
      nextRetryTime,
    };

    this.retryQueue.set(event.eventId, state);
    this.scheduleTimer(event.eventId, nextRetryTime);

    return true;
  }

  /**
   * 取消重试
   */
  cancelRetry(eventId: string): void {
    const timerId = this.timers.get(eventId);
    if (timerId !== undefined) {
      crossClearTimeout!(timerId);
      this.timers.delete(eventId);
    }
    this.retryQueue.delete(eventId);
  }

  /**
   * 获取待重试事件
   */
  getPendingRetries(): TraceEvent[] {
    return Array.from(this.retryQueue.values())
      .filter((state) => state.nextRetryTime <= Date.now())
      .map((state) => state.event);
  }

  /**
   * 检查是否有到期的重试（并触发回调）
   */
  checkPendingRetries(): void {
    const now = Date.now();
    for (const [eventId, state] of this.retryQueue) {
      if (state.nextRetryTime <= now) {
        this.onRetryReadyCallback?.(eventId);
      }
    }
  }

  /**
   * 获取重试队列大小
   */
  size(): number {
    return this.retryQueue.size;
  }

  /**
   * 清空重试队列
   */
  clear(): void {
    this.timers.forEach((timerId) => crossClearTimeout!(timerId));
    this.timers.clear();
    this.retryQueue.clear();
  }

  /**
   * 计算下次重试时间
   */
  private calculateNextRetryTime(currentRetry: number): number {
    const delay = Math.min(
      this.config.baseInterval * Math.pow(this.config.backoffBase, currentRetry),
      this.config.maxInterval,
    );
    return Date.now() + delay;
  }

  /**
   * 安排定时器，到期时触发回调
   */
  private scheduleTimer(eventId: string, time: number): void {
    const delay = Math.max(0, time - Date.now());
    const timerId = crossSetTimeout!(() => {
      this.timers.delete(eventId);
      // 触发回调通知重试到期
      this.onRetryReadyCallback?.(eventId);
    }, delay);
    this.timers.set(eventId, timerId);
  }

  /**
   * 获取重试统计
   */
  getStats() {
    return {
      pendingCount: this.retryQueue.size,
      maxRetries: this.config.maxRetries,
      baseInterval: this.config.baseInterval,
    };
  }
}
