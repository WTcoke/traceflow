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
