import { BaseNetworkAdapter } from '../../adapter/base/BaseNetworkAdapter';
import type { TraceEvent, SDKConfig } from '../../core/types';
import type { IWebNetworkAdapter } from './types';

interface ServerResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  requestId?: string;
}

/**
 * Web 端网络适配器实现
 * 统一使用 fetch POST 发送数据
 */
export class WebNetworkAdapter extends BaseNetworkAdapter implements IWebNetworkAdapter {
  constructor(config: SDKConfig) {
    super(config);
  }

  /**
   * 批量发送事件
   */
  async sendBatch(events: TraceEvent[]): Promise<void> {
    if (events.length === 0) return;

    const payload = this.createCollectPayload(events);
    await this.post(payload);
  }

  /**
   * Web 页面卸载期尽力补发。只表示浏览器接受发送任务，不代表后端业务成功。
   */
  sendBeacon(events: TraceEvent[]): boolean {
    if (
      events.length === 0 ||
      typeof navigator === 'undefined' ||
      typeof navigator.sendBeacon !== 'function'
    ) {
      return false;
    }

    const payload = JSON.stringify(this.createCollectPayload(events));
    return navigator.sendBeacon(
      this.getCollectUrl(),
      new Blob([payload], { type: 'application/json' }),
    );
  }

  /**
   * 使用 fetch POST 发送数据
   */
  protected async post(data: unknown): Promise<void> {
    if (typeof fetch !== 'function') {
      throw new Error('fetch is not available');
    }

    const response = await fetch(this.getCollectUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      keepalive: true,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? ((await response.json()) as ServerResponse)
      : null;

    if (!response.ok) {
      console.error(`Failed to send trace data: ${response.status} ${response.url}`);
      const message = payload?.message || `Network request failed: ${response.status}`;
      throw new Error(message);
    }

    if (payload && (payload.code < 200 || payload.code >= 300)) {
      throw new Error(payload.message || `Business request failed: ${payload.code}`);
    }
  }
}
