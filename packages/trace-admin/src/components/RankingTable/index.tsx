// src/components/RankingTable/index.tsx

import React from 'react';
import { Card, Table, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RankingItem } from '@/types/metric';

/**
 * 排行表格组件 Props
 * 用于展示 Top N 排行列表，如高频错误、最慢接口等
 */
export interface RankingTableProps {
  /** 卡片标题，如"高频错误 Top5" */
  title: string;
  /** 排行数据 */
  data: RankingItem[];
  /** 数值单位，如"次"、"ms" */
  unit?: string;
  /** loading 状态 */
  loading?: boolean;
}

/**
 * 根据 value 降序排列
 * 保护性编程：确保数据已正确排序
 */
const sortByValue = (data: RankingItem[]): RankingItem[] => {
  return [...data].sort((a, b) => b.value - a.value);
};

export const RankingTable: React.FC<RankingTableProps> = ({
  title,
  data,
  unit,
  loading = false,
}) => {
  // 排序后的数据
  const sortedData = sortByValue(data);

  // 表格列配置
  const columns: ColumnsType<RankingItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      // 排名用标签展示：1、2、3...
      render: (rank: number) => <span style={{ color: '#999' }}>{rank}</span>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      // 超长省略
      ellipsis: true,
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: 100,
      align: 'right',
      // 数值格式化：千分位 + 单位
      render: (value: number) => (
        <span style={{ fontWeight: 500 }}>
          {value.toLocaleString()}
          {unit && <span style={{ color: '#999', fontSize: 12 }}> {unit}</span>}
        </span>
      ),
    },
  ];

  // Loading 状态
  if (loading) {
    return (
      <Card title={title}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    );
  }

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
