import { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { LineChart } from '@/components/LineChart';
import { ErrorTable } from '@/components/ErrorTable';
import { ErrorDetailDrawer } from '@/components/ErrorDetailDrawer';
import { Row, Col, Card, Tabs, Space, Select, DatePicker } from 'antd';
import type { ErrorType } from '@/types/log';
import type { LogDetail } from '@/types/log';
import {
  errorSummaryMetrics,
  mockErrorLogs,
  mockErrorDistribution,
  errorTrendOption,
  errorTypeTrendOption,
} from '@/mock/error';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

/**
 * 错误监控页面
 * 包含：
 * 1. 错误统计概览指标卡片（今日错误数、错误率、JS错误、API错误）
 * 2. 错误趋势图（支持按错误类型切换）
 * 3. 错误分布饼图
 * 4. 错误列表表格（支持筛选、排序、详情查看）
 */
export default function ErrorMonitorPage() {
  // 当前选中的错误详情（用于抽屉展示）
  const [selectedError, setSelectedError] = useState<LogDetail | null>(null);
  // 抽屉是否显示
  const [drawerVisible, setDrawerVisible] = useState(false);
  // 当前筛选的错误类型
  const [filterType, setFilterType] = useState<ErrorType | 'all'>('all');
  // 当前 Tab
  const [activeTab, setActiveTab] = useState('overview');

  /**
   * 处理错误行点击事件
   * 打开详情抽屉
   */
  const handleRowClick = (record: LogDetail) => {
    setSelectedError(record);
    setDrawerVisible(true);
  };

  /**
   * 关闭详情抽屉
   */
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedError(null);
  };

  return (
    <MainLayout>
      <div className="page-container">
        {/* ========== 页面标题和筛选器 ========== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h1 style={{ margin: 0 }}>错误监控</h1>
          <Space size="middle">
            {/* 时间范围选择器 */}
            <RangePicker />
            {/* 错误类型快速筛选 */}
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
              options={[
                { label: '全部类型', value: 'all' },
                { label: 'JS 错误', value: 'js' },
                { label: 'API 错误', value: 'api' },
                { label: 'Promise 错误', value: 'promise' },
                { label: 'Resource 错误', value: 'resource' },
              ]}
            />
          </Space>
        </div>

        {/* ========== 错误统计概览指标卡片 ========== */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {errorSummaryMetrics.map((metric) => (
            <Col key={metric.key} span={6}>
              <MetricCard {...metric} metricKey={metric.key} />
            </Col>
          ))}
        </Row>

        {/* ========== Tab 切换：概览 / 趋势分析 / 错误列表 ========== */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
          {/* 概览 Tab：统计卡片 + 错误分布饼图 */}
          <TabPane tab="概览" key="overview">
            <Row gutter={16}>
              {/* 错误类型分布饼图 */}
              <Col span={8}>
                <Card title="错误类型分布">
                  {/* 饼图：展示 JS、API、Promise、Resource 四类错误的占比 */}
                  <div
                    style={{
                      width: '100%',
                      height: 300,
                    }}
                  >
                    <LineChart
                      option={{
                        tooltip: {
                          trigger: 'item',
                          formatter: '{b}: {c}次 ({d}%)',
                        },
                        legend: {
                          orient: 'horizontal',
                          bottom: 0,
                          left: 'center',
                        },
                        series: [
                          {
                            type: 'pie',
                            radius: '60%',
                            center: ['50%', '45%'],
                            avoidLabelOverlap: false,
                            label: {
                              show: true,
                              formatter: '{b}: {d}%',
                            },
                            data: mockErrorDistribution.map((item) => {
                              const colorMap: Record<string, string> = {
                                js: '#ff4d4f',
                                api: '#1890ff',
                                promise: '#faad14',
                                resource: '#52c41a',
                              };
                              const nameMap: Record<string, string> = {
                                js: 'JS',
                                api: 'API',
                                promise: 'Promise',
                                resource: 'Resource',
                              };
                              return {
                                value: item.count,
                                name: nameMap[item.type] || item.type,
                                itemStyle: { color: colorMap[item.type] || '#999' },
                              };
                            }),
                            itemStyle: {
                              borderRadius: 8,
                              borderColor: '#fff',
                              borderWidth: 2,
                            },
                          },
                        ],
                      }}
                      height={260}
                    />
                  </div>
                </Card>
              </Col>

              {/* 错误趋势简图 */}
              <Col span={16}>
                <Card title="错误趋势（24小时）">
                  <LineChart option={errorTrendOption} height={280} />
                </Card>
              </Col>
            </Row>

            {/* 今日告警摘要 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="今日告警摘要">
                  <Row gutter={16}>
                    {/* 严重告警 */}
                    <Col span={6}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 600, color: '#ff4d4f' }}>3</div>
                        <div style={{ fontSize: 12, color: '#666' }}>严重告警</div>
                      </div>
                    </Col>
                    {/* JS 错误 */}
                    <Col span={6}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 600, color: '#faad14' }}>89</div>
                        <div style={{ fontSize: 12, color: '#666' }}>JS 错误</div>
                      </div>
                    </Col>
                    {/* API 错误 */}
                    <Col span={6}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>38</div>
                        <div style={{ fontSize: 12, color: '#666' }}>API 错误</div>
                      </div>
                    </Col>
                    {/* 已恢复 */}
                    <Col span={6}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>98</div>
                        <div style={{ fontSize: 12, color: '#666' }}>已恢复</div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 趋势分析 Tab：多类型错误趋势对比图 */}
          <TabPane tab="趋势分析" key="trend">
            <Row gutter={16}>
              <Col span={24}>
                <Card title="各类型错误趋势对比">
                  <LineChart option={errorTypeTrendOption} height={400} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 错误列表 Tab：完整的错误列表表格 */}
          <TabPane tab="错误列表" key="list">
            <ErrorTable
              data={mockErrorLogs}
              filterType={filterType}
              onFilterChange={setFilterType}
              onRowClick={handleRowClick}
            />
          </TabPane>
        </Tabs>

        {/* ========== 错误详情抽屉 ========== */}
        <ErrorDetailDrawer
          visible={drawerVisible}
          onClose={handleCloseDrawer}
          record={selectedError}
        />
      </div>
    </MainLayout>
  );
}
