import type {
  SDKConfig,
  TraceEvent,
  Plugin,
  DeviceInfo,
  IStorageAdapter,
  EventType,
  Platform,
  ConfigProvider,
} from './types';
import { PluginManager } from './PluginManager';
import { ReportManager } from '../report/ReportManager';
import { detectPlatform } from '../platform/detector';
import { PlatformAdapterFactory } from '../adapter/PlatformAdapterFactory';

/** 生成唯一 ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** 生成会话 ID */
function generateSessionId(): string {
  return `sess_${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * SDK 就绪状态
 */
enum SDKState {
  /** 已创建但未初始化 */
  Created = 'created',
  /** 正在初始化 */
  Initializing = 'initializing',
  /** 已就绪 */
  Ready = 'ready',
  /** 已销毁 */
  Destroyed = 'destroyed',
}

export class TraceSDK {
  private originalConfig: SDKConfig;
  private configProvider: ConfigProvider;
  private reporter: ReportManager;
  private plugins: PluginManager;
  private deviceInfo: DeviceInfo | null = null;
  private anonymousId: string = '';
  private sessionId: string = generateSessionId();
  private userId?: string;
  private storageAdapter: IStorageAdapter;
  private platform: Platform;
  private state: SDKState = SDKState.Created;
  // 保存提前注册的插件，init 完成后统一调用 onLoad
  private pendingPlugins: Plugin[] = [];

  private constructor(config: SDKConfig) {
    this.originalConfig = config;

    // 检测或使用配置的 platform
    this.platform = config.platform || detectPlatform();

    // 初始化存储适配器
    if (config.storageAdapter) {
      this.storageAdapter = config.storageAdapter;
    } else {
      // 根据平台创建默认存储适配器
      const storageAdapter = PlatformAdapterFactory.createStorageAdapter(this.platform, {
        prefix: config.storageConfig?.prefix ?? 'trace_',
      });
      if (storageAdapter) {
        this.storageAdapter = storageAdapter;
      } else {
        // 平台不支持存储时，使用内存存储作为兜底
        this.storageAdapter = PlatformAdapterFactory.createStorageAdapter('nodejs', {
          prefix: 'trace_',
        })!;
      }
    }

    // 获取配置提供者
    this.configProvider =
      config.configProvider ||
      PlatformAdapterFactory.createConfigProvider(this.platform, this.storageAdapter);

    // 初始化网络适配器
    const networkAdapter =
      config.networkAdapter || PlatformAdapterFactory.createNetworkAdapter(this.platform, config);

    // 创建带有网络适配器的配置
    const finalConfig = networkAdapter ? { ...config, networkAdapter } : config;

    this.plugins = new PluginManager();
    this.reporter = new ReportManager(finalConfig, this.plugins);
  }

  static async init(config: SDKConfig): Promise<TraceSDK> {
    const sdk = new TraceSDK(config);
    sdk.state = SDKState.Initializing;

    try {
      // 异步加载设备信息（内联原 ConfigManager 逻辑）
      sdk.deviceInfo = await sdk.configProvider.getDeviceInfo();

      // 尝试获取匿名ID（优先级：configProvider > 存储适配器 > 生成新ID）
      if (sdk.configProvider.getAnonymousId) {
        try {
          sdk.anonymousId = (await sdk.configProvider.getAnonymousId()) || '';
        } catch {
          // getAnonymousId 失败，继续尝试从存储获取
          sdk.anonymousId = '';
        }
      }

      if (!sdk.anonymousId) {
        const storedAnonId = sdk.storageAdapter.get('anonymous_id');
        if (storedAnonId) {
          sdk.anonymousId = storedAnonId;
        }
      }

      if (!sdk.anonymousId) {
        sdk.anonymousId = generateId();
        try {
          sdk.storageAdapter.set('anonymous_id', sdk.anonymousId);
        } catch (error) {
          console.warn('[TraceSDK] Failed to persist anonymous_id to storage:', error);
          // 存储失败不影响 SDK 运行，anonymousId 保留在内存中
        }
      }

      // 标记上报管理器就绪
      sdk.reporter.ready();

      // 调用配置的就绪回调
      sdk.originalConfig.onReady?.();

      sdk.state = SDKState.Ready;

      // 调用所有提前注册的插件的 onLoad
      for (const plugin of sdk.pendingPlugins) {
        sdk.callPluginOnLoad(plugin);
      }
      sdk.pendingPlugins = [];
    } catch (error) {
      sdk.state = SDKState.Created;
      throw error;
    }

    return sdk;
  }

  /**
   * 检查 SDK 是否已就绪
   */
  private ensureReady(): void {
    if (this.state === SDKState.Destroyed) {
      throw new Error('[TraceSDK] SDK has been destroyed');
    }
    if (this.state !== SDKState.Ready) {
      console.warn('[TraceSDK] SDK is not ready. Call TraceSDK.init() first.');
    }
  }

  /**
   * 检查 SDK 是否已销毁
   */
  private isDestroyed(): boolean {
    return this.state === SDKState.Destroyed;
  }

  private createEvent(eventType: EventType, properties?: Record<string, unknown>): TraceEvent {
    const fallbackDeviceId = this.anonymousId || generateId();

    return {
      eventId: generateId(),
      eventType,
      timestamp: Date.now(),
      userId: this.userId,
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      // init 完成前 deviceInfo 为 null，提供默认值
      deviceInfo: this.deviceInfo ?? {
        platform: this.platform as DeviceInfo['platform'],
        deviceId: fallbackDeviceId,
      },
      properties,
      _createdAt: Date.now(),
    };
  }

  track(eventName: string, properties?: Record<string, unknown>) {
    // 输入验证
    if (typeof eventName !== 'string' || !eventName.trim()) {
      console.warn('[TraceSDK] track: eventName must be a non-empty string');
      return;
    }

    this.ensureReady();
    if (this.isDestroyed()) return;

    try {
      const event = {
        ...this.createEvent('track', properties),
        eventName,
      };
      const processedEvent = this.plugins.executeEventHook(event);
      if (processedEvent) {
        this.reporter.report(processedEvent);
      }
    } catch (error) {
      console.error('[TraceSDK] track error:', error);
    }
  }

  page(url?: string, title?: string, properties?: Record<string, unknown>, referrer?: string) {
    this.ensureReady();
    if (this.isDestroyed()) return;

    try {
      const event = {
        ...this.createEvent('page', properties),
        url,
        title,
        referrer:
          referrer ??
          (typeof document !== 'undefined' ? document.referrer || undefined : undefined),
      };
      const processedEvent = this.plugins.executeEventHook(event);
      if (processedEvent) {
        this.reporter.report(processedEvent);
      }
    } catch (error) {
      console.error('[TraceSDK] page error:', error);
    }
  }

  error(error: Error, context?: Record<string, unknown>) {
    if (!(error instanceof Error)) {
      console.warn('[TraceSDK] error: first argument must be an Error');
      return;
    }

    this.ensureReady();
    if (this.isDestroyed()) return;

    try {
      const event = this.createEvent('error', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context,
      });
      // 调用插件的 onError 钩子
      this.plugins.execute('onError', error);
      // 应用插件的 onEvent 钩子处理
      const processedEvent = this.plugins.executeEventHook(event);
      if (processedEvent) {
        this.reporter.report(processedEvent);
      }
    } catch (err) {
      console.error('[TraceSDK] error handler error:', err);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    // 输入验证
    if (typeof userId !== 'string' || !userId.trim()) {
      console.warn('[TraceSDK] identify: userId must be a non-empty string');
      return;
    }

    this.ensureReady();
    if (this.isDestroyed()) return;

    try {
      // 先发送事件，再更新状态（确保事件包含正确的 userId）
      const event = {
        ...this.createEvent('identify', traits ? { traits } : undefined),
        userId,
      };
      const processedEvent = this.plugins.executeEventHook(event);
      if (processedEvent) {
        this.reporter.report(processedEvent);
      }
      // 事件发送成功后才更新状态
      this.userId = userId;
    } catch (error) {
      console.error('[TraceSDK] identify error:', error);
      throw error; // re-throw，因为事件发送失败
    }
  }

  use(plugin: Plugin) {
    // 输入验证
    if (!plugin || typeof plugin !== 'object' || typeof plugin.name !== 'string') {
      console.warn('[TraceSDK] use: plugin must have a name property');
      return;
    }

    if (this.isDestroyed()) {
      console.warn('[TraceSDK] Cannot add plugin after SDK is destroyed');
      return;
    }

    // 检查是否已注册（按 name 去重）
    const existingPlugin = this.plugins.getPlugins().find((p) => p.name === plugin.name);
    if (existingPlugin) {
      console.warn(`[TraceSDK] Plugin '${plugin.name}' is already registered`);
      return;
    }

    // 检查 pendingPlugins 中是否已存在
    if (this.pendingPlugins.some((p) => p.name === plugin.name)) {
      console.warn(`[TraceSDK] Plugin '${plugin.name}' is already pending`);
      return;
    }

    this.plugins.register(plugin);

    // 只有在 ready 状态下才调用 onLoad
    if (this.state === SDKState.Ready) {
      this.callPluginOnLoad(plugin);
    } else {
      // 保存插件，等待 init 完成后统一调用
      this.pendingPlugins.push(plugin);
    }
  }

  /**
   * 获取当前设备信息
   */
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  /**
   * 获取当前匿名 ID
   */
  getAnonymousId(): string {
    return this.anonymousId;
  }

  /**
   * 获取当前会话 ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取当前用户 ID
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * 检查 SDK 是否已就绪
   */
  isReady(): boolean {
    return this.state === SDKState.Ready;
  }

  destroy() {
    if (this.state === SDKState.Destroyed) {
      return; // 防止重复销毁
    }

    this.plugins.unloadAll();
    this.reporter.destroy();

    // 重置所有状态
    this.state = SDKState.Destroyed;
    this.deviceInfo = null;
    this.anonymousId = '';
    this.userId = undefined;
    this.pendingPlugins = [];
  }

  /**
   * 调用插件的 onLoad 钩子
   */
  private callPluginOnLoad(plugin: Plugin): void {
    plugin.onLoad?.({
      config: this.originalConfig,
      deviceInfo: this.deviceInfo ?? {
        platform: this.platform as DeviceInfo['platform'],
        deviceId: this.anonymousId || generateId(),
      },
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      userId: this.userId,
      setAnonymousId: (id) => {
        this.anonymousId = id;
      },
      setUserId: (id) => {
        this.userId = id;
      },
      reportEvent: (event: TraceEvent) => {
        this.reporter.report(event);
      },
    });
  }
}
