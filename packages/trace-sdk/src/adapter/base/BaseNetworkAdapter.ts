/**
 * 网络适配器抽象基类
 * 提供通用的请求头管理和配置持有
 */

import type {
  BatchCollectPayload,
  SingleCollectPayload,
  TraceEvent,
  SDKConfig,
} from '../../core/types';
import type { INetworkAdapter } from '../types';

/**
 * 网络适配器抽象基类
 * 提供请求头管理和通用配置
 */
export abstract class BaseNetworkAdapter implements INetworkAdapter {
  protected config: SDKConfig;
  protected headers: Map<string, string> = new Map();

  constructor(config: SDKConfig) {
    this.config = config;
    this.initHeaders();
  }

  /** 初始化请求头 */
  protected initHeaders(): void {
    this.headers.set('Content-Type', 'application/json');
    this.headers.set('X-SDK-Version', '1.0.0');
    if (this.config.appKey) {
      this.headers.set('X-App-Key', this.config.appKey);
    }
  }

  /** 设置请求头 */
  setHeader(key: string, value: string): void {
    this.headers.set(key, value);
  }

  /** 获取请求头 */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    this.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  protected getBatchUrl(): string {
    return `${this.requireBaseUrl()}/collect/batch`;
  }

  protected getSingleUrl(): string {
    return `${this.requireBaseUrl()}/collect/single`;
  }

  protected createBatchPayload(events: TraceEvent[]): BatchCollectPayload {
    return {
      projectId: this.requireProjectId(),
      requestId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      data: events,
    };
  }

  protected createSinglePayload(event: TraceEvent): SingleCollectPayload {
    return {
      projectId: this.requireProjectId(),
      data: event,
    };
  }

  private requireBaseUrl(): string {
    if (!this.config.baseUrl) {
      throw new Error('baseUrl is required');
    }

    return this.config.baseUrl;
  }

  private requireProjectId(): string {
    if (!this.config.projectId) {
      throw new Error('projectId is required');
    }

    return this.config.projectId;
  }

  /** 发送单个事件 */
  abstract send(event: TraceEvent): Promise<void>;

  /** 批量发送事件 */
  abstract sendBatch(events: TraceEvent[]): Promise<void>;

  /** 发送数据（内部方法） */
  protected abstract post(data: unknown): Promise<void>;
}
