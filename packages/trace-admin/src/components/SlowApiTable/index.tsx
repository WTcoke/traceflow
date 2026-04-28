// src/components/SlowApiTable/index.tsx

import React from 'react';
import { Card, Table, Tag, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SlowApiItem } from '@/types/metric';

/**
 * 最慢接口表格组件 Props
 * 用于展示接口性能排行，帮助开发者定位性能瓶颈
 * 比普通 RankingTable 提供更丰富的信息：HTTP方法、平均耗时、P99、调用次数、错误率
 */
export interface SlowApiTableProps {
  /** 卡片标题，如"最慢接口 Top5" */
  title: string;
  /** 接口数据 */
  data: SlowApiItem[];
  /** loading 状态 */
  loading?: boolean;
}

/**
 * HTTP 方法颜色映射
 * GET=蓝色、POST=绿色、PUT=橙色、DELETE=红色
 */
const methodColors: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
};

/**
 * 格式化耗时数值
 * 大于1000ms显示为"X.Xs"，否则显示"XXXms"
 */
const formatDuration = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms}ms`;
};

export const SlowApiTable: React.FC<SlowApiTableProps> = ({ title, data, loading = false }) => {
  /**
   * 根据 avgDuration 降序排列
   * 保护性编程：确保数据已正确排序
   */
  const sortedData = [...data].sort((a, b) => b.avgDuration - a.avgDuration);

  /**
   * 表格列配置
   * 展示：排名、接口名称、方法、平均耗时、P99耗时、调用次数、错误率
   */
  const columns: ColumnsType<SlowApiItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      // 排名用数字展示
      render: (rank: number) => <span style={{ color: '#999' }}>{rank}</span>,
    },
    {
      title: '接口',
      dataIndex: 'name',
      key: 'name',
      // 超长名称省略
      ellipsis: true,
      // 接口名称样式
      render: (name: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{name}</span>
      ),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 70,
      // HTTP 方法用 Tag 展示，颜色映射
      render: (method: string) => <Tag color={methodColors[method] || 'default'}>{method}</Tag>,
    },
    {
      title: '平均耗时',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      width: 90,
      align: 'right',
      // 耗时格式化：ms 或 s
      render: (ms: number) => <span style={{ fontWeight: 500 }}>{formatDuration(ms)}</span>,
    },
    {
      title: 'P99耗时',
      dataIndex: 'p99Duration',
      key: 'p99Duration',
      width: 90,
      align: 'right',
      // P99 耗时格式化
      render: (ms: number) => (
        <span style={{ color: '#666', fontSize: 12 }}>{formatDuration(ms)}</span>
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'callCount',
      key: 'callCount',
      width: 90,
      align: 'right',
      // 调用次数千分位格式化
      render: (count: number) => <span style={{ color: '#666' }}>{count.toLocaleString()}</span>,
    },
    {
      title: '错误率',
      dataIndex: 'errorRate',
      key: 'errorRate',
      width: 70,
      align: 'right',
      // 错误率用颜色区分：绿色<1%、黄色1-3%、红色>3%
      render: (rate: number) => {
        const color = rate < 1 ? '#52c41a' : rate < 3 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 500 }}>{rate}%</span>;
      },
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

  // 渲染最慢接口表格
  return (
    <Card title={title} extra={<span style={{ fontSize: 12, color: '#999' }}>按平均耗时降序</span>}>
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
