import type { Plugin, PluginContext, TraceEvent } from './types';

/**
 * 插件基类，提供通用实现
 */
export abstract class BasePlugin implements Plugin {
  /** 插件名称 (唯一标识) */
  abstract name: string;

  /** 插件优先级 (数值越大越先执行，默认 0) */
  priority?: number;

  /**
   * 插件加载时调用
   * @param context - 插件上下文
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLoad?(_context: PluginContext): void | Promise<void> {
    // 默认空实现
  }

  /**
   * 事件处理钩子
   * @param event - 埋点事件
   * @returns 返回处理后的事件，void 表示丢弃事件
   */
  onEvent?(event: TraceEvent): TraceEvent | void {
    return event;
  }

  /**
   * 错误处理钩子
   * @param error - 错误对象
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onError?(_error: Error): void {
    // 默认空实现
  }

  /**
   * 批量上报前处理钩子
   * @param events - 事件数组
   * @returns 返回处理后的事件数组
   */
  onReport?(events: TraceEvent[]): TraceEvent[] {
    return events;
  }

  /**
   * 插件卸载时调用
   */
  onUnload?(): void {
    // 默认空实现
  }
}
