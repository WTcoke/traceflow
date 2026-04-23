import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { ChartContainer } from '@/components/ChartContainer';
import { RankingTable } from '@/components/RankingTable';
import { LineChart } from '@/components/LineChart';
import { StatusTag } from '@/components/StatusTag';
import { EmptyState } from '@/components/EmptyState';
import { Row, Col, Card } from 'antd';
import {
  mockMetrics,
  mockErrorRanking,
  apiResponseTimeOption,
  errorCountOption,
} from '@/mock/dashboard';

/**
 * 平台首页总览页面
 * 包含：
 * 1. 核心指标卡片行（PV、UV、错误数、LCP）
 * 2. API 响应时间趋势图
 * 3. 错误数量趋势图
 * 4. 高频错误 Top5 排行表格
 */
export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="page-container">
        {/* ========== 指标卡片行 ========== */}
        <Row gutter={16}>
          {mockMetrics.map((metric) => (
            <Col key={metric.key} span={6}>
              {/* metricKey 用于自动推断趋势颜色语义（positive/negative） */}
              <MetricCard {...metric} metricKey={metric.key} />
            </Col>
          ))}
        </Row>

        {/* ========== 图表 + 排行行 ========== */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* API 响应时间趋势图 */}
          <Col span={12}>
            <ChartContainer title="API 响应时间趋势" subTitle="单位:ms">
              <LineChart option={apiResponseTimeOption} height={300} />
            </ChartContainer>
          </Col>

          {/* 错误数量趋势图 */}
          <Col span={12}>
            <ChartContainer title="错误数量趋势" subTitle="单位:次">
              <LineChart option={errorCountOption} height={300} />
            </ChartContainer>
          </Col>
        </Row>

        {/* ========== 排行表格行 ========== */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <RankingTable title="高频错误 Top5" data={mockErrorRanking} unit="次" />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* StatusTag 测试 */}
          <Col span={12}>
            <Card title="StatusTag 示例">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatusTag status="success" text="正常" />
                <StatusTag status="warning" text="警告" />
                <StatusTag status="error" text="异常" />
                <StatusTag status="default" text="未知" />
                <StatusTag status="good" />
                <StatusTag status="bad" />
              </div>
            </Card>
          </Col>

          {/* EmptyState 测试 */}
          <Col span={12}>
            <Card title="EmptyState 示例">
              <EmptyState description="暂无错误记录" />
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
