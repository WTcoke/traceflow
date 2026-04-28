import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { log } from 'echarts/types/src/util/log.js';

/**
 * 指标卡片组件 Props
 * 用于展示单个业务指标，支持趋势显示、迷你图和自动语义判断
 */
export interface MetricCardProps {
  /** 指标名称，如"页面访问量(PV)" */
  label: string;
  /** 指标数值，如 48293 */
  value: number;
  /** 单位，如"万"、"ms" */
  unit?: string;
  /** 环比变化率，如 12 表示 12% */
  trend?: number;
  /** 趋势方向：up=上升、down=下降、flat=持平 */
  trendDirection?: 'up' | 'down' | 'flat';
  /** 状态色：success=绿、warning=黄、error=红、default=蓝 */
  status?: 'success' | 'warning' | 'error' | 'default';
  /** 迷你图数据，用于 ECharts 面积图展示趋势 */
  sparkline?: number[];
  /** 对比文案，如"较昨日" */
  compareText?: string;
  /** loading 状态 */
  loading?: boolean;
  /** 手动指定正负语义：positive=上升好、negative=下降好，默认自动推断 */
  valueType?: 'positive' | 'negative';
  /** 指标 key，用于自动推断 valueType（如 lcp、error 会自动识别为 negative） */
  metricKey?: string;
}

// 状态色映射表
const statusColors = {
  success: '#52c41a', // 绿色
  warning: '#faad14', // 黄色
  error: '#ff4d4f', // 红色
  default: '#1890ff', // 蓝色
};

/**
 * 根据趋势方向和指标语义计算颜色
 * - positive 指标：上升=绿色（好事）、下降=红色（坏事）
 * - negative 指标：上升=红色（坏事）、下降=绿色（好事）
 */
const getTrendColor = (direction: 'up' | 'down' | 'flat', valueType: 'positive' | 'negative') => {
  if (direction === 'flat') return '#999'; // 灰色
  if (valueType === 'positive') {
    return direction === 'up' ? '#52c41a' : '#ff4d4f';
  } else {
    return direction === 'up' ? '#ff4d4f' : '#52c41a';
  }
};

/**
 * 趋势图标组件
 * 根据方向显示上/下/平箭头，颜色由外部传入
 */
const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'flat'; color: string }> = ({
  direction,
  color,
}) => {
  if (direction === 'up') return <ArrowUpOutlined style={{ color }} />;
  if (direction === 'down') return <ArrowDownOutlined style={{ color }} />;
  return <MinusOutlined style={{ color: '#999' }} />;
};

/**
 * 负面指标关键词列表
 * 包含这些关键词的指标，数值下降=好事（绿色），上升=坏事（红色）
 * 如：error（错误数）、lcp（加载时间）越低越好
 */
const negativeKeywords = ['error', 'fail', 'exception', 'lcp', 'cls', 'fcp', 'tti', 'duration'];

/**
 * 根据 metricKey 自动推断 valueType
 * 包含负面关键词 → negative（下降=好）
 * 其他默认 → positive（上升=好）
 */
const inferValueType = (key: string): 'positive' | 'negative' => {
  return negativeKeywords.some((k) => key.toLowerCase().includes(k)) ? 'negative' : 'positive';
};

// 指标卡片组件
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  trendDirection,
  status = 'default',
  sparkline,
  compareText,
  loading = false,
  valueType,
  metricKey,
}) => {
  // 自动推断 valueType，外部传入 valueType 优先
  const resolvedValueType = valueType ?? inferValueType(metricKey || '');
  console.log(resolvedValueType);

  // ECharts 图表实例
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化 ECharts 迷你面积图
  useEffect(() => {
    if (!chartRef.current || !sparkline || sparkline.length === 0) return;

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);
    // 迷你图颜色跟随 status 状态色
    const color = statusColors[status];

    // 配置迷你折线图
    chartInstance.current.setOption({
      grid: { top: 0, right: 0, bottom: 0, left: 0 }, // 紧凑布局，无边距
      xAxis: { show: false, type: 'category', data: sparkline.map((_, i) => i) },
      yAxis: { show: false, type: 'value' },
      series: [
        {
          type: 'line',
          data: sparkline,
          smooth: true, // 平滑曲线
          symbol: 'none', // 不显示数据点
          lineStyle: { color, width: 2 },
          // 面积图渐变：顶部深色 → 底部透明
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' }, // 40% 透明度
              { offset: 1, color: color + '00' }, // 0% 透明度
            ]),
          },
        },
      ],
    });

    // 响应窗口 resize 事件
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    // 清理：组件卸载时销毁图表实例，防止内存泄漏
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [sparkline, status]);

  // 计算趋势颜色
  const trendColor = trendDirection ? getTrendColor(trendDirection, resolvedValueType) : '#999';

  // Loading 状态：显示骨架屏
  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  // 渲染指标卡片
  return (
    <Card style={{ height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 指标名称：如"页面访问量(PV)" */}
        <div style={{ fontSize: 14, color: '#666', fontWeight: 400 }}>{label}</div>

        {/* 数值 + 趋势方向（上下排列） */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {/* 数值：48293 万 */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 600, color: '#333' }}>
              {value.toLocaleString()}
            </span>
            {unit && <span style={{ fontSize: 14, color: '#999' }}>{unit}</span>}
          </div>

          {/* 趋势：箭头 + 百分比，如 ↑ +12% */}
          {trend !== undefined && trendDirection && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendIcon direction={trendDirection} color={trendColor} />
              <span style={{ fontSize: 12, color: trendColor }}>
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
            </div>
          )}
        </div>

        {/* 底部：对比文案 + 迷你趋势图 */}
        {(compareText || sparkline) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* 对比文案：如"较昨日" */}
            {compareText && <span style={{ fontSize: 12, color: '#999' }}>{compareText}</span>}
            {/* ECharts 迷你图 */}
            {sparkline && sparkline.length > 0 && (
              <div ref={chartRef} style={{ width: 100, height: 30, flexShrink: 0 }} />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
