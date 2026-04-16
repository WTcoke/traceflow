import type { Plugin, TraceEvent } from './types';

/**
 * 插件钩子执行结果
 */
export interface PluginHookResult {
  /** 是否继续执行 */
  continue: boolean;
  /** 处理后的事件 */
  event?: TraceEvent;
}

/**
 * 插件管理器
 * 支持优先级排序和有序执行链
 */
export class PluginManager {
  private plugins: Plugin[] = [];

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    // 按 name 去重：同名插件只保留一个
    const existingIndex = this.plugins.findIndex((p) => p.name === plugin.name);
    if (existingIndex !== -1) {
      // 替换已有插件，并调用旧插件的 onUnload
      const oldPlugin = this.plugins[existingIndex];
      try {
        oldPlugin.onUnload?.();
      } catch (error) {
        console.error(`[PluginManager] Error in ${oldPlugin.name}.onUnload:`, error);
      }
      this.plugins[existingIndex] = plugin;
    } else {
      this.insertByPriority(plugin);
    }
  }

  /**
   * 按优先级插入插件
   */
  private insertByPriority(plugin: Plugin): void {
    const priority = plugin.priority ?? 0;
    let insertIndex = this.plugins.length;

    for (let i = 0; i < this.plugins.length; i++) {
      const currentPriority = this.plugins[i].priority ?? 0;
      if (priority > currentPriority) {
        insertIndex = i;
        break;
      }
    }

    this.plugins.splice(insertIndex, 0, plugin);
  }

  /**
   * 执行插件钩子
   */
  execute(method: 'onLoad' | 'onError' | 'onUnload', arg?: unknown): void {
    for (const plugin of this.plugins) {
      const fn = plugin[method];
      if (typeof fn === 'function') {
        try {
          if (method === 'onLoad') {
            const result = (fn as (arg: unknown) => void | Promise<void>)(arg);
            // 处理 async onLoad 钩子
            if (result && typeof result.then === 'function') {
              result.catch((error: Error) => {
                console.error(`[PluginManager] Async error in ${plugin.name}.onLoad:`, error);
              });
            }
          } else if (method === 'onError') {
            (fn as (error: Error) => void)(arg as Error);
          } else {
            (fn as () => void)();
          }
        } catch (error) {
          console.error(`[PluginManager] Error in ${plugin.name}.${method}:`, error);
        }
      }
    }
  }

  /**
   * 执行事件钩子（带修改能力）
   */
  executeEventHook(event: TraceEvent): TraceEvent | null {
    let result: TraceEvent | null = event;

    for (const plugin of this.plugins) {
      if (!plugin.onEvent) continue;

      try {
        const hookResult = plugin.onEvent(result);
        if (hookResult === undefined) {
          return null;
        }
        result = hookResult;
      } catch (error) {
        console.error(`[PluginManager] Error in ${plugin.name}.onEvent:`, error);
      }
    }

    return result;
  }

  /**
   * 批量执行上报前钩子
   */
  executeReportHook(events: TraceEvent[]): TraceEvent[] {
    let result = events;

    for (const plugin of this.plugins) {
      if (!plugin.onReport) continue;

      try {
        result = plugin.onReport(result);
        if (!result || result.length === 0) break;
      } catch (error) {
        console.error(`[PluginManager] Error in ${plugin.name}.onReport:`, error);
      }
    }

    return result;
  }

  /**
   * 卸载所有插件
   */
  unloadAll(): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onUnload?.();
      } catch (error) {
        console.error(`[PluginManager] Error unloading ${plugin.name}:`, error);
      }
    }
    this.plugins = [];
  }

  /**
   * 获取已注册插件列表
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * 获取插件数量
   */
  size(): number {
    return this.plugins.length;
  }
}
