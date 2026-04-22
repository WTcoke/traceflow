import { BaseNetworkAdapter } from '../../adapter/base/BaseNetworkAdapter';
import type { TraceEvent, SDKConfig } from '../../core/types';

/**
 * Web 端网络适配器实现
 * 支持 fetch 和 sendBeacon 两种发送方式
 */
export class WebNetworkAdapter extends BaseNetworkAdapter {
  private useBeacon: boolean;

  constructor(config: SDKConfig) {
    super(config);
    this.useBeacon = 'sendBeacon' in navigator;
  }

  /**
   * 发送单个事件
   */
  async send(event: TraceEvent): Promise<void> {
    event._sent = true;

    if (this.useBeacon) {
      const success = this.sendBeacon([event]);
      if (!success) {
        // sendBeacon 返回 false（队列满），使用 fetch 兜底
        await this.post(event);
      }
    } else {
      await this.post(event);
    }
  }

  /**
   * 批量发送事件
   */
  async sendBatch(events: TraceEvent[]): Promise<void> {
    if (events.length === 0) return;

    events.forEach((e) => {
      e._sent = true;
    });

    if (this.useBeacon) {
      const success = this.sendBeacon(events);
      if (!success) {
        // sendBeacon 返回 false（队列满），使用 fetch 兜底
        await this.post(events);
      }
    } else {
      await this.post(events);
    }
  }

  /**
   * 使用 sendBeacon 发送数据（页面关闭时保活）
   * @returns 是否发送成功，false 时调用方应使用 fetch 兜底
   */
  private sendBeacon(events: TraceEvent[]): boolean {
    const url = this.config.serverUrl;
    const data = JSON.stringify(events);
    const blob = new Blob([data], { type: 'application/json' });

    // sendBeacon 返回 true 表示已加入浏览器队列，false 表示队列满
    // 返回 false 时，调用方应使用 fetch 兜底发送
    return navigator.sendBeacon(url, blob);
  }

  /**
   * 使用 fetch POST 发送数据
   */
  protected async post(data: unknown): Promise<void> {
    const response = await fetch(this.config.serverUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Network request failed: ${response.status}`);
    }
  }
}
