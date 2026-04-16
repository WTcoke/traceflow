/**
 * 跨平台定时器工具
 * 兼容浏览器、Node.js、小程序等多种运行环境
 * @packageDocumentation
 */

/**
 * 获取全局对象
 * 优先使用 globalThis（ES2020），依次 fallback 到各平台全局对象
 */
function getGlobalThis(): typeof globalThis {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof window !== 'undefined') {
    return window as unknown as typeof globalThis;
  }
  if (typeof global !== 'undefined') {
    return global as unknown as typeof globalThis;
  }
  if (typeof self !== 'undefined') {
    return self as unknown as typeof globalThis;
  }
  // 极端情况：返回空对象，定时器将不可用
  return {} as typeof globalThis;
}

/**
 * 跨平台 setTimeout
 */
export const crossSetTimeout =
  typeof getGlobalThis().setTimeout === 'function'
    ? getGlobalThis().setTimeout.bind(getGlobalThis())
    : undefined;

/**
 * 跨平台 clearTimeout
 */
export const crossClearTimeout =
  typeof getGlobalThis().clearTimeout === 'function'
    ? getGlobalThis().clearTimeout.bind(getGlobalThis())
    : undefined;

/**
 * 跨平台 setInterval
 */
export const crossSetInterval =
  typeof getGlobalThis().setInterval === 'function'
    ? getGlobalThis().setInterval.bind(getGlobalThis())
    : undefined;

/**
 * 跨平台 clearInterval
 */
export const crossClearInterval =
  typeof getGlobalThis().clearInterval === 'function'
    ? getGlobalThis().clearInterval.bind(getGlobalThis())
    : undefined;

/** 定时器 ID 类型 */
export type TimerId = ReturnType<typeof setTimeout>;
