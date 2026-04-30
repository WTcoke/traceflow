import type { LogDetail, ErrorSummary, ErrorDistribution, ErrorTrace } from '@/types/log';
import * as echarts from 'echarts';

/**
 * 错误监控页面 Mock 数据
 * 包含：错误统计概览、错误列表、错误分布、趋势图配置
 */

// ========== 错误统计概览 ==========

/**
 * 错误监控首页统计卡片数据
 * 包含：今日错误数、错误率、JS 错误、API 错误
 * 注意：error/error_rate 等关键词会自动识别为 negative 指标（下降=好）
 */
export const errorSummaryMetrics: ErrorSummary[] = [
  {
    key: 'error_count',
    label: '今日错误数',
    value: 127,
    unit: '次',
    trend: -8,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [140, 132, 128, 135, 130, 128, 127],
    status: 'warning',
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
  {
    key: 'js_error_count',
    label: 'JS 错误',
    value: 89,
    unit: '次',
    trend: -12,
    trendDirection: 'down',
    compareText: '较昨日',
    sparkline: [110, 105, 98, 95, 92, 90, 89],
    status: 'success',
  },
  {
    key: 'api_error_count',
    label: 'API 错误',
    value: 38,
    unit: '次',
    trend: 5,
    trendDirection: 'up',
    compareText: '较昨日',
    sparkline: [30, 32, 35, 33, 36, 37, 38],
    status: 'warning',
  },
];

// ========== 错误列表数据 ==========

/**
 * 错误详情报文列表
 * 包含各类错误的完整信息，用于表格展示和详情查看
 */
export const mockErrorLogs: LogDetail[] = [
  {
    id: 'err_001',
    type: 'js',
    message: "TypeError: Cannot read property 'name' of undefined",
    stack:
      "TypeError: Cannot read property 'name' of undefined\n    at handleUserClick (https://example.com/app.js:152:18)\n    at onClick (https://example.com/app.js:89:5)\n    at React (https://example.com/vendor.js:2341:12)",
    file: 'https://example.com/app.js',
    line: 152,
    column: 18,
    pagePath: '/product/detail',
    userId: 'usr_8x9k2',
    browser: 'Chrome 120.0',
    os: 'Windows 10',
    occurredAt: '2026-04-23T10:23:45Z',
    affectedPv: 1234,
    affectedUsers: 892,
  },
  {
    id: 'err_002',
    type: 'resource',
    message: 'Failed to load resource: net::ERR_CONNECTION_REFUSED',
    stack: undefined,
    file: 'https://example.com/assets/logo.png',
    pagePath: '/home',
    browser: 'Safari 17.0',
    os: 'macOS 14.0',
    occurredAt: '2026-04-23T10:15:30Z',
    affectedPv: 567,
    affectedUsers: 421,
  },
  {
    id: 'err_003',
    type: 'promise',
    message: 'UnhandledPromiseRejection: Request failed with status 500',
    stack:
      'Error: Request failed with status 500\n    at fetchUserData (https://example.com/api.js:45:12)\n    at async Timeline.fetch (https://example.com/app.js:234:8)',
    file: 'https://example.com/api.js',
    line: 45,
    column: 12,
    pagePath: '/user/profile',
    userId: 'usr_3m7n1',
    browser: 'Firefox 121.0',
    os: 'Ubuntu 22.04',
    occurredAt: '2026-04-23T10:08:22Z',
    affectedPv: 234,
    affectedUsers: 198,
  },
  {
    id: 'err_004',
    type: 'api',
    message: 'API 请求失败: 404 Not Found',
    stack: undefined,
    file: 'https://example.com/api/v1/products',
    pagePath: '/search/results',
    browser: 'Chrome 120.0',
    os: 'iOS 17.0',
    occurredAt: '2026-04-23T09:55:18Z',
    affectedPv: 89,
    affectedUsers: 76,
  },
  {
    id: 'err_005',
    type: 'js',
    message: 'SyntaxError: Unexpected token < in JSON at position 0',
    stack:
      'SyntaxError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at parseResponse (https://example.com/utils.js:67:15)',
    file: 'https://example.com/utils.js',
    line: 67,
    column: 15,
    pagePath: '/cart',
    userId: 'usr_5t2w8',
    browser: 'Chrome 119.0',
    os: 'Android 14',
    occurredAt: '2026-04-23T09:42:05Z',
    affectedPv: 456,
    affectedUsers: 389,
  },
  {
    id: 'err_006',
    type: 'resource',
    message: 'Failed to load resource: the server responded with a status of 403',
    stack: undefined,
    file: 'https://example.com/assets/analytics.js',
    pagePath: '/checkout',
    browser: 'Chrome 120.0',
    os: 'Windows 11',
    occurredAt: '2026-04-23T09:30:55Z',
    affectedPv: 123,
    affectedUsers: 110,
  },
  {
    id: 'err_007',
    type: 'promise',
    message: 'UnhandledPromiseRejection: Network request failed',
    stack:
      'Error: Network request failed\n    at XMLHttpRequest.send (https://example.com/xhr.js:23:8)',
    file: 'https://example.com/xhr.js',
    line: 23,
    column: 8,
    pagePath: '/order/list',
    browser: 'Safari 16.0',
    os: 'iOS 16.0',
    occurredAt: '2026-04-23T09:18:40Z',
    affectedPv: 78,
    affectedUsers: 65,
  },
  {
    id: 'err_008',
    type: 'api',
    message: 'API 请求超时',
    stack: undefined,
    file: 'https://example.com/api/v1/recommend',
    pagePath: '/home',
    browser: 'Chrome 120.0',
    os: 'Windows 10',
    occurredAt: '2026-04-23T09:05:12Z',
    affectedPv: 2345,
    affectedUsers: 1823,
  },
];

// ========== 错误分布数据 ==========

/**
 * 错误类型分布数据
 * 用于饼图展示不同错误类型的占比
 */
export const mockErrorDistribution: ErrorDistribution[] = [
  { type: 'js', count: 89, percentage: 52.7 },
  { type: 'api', count: 38, percentage: 22.5 },
  { type: 'promise', count: 28, percentage: 16.6 },
  { type: 'resource', count: 14, percentage: 8.2 },
];

// ========== 错误趋势图配置 ==========

/**
 * 错误数量趋势图 ECharts 配置
 * 展示 24 小时内错误数量的变化趋势
 * 红色折线图，面积图渐变效果
 */
export const errorTrendOption: echarts.EChartsOption = {
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: [
      '00:00',
      '02:00',
      '04:00',
      '06:00',
      '08:00',
      '10:00',
      '12:00',
      '14:00',
      '16:00',
      '18:00',
      '20:00',
      '22:00',
      '24:00',
    ],
  },
  yAxis: { type: 'value', name: '次' },
  series: [
    {
      data: [5, 3, 2, 4, 8, 15, 23, 18, 12, 10, 14, 11, 8],
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
 * 错误类型分布饼图 ECharts 配置
 * 展示 JS、API、Promise、Resource 四类错误的占比
 */
export const errorDistributionOption: echarts.EChartsOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}次 ({d}%)',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'center',
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: '{b}: {d}%',
      },
      data: [
        { value: 89, name: 'JS 错误', itemStyle: { color: '#ff4d4f' } },
        { value: 38, name: 'API 错误', itemStyle: { color: '#1890ff' } },
        { value: 28, name: 'Promise 错误', itemStyle: { color: '#faad14' } },
        { value: 14, name: 'Resource 错误', itemStyle: { color: '#52c41a' } },
      ],
    },
  ],
};

/**
 * 各错误类型趋势图 ECharts 配置
 * 展示不同错误类型的时间趋势变化
 */
export const errorTypeTrendOption: echarts.EChartsOption = {
  grid: { top: 30, right: 20, bottom: 30, left: 50 },
  legend: {
    data: ['JS 错误', 'API 错误', 'Promise 错误', 'Resource 错误'],
    top: 0,
  },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', name: '次' },
  series: [
    {
      name: 'JS 错误',
      data: [2, 1, 5, 12, 10, 8, 6],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#ff4d4f', width: 2 },
    },
    {
      name: 'API 错误',
      data: [1, 1, 3, 5, 4, 3, 2],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#1890ff', width: 2 },
    },
    {
      name: 'Promise 错误',
      data: [1, 0, 2, 4, 3, 2, 2],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#faad14', width: 2 },
    },
    {
      name: 'Resource 错误',
      data: [1, 1, 1, 2, 1, 1, 1],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#52c41a', width: 2 },
    },
  ],
};

// ========== 错误追踪信息 ==========

/**
 * 错误追踪数据
 * 关联同类错误的多次发生，用于"同类错误"聚合展示
 */
export const mockErrorTraces: ErrorTrace[] = [
  {
    id: 'err_001',
    count: 156,
    firstOccurredAt: '2026-04-20T08:00:00Z',
    lastOccurredAt: '2026-04-23T10:23:45Z',
    affectedPv: 12345,
    affectedUsers: 8923,
  },
  {
    id: 'err_002',
    count: 89,
    firstOccurredAt: '2026-04-18T14:30:00Z',
    lastOccurredAt: '2026-04-23T10:15:30Z',
    affectedPv: 5678,
    affectedUsers: 4210,
  },
  {
    id: 'err_003',
    count: 45,
    firstOccurredAt: '2026-04-19T09:00:00Z',
    lastOccurredAt: '2026-04-23T10:08:22Z',
    affectedPv: 2345,
    affectedUsers: 1987,
  },
];
