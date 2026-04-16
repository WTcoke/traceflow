/**
 * Node.js 网络适配器
 */

import type { INetworkAdapter } from '../../adapter/types';
import type { TraceEvent } from '../../core/types';

// Node.js 环境下的类型定义
declare const global: typeof globalThis;

export class NodeNetworkAdapter implements INetworkAdapter {
  private serverUrl: string;
  private headers: Record<string, string> = {};
  private fetch: typeof fetch;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    // 使用全局 fetch 或导入 node-fetch
    this.fetch =
      global.fetch ||
      (global as typeof globalThis & { nodeFetch?: typeof fetch }).nodeFetch ||
      fetch;
  }

  async send(event: TraceEvent): Promise<void> {
    return this.sendBatch([event]);
  }

  async sendBatch(events: TraceEvent[]): Promise<void> {
    const response = await this.fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }
}
