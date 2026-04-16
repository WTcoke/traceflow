import { BasePlugin } from '../../core/BasePlugin';
import type { PluginContext, TraceEvent, DeviceInfo } from '../../core/types';

/**
 * 页面浏览插件配置
 */
export interface PageViewPluginConfig {
  /** 是否自动采集首次页面 */
  autoTrack?: boolean;
  /** 是否监听路由变化 */
  listenRouteChange?: boolean;
  /** 是否使用 History API 监听 */
  useHistoryApi?: boolean;
  /** 是否使用 hashchange 监听 */
  useHashChange?: boolean;
}

/**
 * Web 页面浏览自动采集插件
 * 支持 SPA 路由监听
 */
export class WebPageViewPlugin extends BasePlugin {
  name = 'web-pageview';
  priority = 60;

  private config: Required<PageViewPluginConfig>;
  private context?: PluginContext;
  private unlistenHistory: (() => void) | null = null;
  private unlistenHash: (() => void) | null = null;
  private lastUrl: string = '';
  // 保存事件处理器引用，确保可以正确移除
  private boundHashChangeHandler = this.handleHistoryChange.bind(this);

  constructor(config: PageViewPluginConfig = {}) {
    super();
    this.config = {
      autoTrack: config.autoTrack ?? true,
      listenRouteChange: config.listenRouteChange ?? true,
      useHistoryApi: config.useHistoryApi ?? true,
      useHashChange: config.useHashChange ?? true,
    };
  }

  onLoad(context: PluginContext): void {
    this.context = context;

    if (this.config.autoTrack) {
      this.trackPageView();
    }

    if (this.config.listenRouteChange) {
      this.listenRouteChange();
    }
  }

  /**
   * 监听路由变化
   */
  private listenRouteChange(): void {
    // History API 监听
    if (this.config.useHistoryApi && typeof history !== 'undefined') {
      this.setupHistoryListener();
    }

    // Hash 变化监听
    if (this.config.useHashChange) {
      window.addEventListener('hashchange', this.boundHashChangeHandler);
      this.unlistenHash = () => {
        window.removeEventListener('hashchange', this.boundHashChangeHandler);
      };
    }
  }

  /**
   * 设置 History 监听
   */
  private setupHistoryListener(): void {
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    const handleChange = () => this.handleHistoryChange();

    // 使用类型断言避免 TypeScript 类型问题
    (
      history as unknown as {
        pushState: (state: unknown, title: string, url?: string | URL | null) => void;
        replaceState: (state: unknown, title: string, url?: string | URL | null) => void;
      }
    ).pushState = function () {
      // eslint-disable-next-line prefer-rest-params
      originalPush.apply(history, arguments as unknown as Parameters<typeof originalPush>);
      handleChange();
    };

    (
      history as unknown as {
        pushState: (state: unknown, title: string, url?: string | URL | null) => void;
        replaceState: (state: unknown, title: string, url?: string | URL | null) => void;
      }
    ).replaceState = function () {
      // eslint-disable-next-line prefer-rest-params
      originalReplace.apply(history, arguments as unknown as Parameters<typeof originalReplace>);
      handleChange();
    };

    // 监听 popstate
    window.addEventListener('popstate', handleChange);

    this.unlistenHistory = () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener('popstate', handleChange);
    };
  }

  /**
   * 处理 History 变化
   */
  private handleHistoryChange(): void {
    const currentUrl = this.getCurrentUrl();
    if (currentUrl !== this.lastUrl) {
      this.lastUrl = currentUrl;
      this.trackPageView();
    }
  }

  /**
   * 获取当前 URL
   */
  private getCurrentUrl(): string {
    return location?.href || '';
  }

  /**
   * 采集页面浏览
   */
  private trackPageView(): void {
    const url = this.getCurrentUrl();
    const title = document?.title || '';

    const deviceInfo: DeviceInfo = this.context?.deviceInfo || {
      deviceId: '',
      platform: 'web',
    };

    const event: TraceEvent = {
      eventId: `pv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      eventType: 'page',
      timestamp: Date.now(),
      anonymousId: this.context?.anonymousId || '',
      sessionId: this.context?.sessionId || '',
      deviceInfo,
      url,
      title,
      referrer: document?.referrer || undefined,
      properties: {
        path: location?.pathname || '',
        query: this.parseQuery(),
        hash: location?.hash || '',
      },
    };

    this.context?.reportEvent(event);
  }

  /**
   * 解析 URL 查询参数
   */
  private parseQuery(): Record<string, string> {
    const query: Record<string, string> = {};
    const searchParams = new URLSearchParams(location?.search || '');

    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return query;
  }

  /**
   * 插件卸载
   */
  onUnload(): void {
    this.unlistenHistory?.();
    this.unlistenHash?.();
  }
}
