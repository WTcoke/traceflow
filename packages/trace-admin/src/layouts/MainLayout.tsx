import React, { useState } from 'react';
import { Layout, Menu, Drawer } from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;

// 主布局 Props
interface MainLayoutProps {
  /** 页面内容区 */
  children: React.ReactNode;
}

// 侧边栏菜单配置
const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '平台总览' },
  { key: '/performance', icon: <ThunderboltOutlined />, label: '性能分析' },
  { key: '/behavior', icon: <UserOutlined />, label: '用户行为' },
  { key: '/error-monitor', icon: <WarningOutlined />, label: '错误监控' },
];

/**
 * 主布局组件
 * 包含：左侧导航栏 + 右侧内容区 + AI 侧边栏（预留）
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // AI 侧边栏开关状态
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 菜单点击跳转
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧导航栏 */}
      <Sider width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <RobotOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>TraceFlow</span>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]} // 根据当前路由高亮菜单
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* 右侧内容区 */}
      <Layout>
        <Content style={{ overflow: 'auto' }}>{children}</Content>
      </Layout>

      {/* AI 智能分析侧边栏（预留） */}
      <Drawer
        title="AI 智能分析"
        placement="right"
        onClose={() => setAiDrawerOpen(false)}
        open={aiDrawerOpen}
        size="large"
      >
        <p>AI 推荐卡片区域</p>
      </Drawer>
    </Layout>
  );
};
