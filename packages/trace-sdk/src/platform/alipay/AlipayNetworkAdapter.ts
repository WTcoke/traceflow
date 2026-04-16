/**
 * 支付宝小程序网络适配器
 */

import type { INetworkAdapter } from '../../adapter/types';
import type { TraceEvent } from '../../core/types';

export class AlipayNetworkAdapter implements INetworkAdapter {
  private serverUrl: string;
  private headers: Record<string, string> = {};

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  async send(event: TraceEvent): Promise<void> {
    return this.sendBatch([event]);
  }

  async sendBatch(events: TraceEvent[]): Promise<void> {
    return new Promise((resolve, reject) => {
      my!.httpRequest({
        url: this.serverUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        data: JSON.stringify(events),
        success: (res: { status: number }) => {
          if (res.status >= 200 && res.status < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.status}`));
          }
        },
        fail: (err: { errorMessage?: string; errMsg?: string }) => {
          reject(new Error(err.errorMessage || err.errMsg || 'Request failed'));
        },
      });
    });
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }
}
