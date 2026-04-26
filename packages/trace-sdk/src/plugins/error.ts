import { PluginContext, TracePlugin } from '../types/index';

/**
 * 异常错误监控插件
 * 获取全局 JS 运行时报错、未处理的 Promise Rejections 与静态资源加载失误信息
 */
export class ErrorPlugin implements TracePlugin {
  name = 'traceflow-error';
  private ctx: PluginContext | null = null;
  private handleErrorBind: (e: ErrorEvent) => void;
  private handleRejectionBind: (e: PromiseRejectionEvent) => void;

  constructor() {
    this.handleErrorBind = this.handleError.bind(this);
    this.handleRejectionBind = this.handleRejection.bind(this);
  }

  install(ctx: PluginContext) {
    this.ctx = ctx;
    // 使用捕获阶段 (true) 来确保拿到冒泡不出来的资源加载等底层异常
    window.addEventListener('error', this.handleErrorBind, true);
    window.addEventListener('unhandledrejection', this.handleRejectionBind);
  }

  uninstall() {
    window.removeEventListener('error', this.handleErrorBind, true);
    window.removeEventListener('unhandledrejection', this.handleRejectionBind);
  }

  private handleError(e: ErrorEvent) {
    if (!this.ctx) return;

    const target = e.target as HTMLElement | null;
    const isResourceError =
      target &&
      (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK');

    if (isResourceError) {
      // 静态资源加载异常（如跨域或服务报 img 404, script 500 等）
      this.ctx.report({
        type: 'error',
        name: 'resource_error',
        data: {
          url: (target as any).src || (target as any).href,
          tag: target.tagName.toLowerCase(),
          id: target.id,
          className: target.className,
        },
      });
    } else {
      // 一般的 JavaScript 运行时错误报出（含详细行堆栈等）
      this.ctx.report({
        type: 'error',
        name: 'js_error',
        data: {
          message: e.message,
          filename: e.filename,
          line: e.lineno,
          column: e.colno,
          stack: e.error?.stack,
        },
      });
    }
  }

  private handleRejection(e: PromiseRejectionEvent) {
    if (!this.ctx) return;

    // 遗漏 Catch 的异步 Promise Rejection (例如没有正常 catch 处理的 fetch 行为)
    this.ctx.report({
      type: 'error',
      name: 'promise_rejection',
      data: {
        reason: e.reason instanceof Error ? e.reason.message : String(e.reason),
        stack: e.reason instanceof Error ? e.reason.stack : undefined,
      },
    });
  }
}
