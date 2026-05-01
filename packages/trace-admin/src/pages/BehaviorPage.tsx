import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { RankingTable } from '@/components/RankingTable';
import { LineChart } from '@/components/LineChart';
import { StatusTag } from '@/components/StatusTag';
import {
  Row,
  Col,
  Card,
  Table,
  Tabs,
  Typography,
  Progress,
  Descriptions,
  DatePicker,
  Select,
  Space,
} from 'antd';
import {
  behaviorMetrics,
  behaviorIndicatorMetrics,
  behaviorTrendOption,
  pageVisitRanking,
} from '@/mock/behavior';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 用户行为分析页面
 * 包含：
 * 1. 核心行为指标卡片行（PV、UV、平均停留时长、跳出率）
 * 2. 用户行为指标表格
 * 3. 行为趋势图
 * 4. 页面访问排行表格
 */
export default function BehaviorPage() {
  const getStrokeColor = (passRate: number) => {
    if (passRate >= 80) return '#52c41a';
    if (passRate >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const behaviorColumns = [
    {
      title: '指标名称',
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Text strong>{label}</Text>,
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: any) => (
        <Text strong>
          {value}
          {record.unit}
        </Text>
      ),
    },
    {
      title: '目标值',
      dataIndex: 'target',
      key: 'target',
      render: (target: number, record: any) => (
        <Text>
          {target}
          {record.unit}
        </Text>
      ),
    },
    {
      title: '达标率',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (passRate: number) => (
        <div>
          <Progress percent={passRate} size="small" strokeColor={getStrokeColor(passRate)} />
          <Text className="ml-2">{passRate}%</Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'good' | 'warning' | 'bad') => <StatusTag status={status} />,
    },
  ];

  const timeRangeOptions = [
    { label: '过去24小时', value: '24h' },
    { label: '过去7天', value: '7d' },
    { label: '过去30天', value: '30d' },
  ];

  return (
    <MainLayout>
      <div className="page-container">
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>用户行为分析</Title>
          <Space size="middle">
            <RangePicker />
            <Select defaultValue="24h" style={{ width: 120 }}>
              {timeRangeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          {behaviorMetrics.map((metric) => {
            const { key, ...restMetric } = metric;
            return (
              <Col key={key} xs={24} sm={12} md={8} lg={6}>
                <MetricCard {...restMetric} metricKey={key} />
              </Col>
            );
          })}
        </Row>

        <Tabs defaultActiveKey="overview" className="mb-6">
          <TabPane tab="概览" key="overview">
            <Card title="用户行为指标" className="mb-6">
              <Table
                dataSource={behaviorIndicatorMetrics}
                columns={behaviorColumns}
                rowKey="name"
                pagination={false}
                size="middle"
              />
            </Card>

            <Card title="访问趋势" extra={<Text>过去24小时</Text>} className="mb-6">
              <LineChart option={behaviorTrendOption} height={400} />
            </Card>

            <Card title="页面访问排行">
              <RankingTable title="" data={pageVisitRanking} unit="次" />
            </Card>
          </TabPane>

          <TabPane tab="详细分析" key="detail">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="行为指标详情">
                  <Descriptions bordered column={2}>
                    {behaviorIndicatorMetrics.map((metric) => (
                      <Descriptions.Item
                        key={metric.name}
                        label={<Text strong>{metric.label}</Text>}
                      >
                        <Space direction="vertical">
                          <Text strong>
                            {metric.value}
                            {metric.unit}
                          </Text>
                          <Text>
                            目标值: {metric.target}
                            {metric.unit}
                          </Text>
                          <Text>达标率: {metric.passRate}%</Text>
                          <StatusTag status={metric.status} />
                        </Space>
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="优化建议" key="suggestions">
            <Card title="行为优化建议">
              <div className="space-y-4">
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>页面优化</Text>
                  <p className="mt-2">优化页面加载速度，减少首屏渲染时间，提升用户体验。</p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>内容优化</Text>
                  <p className="mt-2">提供有价值的内容，增加用户停留时间，降低跳出率。</p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>导航优化</Text>
                  <p className="mt-2">优化网站导航结构，帮助用户快速找到所需内容。</p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>交互优化</Text>
                  <p className="mt-2">增加互动元素，提升用户参与度和粘性。</p>
                </div>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </MainLayout>
  );
}
