import type { TraceEvent, EventPriority } from '../core/types';

/**
 * 事件队列配置
 */
export interface QueueConfig {
  /** 队列最大容量 */
  maxSize?: number;
  /** 批量上报数量阈值 */
  batchSize?: number;
  /** 是否启用优先级队列 */
  enablePriority?: boolean;
}

/**
 * 内存事件队列
 * 实现 FIFO + 优先级队列
 */
export class EventQueue {
  private queue: TraceEvent[] = [];
  protected config: Required<QueueConfig>;
  private overflowHandler?: (events: TraceEvent[]) => void;

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 1000,
      batchSize: config.batchSize ?? 10,
      enablePriority: config.enablePriority ?? true,
    };
  }

  /**
   * 添加事件到队列
   */
  push(event: TraceEvent): boolean {
    // 队列已满
    if (this.queue.length >= this.config.maxSize) {
      // 丢弃最旧事件
      const dropped = this.queue.shift();
      if (dropped && this.overflowHandler) {
        this.overflowHandler([dropped]);
      }
    }

    if (this.config.enablePriority) {
      this.insertWithPriority(event);
    } else {
      this.queue.push(event);
    }

    return true;
  }

  /**
   * 批量添加事件
   */
  pushBatch(events: TraceEvent[]): void {
    for (const event of events) {
      this.push(event);
    }
  }

  /**
   * 获取待上报事件（不删除）
   */
  peek(count?: number): TraceEvent[] {
    if (count === undefined) {
      return [...this.queue];
    }
    return this.queue.slice(0, count);
  }

  /**
   * 取出待上报事件
   */
  pop(count?: number): TraceEvent[] {
    if (count === undefined) {
      const events = [...this.queue];
      this.queue = [];
      return events;
    }
    return this.queue.splice(0, count);
  }

  /**
   * 获取满足批量条件的批次
   */
  getBatch(): TraceEvent[] {
    return this.pop(this.config.batchSize);
  }

  /**
   * 检查是否满足批量条件
   */
  isBatchReady(): boolean {
    return this.queue.length >= this.config.batchSize;
  }

  /**
   * 队列大小
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * 队列是否为空
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * 清空队列
   */
  clear(): TraceEvent[] {
    const events = [...this.queue];
    this.queue = [];
    return events;
  }

  /**
   * 移除特定事件
   */
  remove(eventId: string): boolean {
    const index = this.queue.findIndex((e) => e.eventId === eventId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 设置溢出处理函数
   */
  onOverflow(handler: (events: TraceEvent[]) => void): void {
    this.overflowHandler = handler;
  }

  /**
   * 按优先级插入
   */
  private insertWithPriority(event: TraceEvent): void {
    const priorityOrder: Record<EventPriority, number> = {
      critical: 0,
      normal: 1,
      low: 2,
    };

    const eventPriority = priorityOrder[event.priority || 'normal'];

    // 找到插入位置
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const currentPriority = priorityOrder[this.queue[i].priority || 'normal'];
      if (eventPriority < currentPriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, event);
  }

  /**
   * 获取内部队列（仅供子类使用）
   */
  protected getQueue(): TraceEvent[] {
    return this.queue;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      size: this.queue.length,
      maxSize: this.config.maxSize,
      batchSize: this.config.batchSize,
      usage: this.queue.length / this.config.maxSize,
    };
  }
}
