/**
 * 错误堆栈解析器
 * 统一处理不同浏览器和环境的错误格式
 */

export interface StackFrame {
  fileName: string;
  functionName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface ParsedError {
  name: string;
  message: string;
  stack: string;
  frames: StackFrame[];
}

/**
 * 解析错误堆栈
 */
export function parseStackFrames(error: Error): StackFrame[] {
  const stack = error.stack || '';
  return stack
    .split('\n')
    .map((line) => parseStackFrame(line.trim()))
    .filter((frame): frame is StackFrame => frame !== null);
}

/**
 * 解析单行堆栈信息
 */
function parseStackFrame(line: string): StackFrame | null {
  // Chrome: at functionName (fileName:line:col)
  // Firefox: functionName@fileName:line:col

  let match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
  if (match) {
    return {
      functionName: match[1] || '<anonymous>',
      fileName: match[2],
      lineNumber: parseInt(match[3], 10),
      columnNumber: parseInt(match[4], 10),
    };
  }

  // 简化格式: fileName:line:col
  match = line.match(/(.+?):(\d+):(\d+)/);
  if (match) {
    return {
      functionName: '<anonymous>',
      fileName: match[1],
      lineNumber: parseInt(match[2], 10),
      columnNumber: parseInt(match[3], 10),
    };
  }

  return null;
}

/**
 * 解析错误对象
 */
export function parseError(error: Error | string | unknown): ParsedError {
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
      stack: '',
      frames: [],
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack || '',
      frames: parseStackFrames(error),
    };
  }

  return {
    name: 'Unknown',
    message: String(error),
    stack: '',
    frames: [],
  };
}

/**
 * 安全地获取错误信息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * 错误分类
 */
export type ErrorCategory =
  | 'js_error' // JS 运行时错误
  | 'promise_error' // Promise 拒绝
  | 'resource_error' // 资源加载错误
  | 'network_error' // 网络请求错误
  | 'custom_error'; // 自定义错误

/**
 * 根据错误类型分类
 */
export function categorizeError(error: Error | string | unknown): ErrorCategory {
  const msg = getErrorMessage(error);

  if (msg.includes('Uncaught (in promise)')) {
    return 'promise_error';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'network_error';
  }
  if (msg.includes('Loading CSS') || msg.includes('img')) {
    return 'resource_error';
  }

  return 'js_error';
}
