import React from 'react';
import { Card, Empty, Button, Spin } from 'antd';

/**
 * 图表容器组件 Props
 * 提供统一的图表卡片外壳，处理 loading / empty / error / success 四种状态
 */
export interface ChartContainerProps {
  /** 卡片标题 */
  title: string;
  /** 副标题，如"单位：ms" */
  subTitle?: string;
  /** loading 状态：显示骨架屏 */
  loading?: boolean;
  /** 空数据状态：显示空状态插画 */
  empty?: boolean;
  /** 错误状态：显示错误信息 */
  error?: string;
  /** 图表内容 */
  children: React.ReactNode;
  /** 图表区域高度，默认 300px */
  height?: number;
}

/**
 * 图表容器组件
 * 功能：
 * 1. 四种状态切换：loading / empty / error / success
 * 2. 统一卡片样式，标题 + 副标题
 * 3. 响应式图表区域高度
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subTitle,
  loading = false,
  empty = false,
  error,
  children,
  height = 300,
}) => {
  // ========== 状态渲染 ==========

  // Loading 状态：骨架屏占位
  if (loading) {
    return (
      <Card title={title}>
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin tip="加载中..." />
        </div>
      </Card>
    );
  }

  // Error 状态：错误信息 + 重试提示
  if (error) {
    return (
      <Card title={title}>
        <div
          style={{
            height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: '#ff4d4f' }}>{error}</span>
          <span style={{ color: '#999', fontSize: 12 }}>请检查数据源或稍后重试</span>
        </div>
      </Card>
    );
  }

  // Empty 状态：空状态插画
  if (empty) {
    return (
      <Card title={title}>
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="暂无数据" />
        </div>
      </Card>
    );
  }

  // Success 状态：正常渲染图表内容
  return (
    <Card
      title={
        <span>
          {title}
          {subTitle && (
            <span style={{ fontSize: 12, color: '#999', fontWeight: 400, marginLeft: 8 }}>
              {subTitle}
            </span>
          )}
        </span>
      }
    >
      {/* 图表内容区：高度固定，响应式宽度 */}
      <div style={{ height, width: '100%' }}>{children}</div>
    </Card>
  );
};
