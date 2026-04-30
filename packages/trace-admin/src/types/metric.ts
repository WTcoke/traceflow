// 指标卡片类型
export interface MetricData {
  //
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'flat';
  compareText?: string;
  status?: 'success' | 'warning' | 'error' | 'default';
  sparkline?: number[];
}

// 排行表格类型
export interface RankingItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
  extra?: string;
  rank: number;
}

// Web Vitals 指标类型
export interface WebVitalMetric {
  name: 'FP' | 'FCP' | 'LCP' | 'CLS' | 'TTI';
  value: number;
  unit: 'ms' | '';
  target: number;
  passRate: number;
  status: 'good' | 'warning' | 'bad';
}

// API 健康指标类型（用于展示成功率、超时率等）
export interface ApiHealthMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'flat';
  compareText?: string;
  status?: 'success' | 'warning' | 'error' | 'default';
  sparkline?: number[];
}

// 最慢接口类型（用于排行表格）
export interface SlowApiItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  avgDuration: number;
  p99Duration: number;
  callCount: number;
  errorRate: number;
  rank: number;
}

// 用户地域分布类型（用于排行表格）
export interface UserLocationItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
  percentage: number;
  rank: number;
}
