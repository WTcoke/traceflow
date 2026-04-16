import type { TraceEvent, DeviceInfo, Plugin, SDKConfig, PluginContext } from '../src/core/types';

/** 测试设备信息 */
export const MOCK_DEVICE_INFO: DeviceInfo = {
  deviceId: 'test-device-id',
  platform: 'web',
  userAgent: 'Mozilla/5.0 Test',
  screenWidth: 1920,
  screenHeight: 1080,
  os: 'Windows',
  osVersion: '10',
  browser: 'Chrome',
  browserVersion: '120.0.0.0',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  networkType: 'wifi',
  appVersion: '1.0.0',
  sdkVersion: '1.0.0',
  channel: 'test',
};

/** 测试配置 */
export const MOCK_CONFIG: SDKConfig = {
  appId: 'test-app-id',
  serverUrl: 'https://example.com/collect',
  debug: true,
};

/** 创建模拟事件 */
export function createMockEvent(eventType: string, properties?: Record<string, any>): TraceEvent {
  return {
    eventId: `event-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    eventType: eventType as any,
    timestamp: Date.now(),
    userId: 'test-user-id',
    anonymousId: 'test-anonymous-id',
    sessionId: 'test-session-id',
    deviceInfo: MOCK_DEVICE_INFO,
    properties,
    _createdAt: Date.now(),
  };
}

/** 创建模拟插件 */
export function createMockPlugin(name: string, priority = 0): Plugin {
  return {
    name,
    priority,
    onLoad: jest.fn(),
    onEvent: jest.fn((event) => event),
    onError: jest.fn(),
    onReport: jest.fn((events) => events),
    onUnload: jest.fn(),
  };
}

/** 创建模拟插件上下文 */
export function createMockPluginContext(): PluginContext {
  return {
    config: MOCK_CONFIG,
    deviceInfo: MOCK_DEVICE_INFO,
    anonymousId: 'test-anonymous-id',
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    setAnonymousId: jest.fn(),
    setUserId: jest.fn(),
    reportEvent: jest.fn(),
  };
}
