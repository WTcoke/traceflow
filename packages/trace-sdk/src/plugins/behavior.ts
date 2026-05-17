import { PluginContext, TracePlugin } from '../types/index';

/**
 * 用户行为监控插件
 * 捕获用户的交互行为（如鼠标点击），并可选地提取目标元素结构（类似 XPath 操作路径）
 */
export class BehaviorPlugin implements TracePlugin {
  name = 'traceflow-behavior';
  private ctx: PluginContext | null = null;
  private handleClickBind: (e: MouseEvent) => void;

  constructor() {
    this.handleClickBind = this.handleClick.bind(this);
  }

  install(ctx: PluginContext) {
    this.ctx = ctx;
    window.addEventListener('click', this.handleClickBind, true); // true 表示在捕获阶段处理
  }

  uninstall() {
    window.removeEventListener('click', this.handleClickBind, true);
  }

  private handleClick(e: MouseEvent) {
    if (!this.ctx) return;
    const target = e.target as HTMLElement;

    if (target) {
      const elementPath = this.getDomPath(target);
      const isInteraction =
        ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
        target.hasAttribute('role');

      // 默认记录所有点击事件，或仅根据配置记录交互元素
      // 这里我们上报结构化的交互事件
      this.ctx.report({
        type: 'behavior',
        name: 'click',
        data: {
          tag: target.tagName.toLowerCase(),
          id: target.id,
          classes: target.className ? String(target.className) : undefined,
          text: target.innerText?.substring(0, 100),
          path: elementPath,
          x: e.clientX,
          y: e.clientY,
          isInteractive: isInteraction,
        },
      });
    }
  }

  /**
   * 生成该元素的简化版结构化 DOM 路径（类似 XPath）
   */
  private getDomPath(el: HTMLElement | null): string {
    if (!el) return '';
    const path: string[] = [];
    let current: HTMLElement | null = el;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break; // ID 原理上是全局唯一的，可以直接中断向上查找
      } else {
        let sibling: HTMLElement | null = current;
        let index = 1;
        while ((sibling = sibling.previousElementSibling as HTMLElement | null)) {
          if (sibling.nodeName.toLowerCase() === selector) {
            index++;
          }
        }
        if (index > 1) {
          selector += `:nth-of-type(${index})`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;

      if (current?.tagName === 'HTML' || current?.tagName === 'BODY') break;
    }
    return path.join(' > ');
  }
}
