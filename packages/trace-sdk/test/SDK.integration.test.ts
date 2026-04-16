import { TraceSDK } from '../src/index';
import { WebErrorPlugin } from '../src/plugins/web/ErrorPlugin';
import { WebPageViewPlugin } from '../src/plugins/web/PageViewPlugin';
import type { TraceEvent, Plugin, PluginContext, INetworkAdapter } from '../src/core/types';

// Mock global fetch 用于拦截网络请求
const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
global.fetch = mockFetch;

// Mock sendBeacon
const mockSendBeacon = jest.fn(() => true);
Object.defineProperty(global, 'navigator', {
  value: { sendBeacon: mockSendBeacon },
  writable: true,
});

/** 创建自定义网络适配器（完全可控） */
function createMockNetworkAdapter(): INetworkAdapter & {
  send: jest.Mock;
  sendBatch: jest.Mock;
  setHeader: jest.Mock;
} {
  return {
    send: jest.fn().mockResolvedValue(undefined),
    sendBatch: jest.fn().mockResolvedValue(undefined),
    setHeader: jest.fn(),
  };
}

describe('TraceSDK 核心流程集成测试', () => {
  const baseConfig = {
    appId: 'test-app-id',
    serverUrl: 'https://example.com/collect',
    debug: true,
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockSendBeacon.mockClear();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    mockSendBeacon.mockReturnValue(true);
  });

  // ============================================================
  // 1. 初始化流程
  // ============================================================
  describe('初始化流程', () => {
    test('TraceSDK.init 应返回具备所有公开方法的 SDK 实例', async () => {
      const sdk = await TraceSDK.init(baseConfig);

      expect(sdk).toBeDefined();
      expect(typeof sdk.track).toBe('function');
      expect(typeof sdk.page).toBe('function');
      expect(typeof sdk.error).toBe('function');
      expect(typeof sdk.identify).toBe('function');
      expect(typeof sdk.use).toBe('function');
      expect(typeof sdk.destroy).toBe('function');
    });

    test('初始化时应触发 onReady 回调', async () => {
      const onReady = jest.fn();
      await TraceSDK.init({ ...baseConfig, onReady });

      expect(onReady).toHaveBeenCalledTimes(1);
    });

    test('使用自定义 networkAdapter 初始化不应抛错', async () => {
      const customAdapter = createMockNetworkAdapter();

      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      expect(sdk).toBeDefined();
    });
  });

  // ============================================================
  // 2. 事件追踪流程（error 事件走立即发送，可直接验证）
  // ============================================================
  describe('事件追踪流程', () => {
    test('track 调用不应抛错', async () => {
      const sdk = await TraceSDK.init(baseConfig);

      expect(() => {
        sdk.track('button_click', { button_id: 'login-btn' });
      }).not.toThrow();
    });

    test('page 调用不应抛错', async () => {
      const sdk = await TraceSDK.init(baseConfig);

      expect(() => {
        sdk.page('/home', '首页');
      }).not.toThrow();
    });

    test('error 调用应生成 error 类型事件并通过 networkAdapter 立即发送', async () => {
      const customAdapter = createMockNetworkAdapter();
      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      sdk.error(new Error('Test error'), { component: 'LoginForm' });

      // error 事件走 sendImmediately，会立即调用 networkAdapter.send
      expect(customAdapter.send).toHaveBeenCalledTimes(1);
      const sentEvent = customAdapter.send.mock.calls[0][0] as TraceEvent;
      expect(sentEvent.eventType).toBe('error');
      expect(sentEvent.properties).toHaveProperty('message', 'Test error');
      expect(sentEvent.properties).toHaveProperty('component', 'LoginForm');
    });

    test('identify 调用不应抛错', async () => {
      const sdk = await TraceSDK.init(baseConfig);

      expect(() => {
        sdk.identify('user-123', { username: 'testuser' });
      }).not.toThrow();
    });
  });

  // ============================================================
  // 3. 插件系统流程
  // ============================================================
  describe('插件系统流程', () => {
    test('use(plugin) 应触发插件的 onLoad 钩子，并传入 PluginContext', async () => {
      const sdk = await TraceSDK.init(baseConfig);
      const onLoad = jest.fn();

      sdk.use({ name: 'test-plugin', onLoad });

      expect(onLoad).toHaveBeenCalledTimes(1);
      const ctx = onLoad.mock.calls[0][0] as PluginContext;
      expect(ctx).toHaveProperty('config');
      expect(ctx).toHaveProperty('deviceInfo');
      expect(ctx).toHaveProperty('anonymousId');
      expect(ctx).toHaveProperty('sessionId');
      expect(ctx).toHaveProperty('setAnonymousId');
      expect(ctx).toHaveProperty('setUserId');
      expect(ctx).toHaveProperty('reportEvent');
    });

    test('插件的 onEvent 钩子应能修改事件属性', async () => {
      const customAdapter = createMockNetworkAdapter();
      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      // 注册一个给事件添加自定义属性的插件
      sdk.use({
        name: 'enrich-plugin',
        onEvent: (event) => ({ ...event, properties: { ...event.properties, enriched: true } }),
      });

      sdk.error(new Error('test'));

      expect(customAdapter.send).toHaveBeenCalledTimes(1);
      const sentEvent = customAdapter.send.mock.calls[0][0] as TraceEvent;
      expect(sentEvent.properties).toHaveProperty('enriched', true);
    });

    test('插件的 onEvent 钩子返回 undefined 应丢弃事件', async () => {
      const customAdapter = createMockNetworkAdapter();
      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      // 注册一个丢弃所有事件的插件
      sdk.use({
        name: 'drop-plugin',
        onEvent: () => undefined,
      });

      sdk.error(new Error('should_be_dropped'));

      // 事件被插件丢弃，不应到达 networkAdapter
      expect(customAdapter.send).not.toHaveBeenCalled();
    });

    test('插件应按优先级顺序执行', async () => {
      const executionOrder: string[] = [];
      const customAdapter = createMockNetworkAdapter();
      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      // 低优先级插件（后执行）
      sdk.use({
        name: 'low-priority',
        priority: 0,
        onEvent: (event) => {
          executionOrder.push('low');
          return event;
        },
      });

      // 高优先级插件（先执行）
      sdk.use({
        name: 'high-priority',
        priority: 10,
        onEvent: (event) => {
          executionOrder.push('high');
          return event;
        },
      });

      sdk.error(new Error('priority_test'));

      expect(executionOrder).toEqual(['high', 'low']);
    });

    test('插件的 reportEvent 方法应能向 SDK 上报管道注入事件', async () => {
      const customAdapter = createMockNetworkAdapter();
      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      // 注册一个在 onLoad 时通过 reportEvent 注入事件的插件
      sdk.use({
        name: 'auto-report-plugin',
        onLoad: (ctx) => {
          ctx.reportEvent({
            eventId: 'auto-1',
            eventType: 'error', // 使用 error 类型确保立即发送
            timestamp: Date.now(),
            anonymousId: ctx.anonymousId,
            sessionId: ctx.sessionId,
            deviceInfo: ctx.deviceInfo,
            properties: { source: 'plugin' },
            _createdAt: Date.now(),
          });
        },
      });

      // 插件通过 reportEvent 注入的 error 事件应立即发送
      expect(customAdapter.send).toHaveBeenCalledTimes(1);
      const sentEvent = customAdapter.send.mock.calls[0][0] as TraceEvent;
      expect(sentEvent.eventId).toBe('auto-1');
      expect(sentEvent.properties).toHaveProperty('source', 'plugin');
    });

    test('error 事件应触发插件的 onError 钩子', async () => {
      const customAdapter = createMockNetworkAdapter();
      const onErrorPlugin = jest.fn();
      const sdk = await TraceSDK.init({
        ...baseConfig,
        networkAdapter: customAdapter,
      });

      sdk.use({ name: 'error-listener', onError: onErrorPlugin });

      const testError = new Error('Test error');
      sdk.error(testError);

      expect(onErrorPlugin).toHaveBeenCalledWith(testError);
    });

    test('官方 Web 插件应能正常注册和工作', async () => {
      const sdk = await TraceSDK.init(baseConfig);

      const errorPlugin = new WebErrorPlugin();
      const pageViewPlugin = new WebPageViewPlugin();

      expect(() => {
        sdk.use(errorPlugin);
        sdk.use(pageViewPlugin);
      }).not.toThrow();

      expect(errorPlugin.name).toBe('web-error');
      expect(pageViewPlugin.name).toBe('web-pageview');

      // 注册插件后追踪事件不应抛错
      expect(() => {
        sdk.track('with_plugins', { test: true });
      }).not.toThrow();
    });
  });

  // ============================================================
  // 4. beforeSend 流程（error 事件走立即发送可验证）
  // ============================================================
  describe('beforeSend 流程', () => {
    test('beforeSend 返回 false 应丢弃事件', async () => {
      const customAdapter = createMockNetworkAdapter();
      const onReportSuccess = jest.fn();

      const sdk = await TraceSDK.init({
        ...baseConfig,
        beforeSend: () => false,
        onReportSuccess,
        networkAdapter: customAdapter,
      });

      sdk.error(new Error('should_be_filtered'));

      // beforeSend 返回 false，事件被丢弃，不应到达 networkAdapter
      expect(customAdapter.send).not.toHaveBeenCalled();
      expect(onReportSuccess).not.toHaveBeenCalled();
    });

    test('beforeSend 返回修改后的事件应使用修改后的数据', async () => {
      const customAdapter = createMockNetworkAdapter();

      const sdk = await TraceSDK.init({
        ...baseConfig,
        beforeSend: (event: TraceEvent) => ({
          ...event,
          properties: { ...event.properties, global_tag: 'v1' },
        }),
        networkAdapter: customAdapter,
      });

      sdk.error(new Error('tagged_error'));

      expect(customAdapter.send).toHaveBeenCalledTimes(1);
      const sentEvent = customAdapter.send.mock.calls[0][0] as TraceEvent;
      expect(sentEvent.properties).toHaveProperty('global_tag', 'v1');
    });
  });

  // ============================================================
  // 5. 上报回调流程
  // ============================================================
  describe('上报回调流程', () => {
    test('error 事件上报成功应触发 onReportSuccess', async () => {
      const customAdapter = createMockNetworkAdapter();
      const onReportSuccess = jest.fn();

      const sdk = await TraceSDK.init({
        ...baseConfig,
        onReportSuccess,
        networkAdapter: customAdapter,
      });

      sdk.error(new Error('test_error'));

      // sdk.error() 内部异步调用 reporter.report()，需要等待微任务完成
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(customAdapter.send).toHaveBeenCalledTimes(1);
      expect(onReportSuccess).toHaveBeenCalledTimes(1);
      const reportedEvent = onReportSuccess.mock.calls[0][0] as TraceEvent;
      expect(reportedEvent.eventType).toBe('error');
    });

    test('上报失败应触发重试逻辑', async () => {
      const customAdapter = createMockNetworkAdapter();
      customAdapter.send.mockRejectedValue(new Error('Network error'));
      const onReportFail = jest.fn();

      const sdk = await TraceSDK.init({
        ...baseConfig,
        onReportFail,
        networkAdapter: customAdapter,
      });

      sdk.error(new Error('test_error'));

      // 等待异步发送完成
      await new Promise((resolve) => setTimeout(resolve, 50));

      // send 失败后应进入重试队列（默认 maxRetries=3），不会立即触发 onReportFail
      expect(onReportFail).not.toHaveBeenCalled();
      // send 确实被调用了（初次发送尝试）
      expect(customAdapter.send).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 6. 生命周期流程
  // ============================================================
  describe('生命周期流程', () => {
    test('destroy 应触发插件 onUnload 钩子', async () => {
      const sdk = await TraceSDK.init(baseConfig);
      const onUnload = jest.fn();

      sdk.use({ name: 'lifecycle-plugin', onUnload });

      expect(onUnload).not.toHaveBeenCalled();

      sdk.destroy();

      expect(onUnload).toHaveBeenCalledTimes(1);
    });

    test('destroy 后可重新初始化新实例', async () => {
      const sdk1 = await TraceSDK.init(baseConfig);
      sdk1.destroy();

      const sdk2 = await TraceSDK.init(baseConfig);

      expect(sdk2).toBeDefined();
      expect(sdk2).not.toBe(sdk1);

      // 新实例应能正常工作
      expect(() => sdk2.track('after_reinit')).not.toThrow();
    });
  });

  // ============================================================
  // 7. 端到端流程
  // ============================================================
  describe('端到端流程', () => {
    test('完整流程：初始化 → 注册插件 → 追踪事件 → beforeSend → 上报 → 销毁', async () => {
      // 1. 准备监控点
      const onReady = jest.fn();
      const onLoad = jest.fn();
      const onEvent = jest.fn((event: TraceEvent) => event);
      const beforeSend = jest.fn((event: TraceEvent) => event);
      const onReportSuccess = jest.fn();
      const onUnload = jest.fn();
      const customAdapter = createMockNetworkAdapter();

      // 2. 初始化 SDK
      const sdk = await TraceSDK.init({
        ...baseConfig,
        onReady,
        beforeSend,
        onReportSuccess,
        networkAdapter: customAdapter,
      });
      expect(onReady).toHaveBeenCalledTimes(1);

      // 3. 注册插件
      sdk.use({ name: 'e2e-plugin', onLoad, onEvent, onUnload });
      expect(onLoad).toHaveBeenCalledTimes(1);

      // 4. 追踪普通事件（走批量上报）
      sdk.track('e2e_event', { step: 'batch' });

      // 插件 onEvent 应被调用
      expect(onEvent).toHaveBeenCalledTimes(1);
      const processedEvent = onEvent.mock.calls[0][0] as TraceEvent;
      expect(processedEvent.eventType).toBe('track');

      // 5. 追踪 error 事件（走立即发送）
      sdk.error(new Error('e2e_error'));

      // sdk.error() 内部异步调用 reporter.report()，需要等待微任务完成
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 插件 onEvent 又被调用一次（error 事件也经过插件链）
      expect(onEvent).toHaveBeenCalledTimes(2);

      // beforeSend 应被调用（error 走 sendImmediately）
      expect(beforeSend).toHaveBeenCalledTimes(1);

      // networkAdapter.send 应被调用
      expect(customAdapter.send).toHaveBeenCalledTimes(1);

      // onReportSuccess 应被调用
      expect(onReportSuccess).toHaveBeenCalledTimes(1);

      // 6. 销毁
      sdk.destroy();
      expect(onUnload).toHaveBeenCalledTimes(1);
    });
  });
});
