import type { MetricData } from '@/types/metric';
import type { RankingItem } from '@/types/metric';
import type { SlowApiItem, UserLocationItem } from '@/types/metric';
import * as echarts from 'echarts';

/**
 * 平台首页 Mock 数据
 * 包含：指标卡片数据、排行数据、图表配置
 */

// ========== 指标卡片数据 ==========

/**
 * 首页指标卡片 Mock 数据
 * 包含 PV、UV、错误数、LCP 四个核心指标
 * 注意：error/lcp 等关键词会自动识别为 negative 指标（下降=好）
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

/**
 * API 健康指标 Mock 数据（新增）
 * 包含 API 成功率和错误率两个关键业务指标
 * - api_success_rate: API成功率（越高越好 → positive）
 * - error_rate: 错误率（越低越好 → negative）
 */
export const mockApiHealthMetrics: MetricData[] = [
  {
    key: 'api_success_rate',
    label: 'API 成功率',
    value: 99.2,
    unit: '%',
    trend: 0.3,
    trendDirection: 'up',
    compareText: '较昨日',
    sparkline: [98.5, 98.8, 99.0, 99.1, 99.2, 99.1, 99.2],
    status: 'success',
  },
  {
    key: 'error_rate',
    label: '页面错误率',
    value: 0.26,
    unit: '%',
    trend: -0.05,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [0.35, 0.32, 0.3, 0.28, 0.27, 0.27, 0.26],
    status: 'success',
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

/**
 * 最慢接口 Top5 Mock 数据（新增）
 * 用于展示接口性能排行，帮助开发者定位性能瓶颈
 * avgDuration: 平均响应时间
 * p99Duration: P99 响应时间（99%请求在此时间内完成）
 * callCount: 调用次数
 * errorRate: 错误率
 */
export const mockSlowApiRanking: SlowApiItem[] = [
  {
    id: '1',
    name: '/api/v1/user/profile',
    method: 'GET',
    avgDuration: 3250,
    p99Duration: 5800,
    callCount: 123456,
    errorRate: 2.3,
    rank: 1,
  },
  {
    id: '2',
    name: '/api/v1/order/list',
    method: 'POST',
    avgDuration: 2890,
    p99Duration: 4500,
    callCount: 87654,
    errorRate: 1.5,
    rank: 2,
  },
  {
    id: '3',
    name: '/api/v1/product/search',
    method: 'GET',
    avgDuration: 2100,
    p99Duration: 3200,
    callCount: 234567,
    errorRate: 0.8,
    rank: 3,
  },
  {
    id: '4',
    name: '/api/v1/recommend/items',
    method: 'GET',
    avgDuration: 1560,
    p99Duration: 2800,
    callCount: 156789,
    errorRate: 0.5,
    rank: 4,
  },
  {
    id: '5',
    name: '/api/v1/analytics/report',
    method: 'POST',
    avgDuration: 1230,
    p99Duration: 2100,
    callCount: 45678,
    errorRate: 0.3,
    rank: 5,
  },
];

/**
 * 用户地域分布 Top5 Mock 数据（新增）
 * 用于业务分析，了解用户地域分布情况
 * percentage: 占比百分比
 */
export const mockUserLocationRanking: UserLocationItem[] = [
  { id: '1', name: '广东', value: 8234, unit: '万', percentage: 18.5, rank: 1 },
  { id: '2', name: '北京', value: 6521, unit: '万', percentage: 14.7, rank: 2 },
  { id: '3', name: '上海', value: 5432, unit: '万', percentage: 12.2, rank: 3 },
  { id: '4', name: '浙江', value: 4321, unit: '万', percentage: 9.7, rank: 4 },
  { id: '5', name: '江苏', value: 3987, unit: '万', percentage: 9.0, rank: 5 },
];

/**
 * 页面访问排行 Top5 Mock 数据（新增）
 * 用于展示用户访问最多的页面路径
 */
export const mockPageVisitRanking: RankingItem[] = [
  { id: '1', name: '/home', value: 12340, rank: 1 },
  { id: '2', name: '/products', value: 8921, rank: 2 },
  { id: '3', name: '/product/detail', value: 6543, rank: 3 },
  { id: '4', name: '/cart', value: 4321, rank: 4 },
  { id: '5', name: '/checkout', value: 2341, rank: 5 },
];

/**
 * 平均停留时间指标 Mock 数据（新增）
 * 用于展示用户在页面的平均停留时长
 */
export const mockAvgStayTimeMetric: MetricData = {
  key: 'avg_stay_time',
  label: '平均停留',
  value: 3,
  unit: 'm 42s',
  trend: 8.2,
  trendDirection: 'up',
  compareText: 'vs 昨日',
  sparkline: [85, 92, 88, 95, 105, 110, 115],
  status: 'default',
};

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

/**
 * PV/UV 趋势图 ECharts 配置（新增）
 * 用于展示页面访问量和独立访客的趋势变化
 * 两条折线：PV（蓝色主色）、UV（绿色辅助色）
 */
export const pvUvTrendOption: echarts.EChartsOption = {
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  legend: {
    // 图例配置，展示两条折线含义
    data: ['PV', 'UV'],
    top: 0,
  },
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
      yAxisIndex: 1, // 使用右侧 Y 轴
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
