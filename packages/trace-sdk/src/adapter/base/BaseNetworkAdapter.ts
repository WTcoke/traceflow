/**
 * 网络适配器抽象基类
 * 提供通用的请求头管理和配置持有
 */

import type { TraceEvent, SDKConfig } from '../../core/types';
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

  /** 发送单个事件 */
  abstract send(event: TraceEvent): Promise<void>;

  /** 批量发送事件 */
  abstract sendBatch(events: TraceEvent[]): Promise<void>;

  /** 发送数据（内部方法） */
  protected abstract post(data: unknown): Promise<void>;
}
