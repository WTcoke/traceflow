// src/components/ErrorDistributionChart/index.tsx

import React from 'react';
import { Card } from 'antd';
import { LineChart } from '@/components/LineChart';
import type { ErrorDistribution } from '@/types/log';
import * as echarts from 'echarts';

/**
 * 错误分布图表组件 Props
 * 用于展示不同错误类型的占比分布
 */
export interface ErrorDistributionChartProps {
  /** 分布数据 */
  data: ErrorDistribution[];
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 错误分布图表组件
 * 展示不同错误类型的占比，使用饼图展示
 * 颜色映射：JS=红色、API=蓝色、Promise=橙色、Resource=绿色
 */
export const ErrorDistributionChart: React.FC<ErrorDistributionChartProps> = ({ data }) => {
  /**
   * 构建 ECharts 饼图配置
   * 展示各错误类型的数量和占比
   */
  const option: echarts.EChartsOption = {
    // 提示框配置
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)', // 格式：类型: 数量 (百分比)
    },
    // 图例配置
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
    },
    // 饼图系列配置
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'], // 环形饼图，内半径40%，外半径70%
        avoidLabelOverlap: false,
        // 标签配置
        label: {
          show: true,
          formatter: '{b}\n{d}%', // 格式：类型 + 百分比
        },
        // 数据配置
        data: data.map((item) => {
          // 根据错误类型设置颜色
          const colorMap: Record<string, string> = {
            js: '#ff4d4f', // 红色
            api: '#1890ff', // 蓝色
            promise: '#faad14', // 橙色
            resource: '#52c41a', // 绿色
          };
          return {
            value: item.count,
            name: getErrorTypeName(item.type),
            itemStyle: { color: colorMap[item.type] || '#999' },
          };
        }),
        // 饼图样式
        itemStyle: {
          borderRadius: 10, // 圆角
          borderColor: '#fff', // 白色边框
          borderWidth: 2, // 边框宽度
        },
      },
    ],
  };

  return (
    <Card title="错误类型分布">
      <LineChart option={option} height={300} />
    </Card>
  );
};

/**
 * 获取错误类型的中文名称
 */
const getErrorTypeName = (type: string): string => {
  const nameMap: Record<string, string> = {
    js: 'JS 错误',
    api: 'API 错误',
    promise: 'Promise 错误',
    resource: 'Resource 错误',
  };
  return nameMap[type] || type;
};
