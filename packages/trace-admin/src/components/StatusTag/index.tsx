// src/components/StatusTag/index.tsx

import React from 'react';
import { Tag } from 'antd';

/**
 * 状态标签组件 Props
 */
export interface StatusTagProps {
  /** 状态类型：good/success=绿、warning=黄、bad/error=红、default=蓝 */
  status: 'good' | 'warning' | 'bad' | 'success' | 'error' | 'default';
  /** 显示文字，默认根据 status 自动生成 */
  text?: string;
  /** 标签尺寸：small=小号、default=默认 */
  size?: 'small' | 'default';
}

/**
 * 状态标签到颜色的映射
 */
const statusColorMap = {
  good: 'success', // 绿色
  success: 'success', // 绿色
  warning: 'warning', // 黄色
  bad: 'error', // 红色
  error: 'error', // 红色
  default: 'default', // 蓝色
};

/**
 * 默认文字映射（当 text 未传入时使用）
 */
const defaultTextMap = {
  good: '正常',
  success: '正常',
  warning: '警告',
  bad: '异常',
  error: '异常',
  default: '未知',
};

/**
 * 状态标签组件
 * 用于展示数据的状态：正常/警告/异常
 * 用法：<StatusTag status="warning" /> → 黄色"警告"标签
 */
export const StatusTag: React.FC<StatusTagProps> = ({ status, text, size = 'default' }) => {
  // antd Tag 的 color 类型
  const color = statusColorMap[status] as 'success' | 'warning' | 'error' | 'default';
  const displayText = text ?? defaultTextMap[status];

  return (
    <Tag color={color} style={{ fontSize: size === 'small' ? 12 : 14 }}>
      {displayText}
    </Tag>
  );
};
