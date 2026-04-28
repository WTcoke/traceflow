import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { MetricCard } from '@/components/MetricCard';
import { ChartContainer } from '@/components/ChartContainer';
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
  Statistic,
  Descriptions,
  DatePicker,
  Select,
  Space,
  Tooltip,
} from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  performanceMetrics,
  webVitalsMetrics,
  performanceTrendOption,
  slowPagesRanking,
} from '@/mock/performance';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 性能分析页面
 * 包含：
 * 1. 核心性能指标卡片行（FCP、LCP、CLS、TTI）
 * 2. Web Vitals 指标表格
 * 3. 性能趋势图
 * 4. 慢页面排行表格
 */
export default function PerformancePage() {
  // Web Vitals 表格列配置
  const getStrokeColor = (passRate: number) => {
    if (passRate >= 80) return '#52c41a'; // 绿色
    if (passRate >= 60) return '#faad14'; // 黄色
    return '#ff4d4f'; // 红色
  };
  const webVitalsColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => {
        const nameMap: Record<string, string> = {
          FP: '首次绘制(FP)',
          FCP: '首次内容绘制(FCP)',
          LCP: '最大内容绘制(LCP)',
          CLS: '累积布局偏移(CLS)',
          TTI: '可交互时间(TTI)',
        };
        return nameMap[name] || name;
      },
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

  // 时间范围选项
  const timeRangeOptions = [
    { label: '过去24小时', value: '24h' },
    { label: '过去7天', value: '7d' },
    { label: '过去30天', value: '30d' },
  ];

  return (
    <MainLayout>
      <div className="page-container">
        {/* 页面标题和筛选器 */}
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>性能分析</Title>
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

        {/* ========== 核心性能指标卡片行 ========== */}
        <Row gutter={[16, 16]} className="mb-6">
          {performanceMetrics.map((metric) => {
            const { key, ...restMetric } = metric;
            return (
              <Col key={key} xs={24} sm={12} md={8} lg={6}>
                <MetricCard {...restMetric} metricKey={key} />
              </Col>
            );
          })}
        </Row>

        {/* ========== 主要内容区域 ========== */}
        <Tabs defaultActiveKey="overview" className="mb-6">
          <TabPane tab="概览" key="overview">
            {/* Web Vitals 指标表格 */}
            <Card title="Web Vitals 指标" className="mb-6">
              <Table
                dataSource={webVitalsMetrics}
                columns={webVitalsColumns}
                rowKey="name"
                pagination={false}
                size="middle"
              />
            </Card>

            {/* 性能趋势图 */}
            <Card title="性能趋势" extra={<Text>过去24小时</Text>} className="mb-6">
              <LineChart option={performanceTrendOption} height={400} />
            </Card>

            {/* 慢页面排行 */}
            <Card title="慢页面排行">
              <RankingTable title="" data={slowPagesRanking} unit="ms" />
            </Card>
          </TabPane>

          <TabPane tab="详细分析" key="detail">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="性能指标详情">
                  <Descriptions bordered column={2}>
                    {webVitalsMetrics.map((metric) => (
                      <Descriptions.Item
                        key={metric.name}
                        label={
                          <Text strong>
                            {metric.name === 'FP'
                              ? '首次绘制(FP)'
                              : metric.name === 'FCP'
                                ? '首次内容绘制(FCP)'
                                : metric.name === 'LCP'
                                  ? '最大内容绘制(LCP)'
                                  : metric.name === 'CLS'
                                    ? '累积布局偏移(CLS)'
                                    : '可交互时间(TTI)'}
                          </Text>
                        }
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
            <Card title="性能优化建议">
              <div className="space-y-4">
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>图片优化</Text>
                  <p className="mt-2">使用适当尺寸的图片，压缩图片大小，考虑使用 WebP 格式。</p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>代码分割</Text>
                  <p className="mt-2">使用动态导入实现代码分割，减少初始加载时间。</p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>缓存策略</Text>
                  <p className="mt-2">合理设置缓存策略，减少重复请求。</p>
                </div>
                <div className="p-4 border rounded bg-blue-50">
                  <Text strong>资源预加载</Text>
                  <p className="mt-2">对关键资源使用 preload 和 prefetch 提升加载速度。</p>
                </div>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </MainLayout>
  );
}
