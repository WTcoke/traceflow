import { BasePlugin } from '../../core/BasePlugin';
import type { PluginContext, TraceEvent, DeviceInfo } from '../../core/types';
import { parseError, categorizeError } from '../../utils/ErrorParser';

/**
 * Web 错误监控插件
 * 自动捕获 JS 运行时错误和 Promise 拒绝
 */
export class WebErrorPlugin extends BasePlugin {
  name = 'web-error';
  priority = 100; // 高优先级，确保错误事件优先处理

  private originalOnError: OnErrorEventHandler | null = null;
  private originalUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;
  private context?: PluginContext;

  /**
   * 插件加载
   */
  onLoad(context: PluginContext): void {
    this.context = context;
    this.setupErrorHandlers();
  }

  /**
   * 设置错误处理器
   */
  private setupErrorHandlers(): void {
    // 捕获 JS 运行时错误
    this.originalOnError = window.onerror;
    window.onerror = this.handleWindowError.bind(this);

    // 捕获未处理的 Promise 拒绝
    this.originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = this.handleUnhandledRejection.bind(this);
  }

  /**
   * 处理 window.onerror
   */
  private handleWindowError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): boolean {
    const parsed = parseError(error || message);

    const event = this.createErrorEvent({
      name: parsed.name,
      message: parsed.message,
      stack: parsed.stack,
      category: 'js_error',
      source,
      lineno,
      colno,
    });

    // 通过 context.reportEvent 进入 SDK 上报管道
    this.context?.reportEvent(event);

    // 返回 false 允许默认错误处理
    return false;
  }

  /**
   * 处理未处理的 Promise 拒绝
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const parsed = parseError(reason);

    const errorEvent = this.createErrorEvent({
      name: parsed.name,
      message: parsed.message,
      stack: parsed.stack,
      category: 'promise_error',
    });

    this.context?.reportEvent(errorEvent);

    // 阻止默认行为（不再向控制台输出 unhandledrejection）
    event.preventDefault();
  }

  /**
   * 创建错误事件
   */
  private createErrorEvent(data: {
    name: string;
    message: string;
    stack?: string;
    category?: string;
    source?: string;
    lineno?: number;
    colno?: number;
  }): TraceEvent {
    return {
      eventId: `err_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      eventType: 'error',
      timestamp: Date.now(),
      anonymousId: this.context?.anonymousId || '',
      sessionId: this.context?.sessionId || '',
      deviceInfo: this.context?.deviceInfo || ({} as DeviceInfo),
      properties: {
        errorName: data.name,
        errorMessage: data.message,
        stack: data.stack,
        category: data.category || categorizeError(data.name),
        source: data.source,
        lineno: data.lineno,
        colno: data.colno,
      },
      priority: 'critical',
    };
  }

  /**
   * 错误钩子（用于手动调用）
   */
  onError(error: Error): void {
    const parsed = parseError(error);
    const event = this.createErrorEvent({
      name: parsed.name,
      message: parsed.message,
      stack: parsed.stack,
      category: 'custom_error',
    });
    this.context?.reportEvent(event);
  }

  /**
   * 插件卸载
   */
  onUnload(): void {
    // 恢复原始错误处理器
    if (this.originalOnError !== null) {
      window.onerror = this.originalOnError;
    }
    if (this.originalUnhandledRejection !== null) {
      window.onunhandledrejection = this.originalUnhandledRejection;
    }
  }
}
