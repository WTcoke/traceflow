import type { MetricData, RankingItem } from '@/types/metric';
import * as echarts from 'echarts';

/**
 * 用户行为分析页面 Mock 数据
 * 包含：核心行为指标、页面访问排行、行为趋势图、用户行为指标
 */

// ========== 核心行为指标 ==========

export const behaviorMetrics: MetricData[] = [
  {
    key: 'pv',
    label: '页面访问量(PV)',
    value: 48293,
    unit: '万',
    trend: 12,
    trendDirection: 'up',
    compareText: '较昨日',
    sparkline: [120, 132, 101, 134, 90, 230, 210],
    status: 'success',
  },
  {
    key: 'uv',
    label: '独立访客(UV)',
    value: 8234,
    unit: '万',
    trend: 5,
    trendDirection: 'up',
    compareText: '较昨日',
    sparkline: [80, 92, 78, 99, 65, 145, 160],
    status: 'success',
  },
  {
    key: 'avg_stay_time',
    label: '平均停留时长',
    value: 3,
    unit: 'm 42s',
    trend: 8.2,
    trendDirection: 'up',
    compareText: 'vs 昨日',
    sparkline: [85, 92, 88, 95, 105, 110, 115],
    status: 'default',
  },
  {
    key: 'most_time_page',
    label: '访问时间最长页面',
    value: 5,
    unit: 'm 32s',
    trend: 15.5,
    trendDirection: 'up',
    compareText: 'vs 昨日',
    sparkline: [180, 200, 220, 250, 280, 300, 332],
    status: 'success',
  },
];

// ========== 用户行为指标 ==========

export const behaviorIndicatorMetrics = [
  {
    name: 'PV',
    label: '页面访问量',
    value: 48293,
    unit: '万',
    target: 50000,
    passRate: 96.6,
    status: 'good' as const,
  },
  {
    name: 'UV',
    label: '独立访客',
    value: 8234,
    unit: '万',
    target: 8000,
    passRate: 102.9,
    status: 'good' as const,
  },
  {
    name: 'AVG_STAY',
    label: '平均停留时长',
    value: 222,
    unit: '秒',
    target: 180,
    passRate: 123.3,
    status: 'good' as const,
  },
  {
    name: 'BOUNCE',
    label: '跳出率',
    value: 45.6,
    unit: '%',
    target: 50,
    passRate: 89.2,
    status: 'warning' as const,
  },
];

// ========== 行为趋势图配置 ==========

export const behaviorTrendOption: echarts.EChartsOption = {
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: [
    {
      type: 'value',
      name: 'PV',
      position: 'left',
    },
    {
      type: 'value',
      name: 'UV',
      position: 'right',
    },
  ],
  legend: {
    data: ['PV', 'UV'],
    top: 0,
  },
  series: [
    {
      name: 'PV',
      data: [12000, 8000, 45000, 82000, 76000, 55000, 32000],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#1890ff', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1890ff40' },
          { offset: 1, color: '#1890ff00' },
        ]),
      },
    },
    {
      name: 'UV',
      data: [3200, 2100, 12000, 22000, 20000, 14500, 8500],
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      lineStyle: { color: '#52c41a', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#52c41a40' },
          { offset: 1, color: '#52c41a00' },
        ]),
      },
    },
  ],
};

// ========== 页面访问排行数据 ==========

export const pageVisitRanking: RankingItem[] = [
  { id: '1', name: '/home', value: 12340, rank: 1 },
  { id: '2', name: '/products', value: 8921, rank: 2 },
  { id: '3', name: '/product/detail', value: 6543, rank: 3 },
  { id: '4', name: '/cart', value: 4321, rank: 4 },
  { id: '5', name: '/checkout', value: 2341, rank: 5 },
];
