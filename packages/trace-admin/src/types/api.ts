// API 响应基础类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

// 分页类型
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
