/**
 * 事件总线
 * 用于 SDK 内部模块间的通信
 */

export type EventHandler<T = unknown> = (data: T) => void;

interface EventSubscription {
  id: string;
  handler: EventHandler;
  once: boolean;
}

/**
 * 事件总线
 * 实现发布-订阅模式
 */
export class EventBus {
  private listeners: Map<string, EventSubscription[]> = new Map();
  private counter: number = 0;

  /**
   * 订阅事件
   * @param event - 事件名
   * @param handler - 处理函数
   * @returns 取消订阅函数
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const id = `sub_${++this.counter}`;
    const subscription: EventSubscription = {
      id,
      handler: handler as EventHandler,
      once: false,
    };

    this.addSubscription(event, subscription);

    // 返回取消订阅函数
    return () => this.off(event, id);
  }

  /**
   * 订阅一次性事件
   * @param event - 事件名
   * @param handler - 处理函数
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): void {
    const id = `sub_${++this.counter}`;
    const subscription: EventSubscription = {
      id,
      handler: handler as EventHandler,
      once: true,
    };

    this.addSubscription(event, subscription);
  }

  /**
   * 发布事件
   * @param event - 事件名
   * @param data - 事件数据
   */
  emit<T = unknown>(event: string, data?: T): void {
    const subscriptions = this.listeners.get(event);
    if (!subscriptions || subscriptions.length === 0) return;

    // 复制数组，避免在执行过程中修改
    const toExecute = [...subscriptions];

    for (const sub of toExecute) {
      try {
        sub.handler(data);

        // 一次性事件执行后移除
        if (sub.once) {
          this.off(event, sub.id);
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    }
  }

  /**
   * 取消订阅
   * @param event - 事件名
   * @param id - 订阅 ID
   */
  off(event: string, id?: string): void {
    if (!id) {
      // 移除所有该事件的订阅
      this.listeners.delete(event);
      return;
    }

    const subscriptions = this.listeners.get(event);
    if (!subscriptions) return;

    const index = subscriptions.findIndex((sub) => sub.id === id);
    if (index !== -1) {
      subscriptions.splice(index, 1);
    }

    // 如果没有订阅了，删除该事件
    if (subscriptions.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * 添加订阅
   */
  private addSubscription(event: string, subscription: EventSubscription): void {
    const subscriptions = this.listeners.get(event) || [];
    subscriptions.push(subscription);
    this.listeners.set(event, subscriptions);
  }

  /**
   * 检查是否有订阅者
   */
  hasListeners(event: string): boolean {
    const subscriptions = this.listeners.get(event);
    return subscriptions !== undefined && subscriptions.length > 0;
  }

  /**
   * 获取订阅数量
   */
  listenerCount(event: string): number {
    const subscriptions = this.listeners.get(event);
    return subscriptions?.length || 0;
  }

  /**
   * 清空所有订阅
   */
  clear(): void {
    this.listeners.clear();
  }
}

// 导出预定义事件类型
export const EventBusEvents = {
  // SDK 事件
  SDK_INIT: 'sdk:init',
  SDK_READY: 'sdk:ready',
  SDK_DESTROY: 'sdk:destroy',

  // 事件相关
  EVENT_CREATED: 'event:created',
  EVENT_BEFORE_SEND: 'event:beforeSend',
  EVENT_SENT: 'event:sent',
  EVENT_SEND_FAILED: 'event:sendFailed',

  // 会话相关
  SESSION_START: 'session:start',
  SESSION_END: 'session:end',
  SESSION_RENEW: 'session:renew',

  // 错误相关
  ERROR_CAPTURED: 'error:captured',

  // 用户相关
  USER_IDENTIFIED: 'user:identified',
  USER_ANONYMOUS: 'user:anonymous',
} as const;

export type EventBusEvent = (typeof EventBusEvents)[keyof typeof EventBusEvents];

// 导出单例
export const eventBus = new EventBus();
