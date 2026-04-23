// 错误详情类型
export interface LogDetail {
  id: string;
  type: 'js' | 'resource' | 'promise' | 'api';
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  pagePath: string;
  userId?: string;
  browser?: string;
  os?: string;
  occurredAt: string;
  affectedPv: number;
  affectedUsers: number;
}
