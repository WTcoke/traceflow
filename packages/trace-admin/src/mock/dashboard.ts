import type { MetricData } from '@/types/metric';
import type { RankingItem } from '@/types/metric';
import * as echarts from 'echarts';

/**
 * 平台首页 Mock 数据
 * 包含：指标卡片数据、排行数据、图表配置
 */

// ========== 指标卡片数据 ==========

/**
 * 首页指标卡片 Mock 数据
 * 包含 PV、UV、错误数、LCP 四个核心指标
 */
export const mockMetrics: MetricData[] = [
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
    key: 'error',
    label: '今日错误总量',
    value: 127,
    trend: -8,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [140, 132, 128, 135, 130, 128, 127],
    status: 'warning',
  },
  {
    key: 'lcp',
    label: 'LCP 平均值',
    value: 2340,
    unit: 'ms',
    trend: 3,
    trendDirection: 'up',
    compareText: '较昨日',
    sparkline: [2100, 2250, 2300, 2280, 2320, 2350, 2340],
    status: 'warning',
  },
];

// ========== 排行表格数据 ==========

/**
 * 高频错误排行 Mock 数据
 */
export const mockErrorRanking: RankingItem[] = [
  { id: '1', name: 'TypeError: Cannot read property of undefined', value: 1234, rank: 1 },
  { id: '2', name: 'SyntaxError: Unexpected token', value: 987, rank: 2 },
  { id: '3', name: 'ReferenceError: xxx is not defined', value: 654, rank: 3 },
  { id: '4', name: 'RangeError: Invalid array length', value: 321, rank: 4 },
  { id: '5', name: 'Error: Network request failed', value: 210, rank: 5 },
];

// ========== 图表配置 ==========

/**
 * API 响应时间趋势图 ECharts 配置
 * 蓝色折线图，面积图渐变效果
 */
export const apiResponseTimeOption: echarts.EChartsOption = {
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', name: 'ms' },
  series: [
    {
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1890ff40' },
          { offset: 1, color: '#1890ff00' },
        ]),
      },
      lineStyle: { color: '#1890ff', width: 2 },
    },
  ],
};

/**
 * 错误数量趋势图 ECharts 配置
 * 红色折线图，面积图渐变效果
 */
export const errorCountOption: echarts.EChartsOption = {
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', name: '次' },
  series: [
    {
      data: [12, 8, 15, 23, 18, 10, 7],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ff4d4f40' },
          { offset: 1, color: '#ff4d4f00' },
        ]),
      },
      lineStyle: { color: '#ff4d4f', width: 2 },
    },
  ],
};
