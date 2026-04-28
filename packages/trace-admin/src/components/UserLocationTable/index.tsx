// src/components/UserLocationTable/index.tsx

import React from 'react';
import { Card, Table, Progress, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UserLocationItem } from '@/types/metric';

/**
 * 用户地域分布表格组件 Props
 * 用于展示用户地域分布排行，帮助业务分析用户构成
 * 比普通 RankingTable 提供更丰富的信息：占比进度条、数值和百分比
 */
export interface UserLocationTableProps {
  /** 卡片标题，如"用户地域分布 Top5" */
  title: string;
  /** 地域数据 */
  data: UserLocationItem[];
  /** loading 状态 */
  loading?: boolean;
}

export const UserLocationTable: React.FC<UserLocationTableProps> = ({
  title,
  data,
  loading = false,
}) => {
  /**
   * 根据 value 降序排列
   * 保护性编程：确保数据已正确排序
   */
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  /**
   * 表格列配置
   * 展示：排名、地域名称、用户数、占比进度条
   */
  const columns: ColumnsType<UserLocationItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      // 排名用数字展示
      render: (rank: number) => <span style={{ color: '#999' }}>{rank}</span>,
    },
    {
      title: '地域',
      dataIndex: 'name',
      key: 'name',
      // 地域名称展示
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: '用户数',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      align: 'right',
      // 用户数格式化：千分位 + 单位
      render: (value: number, record: UserLocationItem) => (
        <span style={{ fontWeight: 500 }}>
          {value.toLocaleString()}
          {record.unit && <span style={{ color: '#999', fontSize: 12 }}>{record.unit}</span>}
        </span>
      ),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 180,
      // 占比用进度条展示，更直观
      render: (percentage: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 进度条：按占比宽度，顶部省份用主题色，其他用灰色 */}
          <Progress
            percent={percentage}
            size="small"
            showInfo={false}
            strokeColor="#1890ff"
            trailColor="#f0f0f0"
            style={{ flex: 1, marginBottom: 0 }}
          />
          {/* 百分比数字 */}
          <span style={{ color: '#666', fontSize: 12, minWidth: 40 }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      ),
    },
  ];

  // Loading 状态：显示骨架屏
  if (loading) {
    return (
      <Card title={title}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    );
  }

  // 渲染用户地域分布表格
  return (
    <Card title={title}>
      <Table
        columns={columns}
        dataSource={sortedData}
        rowKey="id"
        pagination={false} // 不分页，默认展示全部
        size="small"
      />
    </Card>
  );
};
