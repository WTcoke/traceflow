import type { TraceEvent, SDKConfig } from '../core/types';
import type { INetworkAdapter } from '../adapter/types';
import { BatchReporter, type BatchReporterConfig } from './BatchReporter';
import { Sampler } from './Sampler';
import { RetryStrategy } from './RetryStrategy';
import { PluginManager } from '../core/PluginManager';

/**
 * 上报管理器
 * 统一管理事件队列、采样、上报和重试
 */
export class ReportManager {
  private config: SDKConfig;
  private networkAdapter: INetworkAdapter;
  private batchReporter: BatchReporter;
  private sampler: Sampler;
  private retry: RetryStrategy;
  private isReady: boolean = false;
  private pluginManager?: PluginManager;
  // 防止重试回调重复触发的 in-flight 集合
  private inFlightRetries: Set<string> = new Set();

  constructor(config: SDKConfig, pluginManager?: PluginManager) {
    this.config = config;
    this.pluginManager = pluginManager;

    // 初始化网络适配器
    if (!config.networkAdapter) {
      throw new Error('[TraceSDK] networkAdapter is required');
    }
    this.networkAdapter = config.networkAdapter;

    // 初始化采样器
    this.sampler = new Sampler(config.samplingConfig);

    // 构建批量上报器配置
    const batchReporterConfig: BatchReporterConfig = {
      batchSize: config.reportConfig?.batchSize ?? 10,
      flushInterval: config.reportConfig?.flushInterval ?? 3000,
      maxRetries: config.reportConfig?.maxRetries ?? 3,
      autoStart: true,
      usePersistentQueue: config.storageConfig?.enabled ?? false,
      persistentQueueConfig: {
        storageAdapter: config.storageAdapter,
        ...config.storageConfig,
      },
    };

    // 初始化批量上报器。普通批量事件由批量队列自身保留并重试，避免重复投递。
    this.batchReporter = new BatchReporter(this.sendBatch.bind(this), batchReporterConfig, {
      onFinalFailure: (event, error) => {
        this.config.onReportFail?.(event, error);
      },
    });

    // 初始化立即上报事件（error / critical）的重试策略
    this.retry = new RetryStrategy({
      maxRetries: config.reportConfig?.maxRetries,
      baseInterval: config.reportConfig?.retryInterval,
    });

    // 设置重试到期回调，触发立即重试
    this.retry.onRetryReady((msgId) => {
      const pendingEvents = this.retry.getPendingRetries();
      const event = pendingEvents.find((e) => e.msgId === msgId);
      if (event) {
        this.sendImmediatelyWithRetry(event);
      }
    });
  }

  /**
   * 上报单个事件
   */
  async report(event: TraceEvent): Promise<void> {
    if (!this.isReady) return;

    // 采样判断
    if (!this.sampler.shouldSample(event)) {
      return;
    }

    // 关键事件立即上报
    if (event.priority === 'critical' || event.eventType === 'error') {
      await this.sendImmediately(event);
      return;
    }

    // 普通事件通过批量上报器处理
    this.batchReporter.push(event);
  }

  /**
   * 批量上报
   */
  async reportBatch(events: TraceEvent[]): Promise<void> {
    if (!this.isReady) return;

    const sampledEvents = events.filter((e) => this.sampler.shouldSample(e));
    this.batchReporter.pushBatch(sampledEvents);
  }

  private sanitizeEventForTransport(event: TraceEvent): TraceEvent {
    const transportEvent = { ...event };
    delete transportEvent._createdAt;
    delete transportEvent._retryCount;
    delete transportEvent.priority;
    return transportEvent;
  }

  private sanitizeEventsForTransport(events: TraceEvent[]): TraceEvent[] {
    return events.map((event) => this.sanitizeEventForTransport(event));
  }

  /**
   * 立即发送单个事件（关键事件/错误事件）
   */
  private async sendImmediately(event: TraceEvent): Promise<void> {
    // 应用 beforeSend 过滤
    let filteredEvent: TraceEvent = event;
    if (this.config.beforeSend) {
      const result = this.config.beforeSend(event);
      if (result === false) return;
      if (result !== undefined) filteredEvent = result;
    }

    try {
      await this.networkAdapter.sendBatch([this.sanitizeEventForTransport(filteredEvent)]);
      this.config.onReportSuccess?.(filteredEvent);
    } catch (error) {
      this.handleSendError(filteredEvent, error as Error);
    }
  }

  /**
   * 发送单个事件并处理重试
   */
  private async sendImmediatelyWithRetry(event: TraceEvent): Promise<void> {
    // 防止重复发送
    const eventKey = event.msgId;
    if (this.inFlightRetries.has(eventKey)) {
      return;
    }
    this.inFlightRetries.add(eventKey);

    try {
      let filteredEvent: TraceEvent = event;
      if (this.config.beforeSend) {
        const result = this.config.beforeSend(event);
        if (result === false) {
          this.retry.cancelRetry(eventKey);
          return;
        }
        if (result !== undefined) filteredEvent = result;
      }

      await this.networkAdapter.sendBatch([this.sanitizeEventForTransport(filteredEvent)]);
      this.retry.cancelRetry(eventKey);
      this.config.onReportSuccess?.(filteredEvent);
    } catch (error) {
      // 失败时不调用 handleSendError，避免重复回调
      // 重试逻辑由 scheduleRetry 处理
      if (!this.retry.scheduleRetry(event)) {
        // 达到最大重试次数，不再重试
        this.config.onReportFail?.(event, error as Error);
      }
    } finally {
      this.inFlightRetries.delete(eventKey);
    }
  }

  /**
   * 批量发送
   */
  private async sendBatch(events: TraceEvent[]): Promise<void> {
    // 应用 beforeSend 过滤
    const filteredEvents = this.config.beforeSend
      ? events
          .map((e) => {
            const result = this.config.beforeSend!(e);
            return result === false ? null : (result ?? e);
          })
          .filter((e): e is TraceEvent => e !== null)
      : events;

    if (filteredEvents.length === 0) return;

    // 调用插件的 onReport 钩子
    const finalEvents = this.pluginManager?.executeReportHook(filteredEvents) ?? filteredEvents;

    if (finalEvents.length === 0) return;

    await this.networkAdapter.sendBatch(this.sanitizeEventsForTransport(finalEvents));

    // 上报成功回调
    finalEvents.forEach((e) => {
      this.config.onReportSuccess?.(e);
    });
  }

  /**
   * 处理发送错误（用于立即发送的关键事件）
   */
  private handleSendError(event: TraceEvent, error: Error): void {
    // 将错误事件加入重试队列
    const scheduled = this.retry.scheduleRetry(event);
    if (!scheduled) {
      // 达到最大重试次数，触发失败回调
      this.config.onReportFail?.(event, error);
    }
  }

  /**
   * 刷新队列
   */
  async flush(): Promise<void> {
    await this.batchReporter.flush();
  }

  peekPending(count?: number): TraceEvent[] {
    return this.batchReporter.peek(count);
  }

  peekPendingForTransport(count?: number): TraceEvent[] {
    return this.sanitizeEventsForTransport(this.peekPending(count));
  }

  removePending(count: number): TraceEvent[] {
    return this.batchReporter.remove(count);
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 清空重试队列
    this.retry.clear();
    this.batchReporter.destroy();
  }

  /**
   * 标记就绪
   */
  ready(): void {
    this.isReady = true;
    // 注意：不再使用 retryCheckTimer 轮询，由 RetryStrategy 的 onRetryReady 回调驱动重试
    // 这样可以避免 checkAndRetryPendingEvents 和 onRetryReady 重复触发同一事件
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      reporter: this.batchReporter.getStats(),
      sampler: this.sampler.getStats(),
    };
  }
}
