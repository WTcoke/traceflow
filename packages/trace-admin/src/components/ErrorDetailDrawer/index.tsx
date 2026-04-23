// src/components/ErrorDetailDrawer/index.tsx

import React from 'react';
import { Drawer, Descriptions, Tag, Card, Space, Typography, Button } from 'antd';
import type { LogDetail, ErrorType } from '@/types/log';
import { StatusTag } from '@/components/StatusTag';

const { Text, Title } = Typography;

/**
 * 错误详情抽屉组件 Props
 * 用于展示单条错误的完整信息
 */
export interface ErrorDetailDrawerProps {
  /** 是否显示抽屉 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 错误详情数据 */
  record: LogDetail | null;
}

/**
 * 错误类型标签颜色映射（与 ErrorTable 保持一致）
 */
const errorTypeColors: Record<ErrorType, string> = {
  js: 'red',
  api: 'blue',
  promise: 'orange',
  resource: 'green',
};

/**
 * 错误类型中文名称映射（与 ErrorTable 保持一致）
 */
const errorTypeLabels: Record<ErrorType, string> = {
  js: 'JS 错误',
  api: 'API 错误',
  promise: 'Promise 错误',
  resource: 'Resource 错误',
};

/**
 * 格式化时间戳为友好格式
 * 例如：2026-04-23T10:23:45Z → 2026-04-23 10:23:45
 */
const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 计算错误严重程度状态
 * 基于影响用户数判断：>500=error，>100=warning，<=100=success
 */
const getSeverityStatus = (affectedUsers: number): 'error' | 'warning' | 'success' => {
  if (affectedUsers > 500) return 'error';
  if (affectedUsers > 100) return 'warning';
  return 'success';
};

/**
 * 错误详情抽屉组件
 * 展示错误的完整上下文信息，包括：
 * - 基本信息（类型、消息、时间）
 * - 位置信息（文件、行号、列号）
 * - 环境信息（浏览器、操作系统、页面路径）
 * - 影响范围（PV、用户数）
 * - 完整堆栈信息（如果有）
 */
export const ErrorDetailDrawer: React.FC<ErrorDetailDrawerProps> = ({
  visible,
  onClose,
  record,
}) => {
  if (!record) return null;

  // 影响用户数的严重程度状态
  const severityStatus = getSeverityStatus(record.affectedUsers);

  return (
    <Drawer
      title="错误详情"
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      extra={
        // 复制堆栈信息按钮
        record.stack && (
          <Button
            onClick={() => {
              navigator.clipboard.writeText(record.stack || '');
            }}
          >
            复制堆栈
          </Button>
        )
      }
    >
      {/* ========== 基本信息区块 ========== */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="错误类型">
            <Tag color={errorTypeColors[record.type]}>{errorTypeLabels[record.type]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="严重程度">
            <StatusTag status={severityStatus} />
          </Descriptions.Item>
          <Descriptions.Item label="发生时间" span={2}>
            {formatDateTime(record.occurredAt)}
          </Descriptions.Item>
          <Descriptions.Item label="错误信息" span={2}>
            <Text code style={{ fontSize: 12 }}>
              {record.message}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ========== 位置信息区块 ========== */}
      {record.file && (
        <Card size="small" title="位置信息" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="文件">
              <Text
                copyable={{ text: record.file }}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              >
                {record.file}
              </Text>
            </Descriptions.Item>
            {record.line !== undefined && (
              <Descriptions.Item label="行号">
                <Text strong style={{ color: '#ff4d4f' }}>
                  {record.line}
                </Text>
              </Descriptions.Item>
            )}
            {record.column !== undefined && (
              <Descriptions.Item label="列号">
                <Text type="secondary">{record.column}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* ========== 环境信息区块 ========== */}
      <Card size="small" title="环境信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="页面路径">
            <Text code>{record.pagePath}</Text>
          </Descriptions.Item>
          {record.browser && <Descriptions.Item label="浏览器">{record.browser}</Descriptions.Item>}
          {record.os && <Descriptions.Item label="操作系统">{record.os}</Descriptions.Item>}
          {record.userId && (
            <Descriptions.Item label="用户 ID">
              <Text type="secondary">{record.userId}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* ========== 影响范围区块 ========== */}
      <Card size="small" title="影响范围" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="影响 PV">
            <Text strong style={{ color: '#1890ff' }}>
              {record.affectedPv.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="影响用户">
            <Text strong style={{ color: severityStatus === 'error' ? '#ff4d4f' : '#52c41a' }}>
              {record.affectedUsers.toLocaleString()}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ========== 堆栈信息区块 ========== */}
      {record.stack && (
        <>
          {/* 分隔线 + 标题，与 Ant Design Divider orientation="left" 效果一致 */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
            <span
              style={{ flex: 'none', paddingRight: 12, color: 'rgba(0,0,0,0.88)', fontWeight: 500 }}
            >
              完整堆栈
            </span>
            <span style={{ flex: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)' }} />
          </div>
          <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
            <pre
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
              }}
            >
              {record.stack}
            </pre>
          </Card>
        </>
      )}
    </Drawer>
  );
};
