import { BaseNetworkAdapter } from '../../adapter/base/BaseNetworkAdapter';
import type { TraceEvent, SDKConfig } from '../../core/types';

interface ServerResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * Web 端网络适配器实现
 * 统一使用 fetch POST 发送数据
 */
export class WebNetworkAdapter extends BaseNetworkAdapter {
  constructor(config: SDKConfig) {
    super(config);
  }

  /**
   * 发送单个事件
   */
  async send(event: TraceEvent): Promise<void> {
    const payload = this.createSinglePayload(event);
    await this.post(payload, this.getSingleUrl());
  }

  /**
   * 批量发送事件
   */
  async sendBatch(events: TraceEvent[]): Promise<void> {
    if (events.length === 0) return;

    console.log('Sending batch events:', events);

    const payload = this.createBatchPayload(events);
    await this.post(payload, this.getBatchUrl());
  }

  /**
   * 使用 fetch POST 发送数据
   */
  protected async post(data: unknown, url?: string): Promise<void> {
    const response = await fetch(url || this.config.serverUrl, {
      method: 'POST',
      headers: this.getHeaders(),
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

    if (payload && payload.code !== 200) {
      throw new Error(payload.message || `Business request failed: ${payload.code}`);
    }
  }
}
