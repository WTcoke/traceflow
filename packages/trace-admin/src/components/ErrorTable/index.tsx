// src/components/ErrorTable/index.tsx

import React, { useState } from 'react';
import { Table, Tag, Space, Button, Tooltip, Card, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { LogDetail, ErrorType } from '@/types/log';
import { StatusTag } from '@/components/StatusTag';

/**
 * 错误列表表格组件 Props
 * 用于展示错误日志列表，支持筛选、排序、详情查看
 */
export interface ErrorTableProps {
  /** 错误列表数据 */
  data: LogDetail[];
  /** 是否加载中 */
  loading?: boolean;
  /** 行选中回调 */
  onRowClick?: (record: LogDetail) => void;
  /** 当前筛选的错误类型 */
  filterType?: ErrorType | 'all';
  /** 错误类型变更回调 */
  onFilterChange?: (type: ErrorType | 'all') => void;
}

/**
 * 错误类型标签颜色映射
 * - js: 红色（JavaScript 运行时错误，通常较严重）
 * - api: 蓝色（API 请求错误）
 * - promise: 橙色（Promise 异步错误）
 * - resource: 绿色（资源加载错误）
 */
const errorTypeColors: Record<ErrorType, string> = {
  js: 'red',
  api: 'blue',
  promise: 'orange',
  resource: 'green',
};

/**
 * 错误类型中文名称映射
 */
const errorTypeLabels: Record<ErrorType, string> = {
  js: 'JS 错误',
  api: 'API 错误',
  promise: 'Promise 错误',
  resource: 'Resource 错误',
};

/**
 * 格式化时间字符串为友好格式
 * 例如：2026-04-23T10:23:45Z → 10:23:45
 */
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 格式化日期字符串为友好格式
 * 例如：2026-04-23T10:23:45Z → 2026-04-23
 */
const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

/**
 * 计算错误严重程度
 * 基于影响用户数判断：>500=error，>100=warning，<=100=success
 */
const getSeverityStatus = (affectedUsers: number): 'error' | 'warning' | 'success' => {
  if (affectedUsers > 500) return 'error';
  if (affectedUsers > 100) return 'warning';
  return 'success';
};

/**
 * 错误列表表格组件
 * 展示错误日志列表，支持：
 * - 按错误类型筛选
 * - 按时间排序
 * - 点击查看详情
 * - 影响范围展示
 */
export const ErrorTable: React.FC<ErrorTableProps> = ({
  data,
  loading = false,
  onRowClick,
  filterType = 'all',
  onFilterChange,
}) => {
  // 分页配置
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  /**
   * 表格列配置
   * 展示：错误类型、错误信息、页面路径、时间、影响范围
   */
  const columns: ColumnsType<LogDetail> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      // 错误类型用 Tag 展示，颜色映射
      render: (type: ErrorType) => <Tag color={errorTypeColors[type]}>{errorTypeLabels[type]}</Tag>,
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      // 超长省略，鼠标悬停显示完整信息
      ellipsis: true,
      render: (message: string) => (
        <Tooltip title={message} placement="topLeft">
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{message}</span>
        </Tooltip>
      ),
    },
    {
      title: '页面',
      dataIndex: 'pagePath',
      key: 'pagePath',
      width: 120,
      // 页面路径展示
      render: (path: string) => <span style={{ color: '#666' }}>{path}</span>,
    },
    {
      title: '时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 100,
      sorter: (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      defaultSortOrder: 'descend',
      // 展示日期 + 时间
      render: (time: string) => (
        <Space direction="vertical" size={0}>
          <span>{formatDate(time)}</span>
          <span style={{ color: '#999', fontSize: 11 }}>{formatTime(time)}</span>
        </Space>
      ),
    },
    {
      title: '影响 PV',
      dataIndex: 'affectedPv',
      key: 'affectedPv',
      width: 90,
      align: 'right',
      sorter: (a, b) => a.affectedPv - b.affectedPv,
      // 影响 PV 格式化：千分位
      render: (pv: number) => (
        <Tooltip title={`影响 ${pv.toLocaleString()} 次页面浏览`}>
          <span>{pv.toLocaleString()}</span>
        </Tooltip>
      ),
    },
    {
      title: '影响用户',
      dataIndex: 'affectedUsers',
      key: 'affectedUsers',
      width: 90,
      align: 'right',
      sorter: (a, b) => a.affectedUsers - b.affectedUsers,
      // 根据影响用户数显示严重程度颜色
      render: (users: number) => {
        const status = getSeverityStatus(users);
        return (
          <Tooltip title={`影响 ${users.toLocaleString()} 个用户`}>
            <StatusTag status={status} text={users.toLocaleString()} size="small" />
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      // 查看详情按钮
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => onRowClick?.(record)}>
          详情
        </Button>
      ),
    },
  ];

  // 计算当前页数据
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card title="错误列表">
      {/* 筛选器：按错误类型筛选 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Select
          value={filterType}
          onChange={onFilterChange}
          style={{ width: 120 }}
          options={[
            { label: '全部', value: 'all' },
            { label: 'JS 错误', value: 'js' },
            { label: 'API 错误', value: 'api' },
            { label: 'Promise 错误', value: 'promise' },
            { label: 'Resource 错误', value: 'resource' },
          ]}
        />
      </div>

      {/* 错误列表表格 */}
      <Table
        columns={columns}
        dataSource={filterType === 'all' ? data : data.filter((item) => item.type === filterType)}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total: data.length,
          onChange: setCurrentPage,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
        }}
        size="middle"
        onRow={(record) => ({
          onClick: () => onRowClick?.(record),
          style: { cursor: 'pointer' },
        })}
      />
    </Card>
  );
};
