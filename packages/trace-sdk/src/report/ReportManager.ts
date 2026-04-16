import type { TraceEvent, SDKConfig } from '../core/types';
import type { INetworkAdapter } from '../adapter/types';
import { BatchReporter, type BatchReporterConfig } from './BatchReporter';
import { Sampler } from './Sampler';
import { RetryStrategy } from './RetryStrategy';
import { WebNetworkAdapter } from '../platform/web/WebNetworkAdapter';
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
    if (config.networkAdapter) {
      this.networkAdapter = config.networkAdapter;
    } else {
      // 默认使用 Web 网络适配器
      this.networkAdapter = new WebNetworkAdapter(config);
    }

    // 初始化采样器
    this.sampler = new Sampler(config.samplingConfig);

    // 构建批量上报器配置
    const batchReporterConfig: BatchReporterConfig = {
      batchSize: config.reportConfig?.batchSize ?? 10,
      flushInterval: config.reportConfig?.flushInterval ?? 3000,
      autoStart: true,
      usePersistentQueue: config.storageConfig?.enabled ?? false,
      persistentQueueConfig: {
        storageAdapter: config.storageAdapter,
        ...config.storageConfig,
      },
    };

    // 初始化批量上报器（传入 RetryStrategy 回调实现统一重试）
    this.batchReporter = new BatchReporter(this.sendBatch.bind(this), batchReporterConfig, {
      scheduleRetry: (event) => this.retry.scheduleRetry(event),
      cancelRetry: (eventId) => this.retry.cancelRetry(eventId),
    });

    // 初始化错误事件重试策略
    this.retry = new RetryStrategy();

    // 设置重试到期回调，触发立即重试
    this.retry.onRetryReady((eventId) => {
      const pendingEvents = this.retry.getPendingRetries();
      const event = pendingEvents.find((e) => e.eventId === eventId);
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
      // 关键事件直接通过适配器发送
      await this.networkAdapter.send(filteredEvent);
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
    if (this.inFlightRetries.has(event.eventId)) {
      return;
    }
    this.inFlightRetries.add(event.eventId);

    try {
      let filteredEvent: TraceEvent = event;
      if (this.config.beforeSend) {
        const result = this.config.beforeSend(event);
        if (result === false) {
          this.retry.cancelRetry(event.eventId);
          return;
        }
        if (result !== undefined) filteredEvent = result;
      }

      await this.networkAdapter.send(filteredEvent);
      this.retry.cancelRetry(event.eventId);
      this.config.onReportSuccess?.(filteredEvent);
    } catch (error) {
      // 失败时不调用 handleSendError，避免重复回调
      // 重试逻辑由 scheduleRetry 处理
      if (!this.retry.scheduleRetry(event)) {
        // 达到最大重试次数，不再重试
        this.config.onReportFail?.(event, error as Error);
      }
    } finally {
      this.inFlightRetries.delete(event.eventId);
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

    try {
      await this.networkAdapter.sendBatch(finalEvents);

      // 上报成功回调
      finalEvents.forEach((e) => {
        this.config.onReportSuccess?.(e);
      });
    } catch (error) {
      // 上报失败回调
      finalEvents.forEach((e) => {
        this.config.onReportFail?.(e, error as Error);
      });
      // 重新抛出错误，让 BatchReporter 处理重试
      throw error;
    }
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
