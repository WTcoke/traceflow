import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * 响应式折线图组件
 * 特点：
 * 1. 宽度自动跟随容器（100%）
 * 2. 监听 window resize 自动调整尺寸
 * 3. 组件卸载时清理实例，防止内存泄漏
 */
interface LineChartProps {
  /** ECharts 配置项 */
  option: echarts.EChartsOption;
  /** 图表高度，默认 300px */
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ option, height = 300 }) => {
  // ECharts 实例引用
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 初始化 + 响应式处理
  useEffect(() => {
    if (chartRef.current) {
      // 初始化图表实例
      chartInstance.current = echarts.init(chartRef.current);
      chartInstance.current.setOption(option);
    }

    // 监听窗口 resize，响应式调整图表尺寸
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    // 清理：组件卸载时销毁图表实例，防止内存泄漏
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [option]);

  // div 宽度 100%，高度由 props 控制
  return <div ref={chartRef} style={{ width: '100%', height }} />;
};
