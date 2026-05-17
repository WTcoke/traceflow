import { PluginContext, TracePlugin } from '../types/index';

/**
 * 页面跳转（路由）监控插件
 * 拦截 History API (pushState, replaceState) 以及 popstate/hashchange 事件
 * 原生地捕获 SPA (单页应用) 的页面过渡路由和来源跳转
 */
export class RoutingPlugin implements TracePlugin {
  name = 'traceflow-routing';
  private ctx: PluginContext | null = null;
  private originalPushState: typeof history.pushState | null = null;
  private originalReplaceState: typeof history.replaceState | null = null;

  private handlePopStateArgs: (e: PopStateEvent) => void;
  private handleHashChangeArgs: (e: HashChangeEvent) => void;

  constructor() {
    this.handlePopStateArgs = (e: PopStateEvent) => this.handlePopState(e);
    this.handleHashChangeArgs = (e: HashChangeEvent) => this.handleHashChange(e);
  }

  install(ctx: PluginContext) {
    this.ctx = ctx;
    this.hijackHistory();
  }

  uninstall() {
    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
      this.originalPushState = null;
    }
    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }

    window.removeEventListener('popstate', this.handlePopStateArgs);
    window.removeEventListener('hashchange', this.handleHashChangeArgs);
  }

  private hijackHistory() {
    if (typeof history === 'undefined') return;

    this.originalPushState = history.pushState;
    history.pushState = (...args: any[]) => {
      const originalTarget = location.pathname + location.search + location.hash;
      const result = this.originalPushState!.apply(history, args as any);
      this.reportRouteChange(
        'pushState',
        originalTarget,
        location.pathname + location.search + location.hash,
      );
      return result;
    };

    this.originalReplaceState = history.replaceState;
    history.replaceState = (...args: any[]) => {
      const originalTarget = location.pathname + location.search + location.hash;
      const result = this.originalReplaceState!.apply(history, args as any);
      this.reportRouteChange(
        'replaceState',
        originalTarget,
        location.pathname + location.search + location.hash,
      );
      return result;
    };

    window.addEventListener('popstate', this.handlePopStateArgs);
    window.addEventListener('hashchange', this.handleHashChangeArgs);
  }

  private handlePopState(e: PopStateEvent) {
    this.reportRouteChange('popstate', document.referrer, location.href);
  }

  private handleHashChange(e: HashChangeEvent) {
    this.reportRouteChange('hashchange', e.oldURL, e.newURL);
  }

  private reportRouteChange(action: string, oldURL: string, newURL: string) {
    if (!this.ctx) return;

    // 在此记录下 SPA 各项前端路由间的切换，供追溯从哪个页面而来
    this.ctx.report({
      type: 'routing',
      name: action,
      data: {
        from: oldURL,
        to: newURL,
        referrer: document.referrer || '',
      },
    });
  }
}
