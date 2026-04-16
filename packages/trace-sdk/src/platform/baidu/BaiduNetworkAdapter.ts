/**
 * 百度小程序网络适配器
 */

import type { INetworkAdapter } from '../../adapter/types';
import type { TraceEvent } from '../../core/types';

export class BaiduNetworkAdapter implements INetworkAdapter {
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
      swan!.request({
        url: this.serverUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        data: JSON.stringify(events),
        success: (res: { statusCode: number }) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        },
        fail: (err: { errMsg?: string }) => {
          reject(new Error(err.errMsg || 'Request failed'));
        },
      });
    });
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }
}
