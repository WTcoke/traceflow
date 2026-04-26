import { PluginContext, TracePlugin } from '../types/index';

/**
 * 性能监控插件
 * 追踪核心 Web Vitals 与标准性能指标：FP, FCP, LCP, FID, CLS
 */
export class PerformancePlugin implements TracePlugin {
  name = 'traceflow-performance';
  private ctx: PluginContext | null = null;
  private observers: PerformanceObserver[] = [];

  install(ctx: PluginContext) {
    this.ctx = ctx;
    this.observePaint();
    this.observeLCP();
    this.observeCLS();
    this.observeFID();
  }

  uninstall() {
    this.observers.forEach((obs) => obs.disconnect());
    this.observers = [];
  }

  private observePaint() {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (this.ctx) {
          this.ctx.report({
            type: 'performance',
            name: entry.name, // 'first-paint' 或 'first-contentful-paint'
            data: {
              value: entry.startTime,
            },
          });
        }
      }
    });

    observer.observe({ type: 'paint', buffered: true });
    this.observers.push(observer);
  }

  private observeLCP() {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1]; // 最新的 LCP 条目
      if (this.ctx && lastEntry) {
        this.ctx.report({
          type: 'performance',
          name: 'LCP',
          data: {
            value: lastEntry.startTime,
            element: lastEntry.name || 'unknown',
          },
        });
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // 忽略如果环境不支持
    }
  }

  private observeCLS() {
    if (typeof PerformanceObserver === 'undefined') return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          if (this.ctx) {
            this.ctx.report({
              type: 'performance',
              name: 'CLS',
              data: {
                value: clsValue,
              },
            });
          }
        }
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // 忽略不支持的情况
    }
  }

  private observeFID() {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (this.ctx) {
          this.ctx.report({
            type: 'performance',
            name: 'FID',
            data: {
              value: entry.processingStart - entry.startTime,
              event: entry.name,
            },
          });
        }
        observer.disconnect(); // FID 只需测量一次即可断开
      }
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // 忽略不支持的情况
    }
  }
}
