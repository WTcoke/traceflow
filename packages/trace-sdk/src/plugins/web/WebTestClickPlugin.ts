import { BasePlugin } from '../../core/BasePlugin';
import type { PluginContext, TraceEvent } from '../../core/types';
import { generateId } from '../../utils/uuid';

export interface WebTestClickPluginConfig {
  eventName?: string;
}

/**
 * Web 测试点击插件。
 * 只用于验证插件链路和后端 DTO，不作为完整点击采集方案。
 */
export class WebTestClickPlugin extends BasePlugin {
  name = 'web-test-click';
  priority = 50;

  private context?: PluginContext;
  private readonly eventName: string;
  private readonly handleClick = (event: MouseEvent) => this.reportClick(event);

  constructor(config: WebTestClickPluginConfig = {}) {
    super();
    this.eventName = config.eventName ?? 'test_click';
  }

  onLoad(context: PluginContext): void {
    this.context = context;

    if (typeof document !== 'undefined') {
      document.addEventListener('click', this.handleClick, true);
    }
  }

  onUnload(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.handleClick, true);
    }
  }

  private reportClick(event: MouseEvent): void {
    if (!this.context || !(event.target instanceof HTMLElement)) {
      return;
    }

    this.context.reportEvent(this.createEvent(event, event.target));
  }

  private createEvent(event: MouseEvent, target: HTMLElement): TraceEvent {
    const { deviceInfo, userId } = this.context!;

    return {
      msgId: `msg_${generateId()}`,
      deviceId: deviceInfo.deviceId,
      userId,
      eventTime: Date.now(),
      eventType: 'behavior',
      platform: 'web',
      userAgent: deviceInfo.userAgent,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      data: {
        eventName: this.eventName,
        pageUrl: typeof location !== 'undefined' ? location.href : undefined,
        pageTitle: typeof document !== 'undefined' ? document.title : undefined,
        x: event.clientX,
        y: event.clientY,
        elementTag: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
      },
    };
  }
}
