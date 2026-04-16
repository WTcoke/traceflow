import { BasePlugin } from '../../core/BasePlugin';
import type { PluginContext, TraceEvent, DeviceInfo } from '../../core/types';

/**
 * 点击事件配置
 */
export interface ClickPluginConfig {
  /** 是否监听文档点击 */
  documentClick?: boolean;
  /** 是否监听 window click */
  windowClick?: boolean;
  /** 忽略的选择器 */
  ignoreSelectors?: string[];
  /** 是否采集点击文本内容 */
  captureText?: boolean;
  /** 防抖延迟 (ms) */
  debounceDelay?: number;
}

/**
 * 点击位置信息
 */
interface ClickPosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

/**
 * Web 点击自动采集插件
 */
export class WebClickPlugin extends BasePlugin {
  name = 'web-click';
  priority = 50;

  private config: Required<ClickPluginConfig>;
  private context?: PluginContext;
  private lastClickTime: number = 0;
  // 保存事件处理器引用，确保可以正确移除
  private boundClickHandler = this.handleClick.bind(this);

  constructor(config: ClickPluginConfig = {}) {
    super();
    this.config = {
      documentClick: config.documentClick ?? true,
      windowClick: config.windowClick ?? false,
      ignoreSelectors: config.ignoreSelectors ?? ['a', 'button', 'input', 'select', 'textarea'],
      captureText: config.captureText ?? true,
      debounceDelay: config.debounceDelay ?? 300,
    };
  }

  onLoad(context: PluginContext): void {
    this.context = context;

    if (this.config.documentClick) {
      document.addEventListener('click', this.boundClickHandler, true);
    }

    if (this.config.windowClick) {
      window.addEventListener('click', this.boundClickHandler, true);
    }
  }

  /**
   * 处理点击事件
   */
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // 忽略特定元素
    if (this.shouldIgnore(target)) {
      return;
    }

    // 防抖处理
    const now = Date.now();
    if (now - this.lastClickTime < this.config.debounceDelay) {
      return;
    }
    this.lastClickTime = now;

    // 创建点击事件
    const clickEvent = this.createClickEvent(event, target);

    // 通过 context.reportEvent 进入 SDK 上报管道
    this.context?.reportEvent(clickEvent);
  }

  /**
   * 检查是否应该忽略
   */
  private shouldIgnore(target: HTMLElement): boolean {
    for (const selector of this.config.ignoreSelectors) {
      if (target.matches(selector) || target.closest(selector)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 创建点击事件
   */
  private createClickEvent(event: MouseEvent, target: HTMLElement): TraceEvent {
    const position = this.getClickPosition(event, target);
    const textContent = this.config.captureText ? this.getTextContent(target) : undefined;

    return {
      eventId: `click_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      eventType: 'track',
      eventName: 'click',
      timestamp: Date.now(),
      anonymousId: this.context?.anonymousId || '',
      sessionId: this.context?.sessionId || '',
      deviceInfo: this.context?.deviceInfo || ({} as DeviceInfo),
      url: typeof location !== 'undefined' ? location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined,
      properties: {
        // 点击位置
        x: position.x,
        y: position.y,
        targetX: position.targetX,
        targetY: position.targetY,
        // 目标元素信息
        elementTag: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
        elementClass: target.className || undefined,
        elementText: textContent,
        // 元素路径
        elementPath: this.getElementPath(target),
        // 链接信息
        href: (target as HTMLAnchorElement).href || undefined,
        target: (target as HTMLAnchorElement).target || undefined,
      },
    };
  }

  /**
   * 获取点击位置
   */
  private getClickPosition(event: MouseEvent, target: HTMLElement): ClickPosition {
    const rect = target.getBoundingClientRect();
    return {
      x: event.clientX,
      y: event.clientY,
      targetX: rect.left + rect.width / 2,
      targetY: rect.top + rect.height / 2,
    };
  }

  /**
   * 获取文本内容
   */
  private getTextContent(target: HTMLElement): string | undefined {
    // 获取按钮/链接的文本
    const text = target.innerText || target.textContent || '';
    return text.trim().substring(0, 200) || undefined;
  }

  /**
   * 获取元素路径
   */
  private getElementPath(target: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = target;

    while (current && current !== document.body) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const classes = current.className
        ? '.' + current.className.split(' ').filter(Boolean).join('.')
        : '';
      path.unshift(`${tag}${id}${classes}`);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * 插件卸载
   */
  onUnload(): void {
    document.removeEventListener('click', this.boundClickHandler, true);
    window.removeEventListener('click', this.boundClickHandler, true);
  }
}
