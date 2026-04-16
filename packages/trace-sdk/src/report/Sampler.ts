import type { TraceEvent } from '../core/types';

/**
 * 采样配置
 */
export interface SamplerConfig {
  /** 全局采样率 0-1 */
  rate?: number;
  /** 事件类型级别采样 */
  byEventType?: Partial<Record<string, number>>;
  /** 基于用户 ID 的一致性采样 */
  consistentByUser?: boolean;
}

/**
 * 采样率控制器
 * 实现一致性和差异化采样
 */
export class Sampler {
  private config: Required<SamplerConfig>;
  private hashCache: Map<string, boolean> = new Map();

  constructor(config: SamplerConfig = {}) {
    this.config = {
      rate: config.rate ?? 1,
      byEventType: config.byEventType ?? {},
      consistentByUser: config.consistentByUser ?? true,
    };
  }

  /**
   * 判断事件是否应该采样
   */
  shouldSample(event: TraceEvent): boolean {
    // 关键事件不过采样
    if (event.priority === 'critical' || event.eventType === 'error') {
      return true;
    }

    // 获取该事件类型的采样率
    const rate = this.getRate(event);

    // 全量采样
    if (rate >= 1) return true;

    // 关闭采样
    if (rate <= 0) return false;

    // 一致性采样：相同用户对相同事件始终相同结果
    const key = this.getSampleKey(event);

    if (this.config.consistentByUser && this.hashCache.has(key)) {
      return this.hashCache.get(key)!;
    }

    // 计算采样结果
    const result = this.hash(key) < rate;

    if (this.config.consistentByUser) {
      this.hashCache.set(key, result);
      // 限制缓存大小
      if (this.hashCache.size > 10000) {
        const firstKey = this.hashCache.keys().next().value;
        if (firstKey) this.hashCache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * 获取事件采样率
   */
  private getRate(event: TraceEvent): number {
    // 优先使用事件类型特定的采样率
    if (event.eventType in this.config.byEventType) {
      return this.config.byEventType[event.eventType]!;
    }
    return this.config.rate;
  }

  /**
   * 获取采样键
   */
  private getSampleKey(event: TraceEvent): string {
    const userId = event.userId || event.anonymousId || '';
    return `${userId}:${event.eventType}:${event.eventName || ''}`;
  }

  /**
   * 简单哈希函数
   * 使用更安全的实现避免位溢出问题
   */
  private hash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      // 使用无符号右移确保整数在安全范围内
      hash = Math.imul(hash, 31) + char;
      // 确保 hash 在 32 位整数安全范围内
      hash = hash | 0;
    }
    // 转换为 0-1 范围，使用无符号转换避免负数问题
    return (hash >>> 0) / 4294967296;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SamplerConfig>): void {
    Object.assign(this.config, config);
    this.hashCache.clear();
  }

  /**
   * 获取统计
   */
  getStats(): SamplerConfig {
    return { ...this.config };
  }
}
