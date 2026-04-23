import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { RankingTable } from '@/components/RankingTable';
import { LineChart } from '@/components/LineChart';
import { StatusTag } from '@/components/StatusTag';
import { EmptyState } from '@/components/EmptyState';
import { SlowApiTable } from '@/components/SlowApiTable';
import { UserLocationTable } from '@/components/UserLocationTable';
import { Row, Col, Card, Tabs } from 'antd';
import {
  mockMetrics,
  mockApiHealthMetrics,
  mockErrorRanking,
  mockSlowApiRanking,
  mockUserLocationRanking,
  apiResponseTimeOption,
  errorCountOption,
  pvUvTrendOption,
} from '@/mock/dashboard';

/**
 * 平台首页总览页面
 * 包含：
 * 1. 核心指标卡片行（PV、UV + API成功率、错误率）
 * 2. WebVitals 健康状态行（FCP、LCP、CLS、TTI）
 * 3. 趋势分析 Tab 切换（PV/UV、API响应时间、错误率）
 * 4. 排行表格行（高频错误、最慢接口、用户地域）
 *
 * 布局说明：
 * - 第一行：核心指标卡片（4+2 = 6个卡片）
 * - 第二行：WebVitals 健康状态 + 今日告警统计
 * - 第三行：趋势图表（可切换不同指标）
 * - 第四行：三个排行表格（高频错误、最慢接口、用户地域）
 */
export default function DashboardPage() {
  /**
   * 趋势图 Tab 配置
   * 提供 PV/UV、API响应时间、错误率 三个指标的切换展示
   */
  const trendTabs = [
    {
      key: 'pvuv',
      label: 'PV/UV 趋势',
      option: pvUvTrendOption,
    },
    {
      key: 'api',
      label: 'API 响应时间',
      option: apiResponseTimeOption,
    },
    {
      key: 'error',
      label: '错误率趋势',
      option: errorCountOption,
    },
  ];

  /**
   * WebVitals 健康状态数据
   * 展示核心页面性能指标的健康状态
   */
  const webVitalsData = [
    { name: 'FCP', value: 1023, unit: 'ms', target: 1800, status: 'good' as const },
    { name: 'LCP', value: 2340, unit: 'ms', target: 2500, status: 'warning' as const },
    { name: 'CLS', value: 0.05, unit: '', target: 0.1, status: 'good' as const },
    { name: 'TTI', value: 3210, unit: 'ms', target: 3800, status: 'good' as const },
  ];

  return (
    <MainLayout>
      <div className="page-container">
        {/* ========== 第一行：核心指标卡片（4个占满一行） ========== */}
        <Row gutter={16}>
          {mockMetrics.slice(0, 2).map((metric) => (
            <Col key={metric.key} span={6}>
              <MetricCard {...metric} metricKey={metric.key} />
            </Col>
          ))}
          {mockApiHealthMetrics.map((metric) => (
            <Col key={metric.key} span={6}>
              <MetricCard {...metric} metricKey={metric.key} />
            </Col>
          ))}
        </Row>

        {/* ========== 第二行：WebVitals 健康状态 + 告警统计 ========== */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* WebVitals 健康状态卡片 */}
          <Col span={12}>
            <Card
              title="WebVitals 健康状态"
              extra={
                // 整体健康状态：所有指标都 good 则为 success
                <StatusTag
                  status={
                    webVitalsData.every((v) => v.status === 'good')
                      ? 'success'
                      : webVitalsData.some((v) => v.status === 'warning')
                        ? 'warning'
                        : 'error'
                  }
                  text={webVitalsData.every((v) => v.status === 'good') ? '全部正常' : '部分异常'}
                />
              }
            >
              {/* 四个指标的状态展示：FCP、LCP、CLS、TTI */}
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {webVitalsData.map((vital) => (
                  <div
                    key={vital.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {/* 指标名称 */}
                    <span style={{ fontSize: 12, color: '#666' }}>{vital.name}</span>
                    {/* 指标数值 */}
                    <span style={{ fontSize: 18, fontWeight: 600 }}>
                      {vital.value}
                      {vital.unit}
                    </span>
                    {/* 状态指示：绿色=好、黄色=警告、红色=差 */}
                    <StatusTag
                      status={
                        vital.status === 'good'
                          ? 'success'
                          : vital.status === 'warning'
                            ? 'warning'
                            : 'error'
                      }
                      text=""
                      size="small"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* 今日告警统计卡片 */}
          <Col span={12}>
            <Card title="今日告警统计">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#ff4d4f' }}>3</div>
                    <div style={{ fontSize: 12, color: '#666' }}>异常告警</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#faad14' }}>12</div>
                    <div style={{ fontSize: 12, color: '#666' }}>警告提示</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>98</div>
                    <div style={{ fontSize: 12, color: '#666' }}>已恢复</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* ========== 第三行：趋势图表（Tab 切换） ========== */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card>
              {/* Tab 切换不同指标的趋势图 */}
              <Tabs
                defaultActiveKey="pvuv"
                items={trendTabs.map((tab) => ({
                  key: tab.key,
                  label: tab.label,
                  children: <LineChart option={tab.option} height={300} />,
                }))}
              />
            </Card>
          </Col>
        </Row>

        {/* ========== 第四行：排行表格 ========== */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* 高频错误 Top5 */}
          <Col span={8}>
            <RankingTable title="高频错误 Top5" data={mockErrorRanking} unit="次" />
          </Col>

          {/* 最慢接口 Top5（新增 SlowApiTable 组件） */}
          <Col span={8}>
            <SlowApiTable title="最慢接口 Top5" data={mockSlowApiRanking} />
          </Col>

          {/* 用户地域分布 Top5（新增 UserLocationTable 组件） */}
          <Col span={8}>
            <UserLocationTable title="用户地域 Top5" data={mockUserLocationRanking} />
          </Col>
        </Row>

        {/* ========== 第五行：组件示例（保留原有测试代码） ========== */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* StatusTag 示例 */}
          {/* <Col span={12}>
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
          </Col> */}

          {/* EmptyState 示例 */}
          {/* <Col span={12}>
            <Card title="EmptyState 示例">
              <EmptyState description="暂无错误记录" />
            </Card>
          </Col> */}
        </Row>
      </div>
    </MainLayout>
  );
}
