import { BasePlugin } from '../../core/BasePlugin';
import type { PluginContext, TraceEvent, DeviceInfo } from '../../core/types';

/**
 * 性能指标配置
 */
export interface PerformancePluginConfig {
  /** 是否采集 FCP (First Contentful Paint) */
  enableFCP?: boolean;
  /** 是否采集 LCP (Largest Contentful Paint) */
  enableLCP?: boolean;
  /** 是否采集 FID (First Input Delay) */
  enableFID?: boolean;
  /** 是否采集 CLS (Cumulative Layout Shift) */
  enableCLS?: boolean;
  /** 是否采集页面加载时间 */
  enableLoadTime?: boolean;
  /** 是否采集资源加载时间 */
  enableResourceTiming?: boolean;
}

/**
 * 性能指标数据
 */
export interface PerformanceMetrics {
  /** 首次内容绘制 */
  fcp?: number;
  /** 最大内容绘制 */
  lcp?: number;
  /** 首次输入延迟 */
  fid?: number;
  /** 累积布局偏移 */
  cls?: number;
  /** 页面加载时间 */
  loadTime?: number;
  /** DOM 构建时间 */
  domContentLoaded?: number;
  /** 首字节时间 */
  ttfb?: number;
  /** 资源加载时间 */
  resourceTiming?: ResourceTiming[];
}

/**
 * 资源加载时间
 */
export interface ResourceTiming {
  name: string;
  entryType: string;
  duration: number;
  size: number;
  url: string;
}

/**
 * Web 性能指标采集插件
 */
export class WebPerformancePlugin extends BasePlugin {
  name = 'web-performance';
  priority = 40;

  private config: Required<PerformancePluginConfig>;
  private context?: PluginContext;
  private metricsReported: Set<string> = new Set();

  constructor(config: PerformancePluginConfig = {}) {
    super();
    this.config = {
      enableFCP: config.enableFCP ?? true,
      enableLCP: config.enableLCP ?? true,
      enableFID: config.enableFID ?? true,
      enableCLS: config.enableCLS ?? true,
      enableLoadTime: config.enableLoadTime ?? true,
      enableResourceTiming: config.enableResourceTiming ?? false,
    };
  }

  onLoad(context: PluginContext): void {
    this.context = context;

    // 等待页面加载完成后采集
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => this.collectMetrics());
    }

    // 监听 LCP 变化
    if (this.config.enableLCP) {
      this.observeLCP();
    }

    // 监听 CLS 变化
    if (this.config.enableCLS) {
      this.observeCLS();
    }
  }

  /**
   * 采集性能指标
   */
  private collectMetrics(): void {
    const perf = performance;
    if (!perf) return;

    const metrics: PerformanceMetrics = {};

    // 页面加载时间（优先使用 Navigation Timing Level 2 API）
    if (this.config.enableLoadTime) {
      const navEntries = perf.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const navEntry = navEntries[0];
      if (navEntry) {
        metrics.loadTime = Math.round(navEntry.loadEventEnd - navEntry.startTime);
        metrics.domContentLoaded = Math.round(
          navEntry.domContentLoadedEventEnd - navEntry.startTime,
        );
        metrics.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
      } else if (perf.timing) {
        // Fallback: 兼容旧浏览器
        const timing = perf.timing;
        metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
        metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        metrics.ttfb = timing.responseStart - timing.requestStart;
      }
    }

    // FCP - 首次内容绘制
    if (this.config.enableFCP) {
      const fcp = this.getFCP();
      if (fcp !== undefined) {
        metrics.fcp = fcp;
      }
    }

    // 资源加载时间
    if (this.config.enableResourceTiming) {
      metrics.resourceTiming = this.getResourceTiming();
    }

    // 上报性能事件
    if (Object.keys(metrics).length > 0) {
      this.reportPerformance(metrics);
    }
  }

  /**
   * 获取 FCP
   */
  private getFCP(): number | undefined {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
    return fcp ? Math.round(fcp.startTime) : undefined;
  }

  /**
   * 观察 LCP
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;

        if (lastEntry && !this.metricsReported.has('lcp')) {
          this.metricsReported.add('lcp');
          this.reportPerformance({ lcp: Math.round(lastEntry.startTime) });
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // 浏览器不支持
    }
  }

  /**
   * 观察 CLS
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
          if (layoutShift.hadRecentInput) continue;
          clsValue += layoutShift.value;
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // 页面隐藏时上报 CLS
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.reportPerformance({ cls: Math.round(clsValue * 1000) / 1000 });
        }
      });
    } catch {
      // 浏览器不支持
    }
  }

  /**
   * 获取资源加载时间
   */
  private getResourceTiming(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.slice(0, 20).map((entry) => ({
      name: entry.name,
      entryType: entry.entryType,
      duration: Math.round(entry.duration),
      size: entry.transferSize || 0,
      url: entry.name,
    }));
  }

  /**
   * 上报性能事件
   */
  private reportPerformance(metrics: PerformanceMetrics): void {
    const event: TraceEvent = {
      eventId: `perf_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      eventType: 'track',
      eventName: 'performance',
      timestamp: Date.now(),
      anonymousId: this.context?.anonymousId || '',
      sessionId: this.context?.sessionId || '',
      deviceInfo: this.context?.deviceInfo || ({} as DeviceInfo),
      url: location?.href,
      properties: metrics as Record<string, unknown>,
    };

    // 通过 context.reportEvent 进入 SDK 上报管道
    this.context?.reportEvent(event);
  }

  /**
   * 插件卸载
   */
  onUnload(): void {
    this.metricsReported.clear();
  }
}
