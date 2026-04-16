/**
 * 工具函数导出
 */

// UUID 生成
export { generateId, randomString, uuid, shortId } from './uuid';

// 会话管理
export { SessionManager, getSessionManager } from './session';

// 错误解析
export {
  parseStackFrames,
  parseError,
  getErrorMessage,
  categorizeError,
  type StackFrame,
  type ParsedError,
  type ErrorCategory,
} from './ErrorParser';
