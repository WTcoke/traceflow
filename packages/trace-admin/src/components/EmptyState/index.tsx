// src/components/EmptyState/index.tsx

import React from 'react';
import { Empty, Button } from 'antd';

/**
 * 空状态组件 Props
 */
export interface EmptyStateProps {
  /** 描述文字，如"暂无数据"、"暂无错误记录" */
  description?: string;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 重试按钮点击回调 */
  onRetry?: () => void;
}

/**
 * 空状态组件
 * 用于数据为空时展示统一的"暂无内容"插画
 * 用法：<EmptyState description="暂无数据" />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  description = '暂无数据',
  showRetry = false,
  onRetry,
}) => {
  return (
    <Empty
      description={description}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      style={{ padding: '40px 0' }}
    >
      {showRetry && (
        <Button type="primary" onClick={onRetry}>
          重新加载
        </Button>
      )}
    </Empty>
  );
};
