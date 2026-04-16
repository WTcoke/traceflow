/**
 * UUID 生成器
 * 生成唯一的标识符
 */

/** 字符集 */
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * 生成 16 字符的唯一 ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${randomString(8)}`;
}

/**
 * 生成指定长度的随机字符串
 */
export function randomString(length: number = 8): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

/**
 * 生成标准 UUID v4
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成短 UUID (8字节)
 */
export function shortId(): string {
  return uuid().replace(/-/g, '').substring(0, 16);
}
