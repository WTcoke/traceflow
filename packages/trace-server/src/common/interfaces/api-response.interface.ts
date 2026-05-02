/**
 * 统一响应格式
 * 与 ResponseInterceptor 和 HttpExceptionFilter 保持一致
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

/**
 * 分页数据结构
 */
export interface PaginatedResponse<T> {
  total: number;
  pages: number;
  list: T[];
}
