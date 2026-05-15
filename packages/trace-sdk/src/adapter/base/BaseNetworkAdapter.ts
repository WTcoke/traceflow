/**
 * 网络适配器抽象基类
 * 提供通用配置持有和采集 payload 构造
 */

import type { BatchCollectPayload, TraceEvent, SDKConfig } from '../../core/types';
import type { INetworkAdapter } from '../types';

/**
 * 网络适配器抽象基类
 * 提供通用配置和采集 payload 构造
 */
export abstract class BaseNetworkAdapter implements INetworkAdapter {
  protected config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  protected getCollectUrl(): string {
    if (this.config.baseUrl) {
      return `${this.normalizeBaseUrl(this.config.baseUrl)}/collect`;
    }

    if (!this.config.serverUrl) {
      throw new Error('serverUrl is required');
    }

    return this.config.serverUrl;
  }

  protected createCollectPayload(events: TraceEvent[]): BatchCollectPayload {
    return {
      appId: this.config.appId,
      events,
    };
  }

  private normalizeBaseUrl(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /** 批量发送事件 */
  abstract sendBatch(events: TraceEvent[]): Promise<void>;
}
