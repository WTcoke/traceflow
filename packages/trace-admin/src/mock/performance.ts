import type { MetricData, WebVitalMetric, RankingItem } from '@/types/metric';
import * as echarts from 'echarts';

/**
 * 性能分析页面 Mock 数据
 * 包含：核心性能指标、Web Vitals 指标、性能趋势图、性能排行数据
 */

// ========== 核心性能指标 ==========

export const performanceMetrics: MetricData[] = [
  {
    key: 'fcp',
    label: '首次内容绘制(FCP)',
    value: 1240,
    unit: 'ms',
    trend: -5,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [1350, 1320, 1280, 1260, 1250, 1240, 1240],
    status: 'success',
  },
  {
    key: 'lcp',
    label: '最大内容绘制(LCP)',
    value: 2350,
    unit: 'ms',
    trend: 2,
    trendDirection: 'up',
    compareText: '较昨日',
    sparkline: [2200, 2250, 2300, 2320, 2340, 2350, 2350],
    status: 'warning',
  },
  {
    key: 'cls',
    label: '累积布局偏移(CLS)',
    value: 0.08,
    trend: -0.02,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [0.12, 0.11, 0.1, 0.09, 0.08, 0.08, 0.08],
    status: 'success',
  },
  {
    key: 'tti',
    label: '可交互时间(TTI)',
    value: 3200,
    unit: 'ms',
    trend: -100,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [3400, 3350, 3300, 3250, 3220, 3200, 3200],
    status: 'warning',
  },
];

// ========== Web Vitals 指标 ==========

export const webVitalsMetrics: WebVitalMetric[] = [
  {
    name: 'FP',
    value: 850,
    unit: 'ms',
    target: 1000,
    passRate: 95,
    status: 'good',
  },
  {
    name: 'FCP',
    value: 1240,
    unit: 'ms',
    target: 1800,
    passRate: 92,
    status: 'good',
  },
  {
    name: 'LCP',
    value: 2350,
    unit: 'ms',
    target: 2500,
    passRate: 78,
    status: 'warning',
  },
  {
    name: 'CLS',
    value: 0.08,
    unit: '',
    target: 0.1,
    passRate: 85,
    status: 'good',
  },
  {
    name: 'TTI',
    value: 3200,
    unit: 'ms',
    target: 3800,
    passRate: 82,
    status: 'warning',
  },
];

// ========== 性能趋势图配置 ==========

export const performanceTrendOption: echarts.EChartsOption = {
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', name: 'ms' },
  legend: {
    data: ['FCP', 'LCP', 'TTI'],
    top: 0,
  },
  series: [
    {
      name: 'FCP',
      data: [1300, 1280, 1260, 1250, 1240, 1240, 1240],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#52c41a', width: 2 },
    },
    {
      name: 'LCP',
      data: [2400, 2380, 2360, 2350, 2350, 2350, 2350],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#faad14', width: 2 },
    },
    {
      name: 'TTI',
      data: [3300, 3280, 3250, 3220, 3200, 3200, 3200],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#1890ff', width: 2 },
    },
  ],
};

// ========== 慢页面排行数据 ==========

export const slowPagesRanking: RankingItem[] = [
  { id: '1', name: '/product/detail', value: 4500, unit: 'ms', rank: 1 },
  { id: '2', name: '/checkout', value: 3800, unit: 'ms', rank: 2 },
  { id: '3', name: '/search/results', value: 3200, unit: 'ms', rank: 3 },
  { id: '4', name: '/user/profile', value: 2800, unit: 'ms', rank: 4 },
  { id: '5', name: '/cart', value: 2500, unit: 'ms', rank: 5 },
];
