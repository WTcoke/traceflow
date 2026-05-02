// 错误监控相关类型定义

/**
 * 错误类型枚举
 * - js: JavaScript 运行时错误
 * - resource: 资源加载错误（图片、脚本、样式表等）
 * - promise: Promise 异步错误/未捕获的 Promise 拒绝
 * - api: API 请求错误（HTTP 错误、非 2xx 响应）
 */
export type ErrorType = 'js' | 'resource' | 'promise' | 'api';

/**
 * 错误详情报文类型
 * 包含错误的所有上下文信息，用于详情展示和调试
 */
export interface LogDetail {
  id: string; // 错误唯一标识
  type: ErrorType; // 错误类型
  message: string; // 错误信息（堆栈第一行）
  stack?: string; // 完整堆栈信息
  file?: string; // 出错文件路径
  line?: number; // 出错行号
  column?: number; // 出错列号
  pagePath: string; // 发生错误的页面路径
  userId?: string; // 用户 ID（脱敏）
  browser?: string; // 浏览器信息
  os?: string; // 操作系统信息
  occurredAt: string; // 发生时间（ISO 格式）
  affectedPv: number; // 影响页面浏览量
  affectedUsers: number; // 影响用户数
}

/**
 * 错误统计概览类型
 * 用于错误监控首页的统计卡片
 */
export interface ErrorSummary {
  key: string;
  label: string; // 指标名称
  value: number; // 当前值
  unit?: string; // 单位
  trend?: number; // 环比变化率（百分比）
  trendDirection?: 'up' | 'down' | 'flat';
  compareText?: string; // 对比文案，如"较昨日"
  status?: 'success' | 'warning' | 'error' | 'default';
  sparkline?: number[]; // 迷你图数据
}

/**
 * 错误分布类型
 * 用于饼图/柱状图展示不同错误类型的分布
 */
export interface ErrorDistribution {
  type: ErrorType; // 错误类型
  count: number; // 错误数量
  percentage: number; // 占比百分比
}

/**
 * 错误追踪信息类型
 * 用于关联同类错误的多次发生
 */
export interface ErrorTrace {
  id: string; // 错误 ID（相同的错误有相同的 traceId）
  count: number; // 累计发生次数
  firstOccurredAt: string; // 首次发生时间
  lastOccurredAt: string; // 最近发生时间
  affectedPv: number; // 累计影响 PV
  affectedUsers: number; // 累计影响用户数
}
