# TraceFlow SDK 使用手册

> TraceFlow 是一款轻量级、可扩展的前端埋点 SDK，支持 Web、小程序、Node.js 等多平台。

## 简介

TraceFlow 是一款专为现代前端应用设计的埋点解决方案，具有以下核心特点：

### 核心优势

| 特性                | 说明                                                     |
| ------------------- | -------------------------------------------------------- |
| **轻量高效**        | gzip 后仅 12-19KB，对页面性能影响极小                    |
| **插件化架构**      | 通过插件系统自由扩展功能，满足定制化需求                 |
| **多平台支持**      | 统一 API，覆盖 Web、微信/支付宝/百度/字节小程序、Node.js |
| **可靠上报**        | 内置批量上报、智能重试机制，事件不丢失                   |
| **TypeScript 优先** | 完整类型提示，开发体验友好                               |

### 设计理念

TraceFlow 参考了 [Segment Analytics.js](https://segment.com/docs/) 的插件化设计理念，强调：

- **可扩展**：通过插件机制轻松添加自定义功能
- **可替换**：适配器模式支持替换核心组件（网络层、存储层）
- **可观测**：内置调试模式和上报回调，便于问题排查

### 支持的平台

| 平台         | 标识              | 说明           |
| ------------ | ----------------- | -------------- |
| Web          | `web`             | 浏览器环境     |
| 微信小程序   | `miniapp-weixin`  | 微信小程序     |
| 支付宝小程序 | `miniapp-alipay`  | 支付宝小程序   |
| 百度小程序   | `miniapp-baidu`   | 百度小程序     |
| 字节小程序   | `miniapp-toutiao` | 字节跳动小程序 |
| Node.js      | `nodejs`          | 服务端环境     |

---

## 快速开始

### 安装

**NPM 安装**

```bash
npm install @traceflow/sdk
```

**CDN 引入**

```html
<!-- Web 平台 -->
<script src="https://unpkg.com/@traceflow/sdk@0.1.0/dist/trace-sdk.iife.js"></script>

<!-- 微信小程序 -->
<script src="https://unpkg.com/@traceflow/sdk@0.1.0/dist/trace-sdk.weixin.cjs.js"></script>

<!-- 支付宝小程序 -->
<script src="https://unpkg.com/@traceflow/sdk@0.1.0/dist/trace-sdk.alipay.cjs.js"></script>
```

> **提示**：更多平台的 CDN 引入方式，请查看 [CDN 构建](#cdn-构建) 章节。

### 基础使用

**NPM 方式**

```typescript
import { TraceSDK } from '@traceflow/sdk';

// 初始化 SDK
const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
});

// 追踪用户行为
sdk.track('button_click', { button_name: 'submit' });
sdk.page('/home', '首页');
```

**CDN 方式**

```typescript
// 使用全局变量 TraceSDK
TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
}).then((sdk) => {
  sdk.track('button_click', { button_name: 'submit' });
});
```

---

## SDK 初始化

### 完整配置

```typescript
import { TraceSDK } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  // 必填配置
  appId: 'app_xxxxxxxxxx',
  serverUrl: 'https://your-server.com/track',

  // 可选配置
  debug: true, // 调试模式
  platform: 'web', // 平台类型（默认自动检测）

  // 上报配置
  reportConfig: {
    batchSize: 10, // 批量上报数量（默认 10）
    flushInterval: 3000, // 批量上报间隔 ms（默认 3000）
    maxRetries: 3, // 最大重试次数（默认 3）
    retryInterval: 1000, // 重试间隔 ms（默认 1000）
  },

  // 采样配置
  samplingConfig: {
    rate: 1, // 全局采样率 0-1（默认 1）
    byEventType: {
      // 按事件类型采样
      track: 0.5, // 只采集 50% 的 track 事件
      error: 1, // 100% 采集错误事件
    },
    consistentByUser: true, // 相同用户采样结果一致
  },

  // 存储配置
  storageConfig: {
    enabled: true, // 是否启用本地存储（默认 true）
    prefix: 'trace_', // 存储 Key 前缀
    expire: 604800000, // 有效期 7 天（默认 7 天）
    maxSize: 1000, // 存储容量上限（条数）
  },

  // 回调钩子
  onReady: () => {
    console.log('TraceFlow SDK 已就绪');
  },

  beforeSend: (event) => {
    // 过滤敏感信息
    delete event.properties?.password;
    return event;
  },

  onReportSuccess: (event) => {
    console.log('上报成功', event.eventId);
  },

  onReportFail: (event, error) => {
    console.error('上报失败', error);
  },
});
```

### 配置说明

| 配置项            | 类型                                     | 必填 | 默认值   | 说明                              |
| ----------------- | ---------------------------------------- | ---- | -------- | --------------------------------- |
| `appId`           | `string`                                 | 是   | -        | 应用唯一标识                      |
| `serverUrl`       | `string`                                 | 是   | -        | 数据上报地址                      |
| `platform`        | `Platform`                               | 否   | 自动检测 | 运行平台                          |
| `debug`           | `boolean`                                | 否   | `false`  | 调试模式                          |
| `reportConfig`    | `ReportConfig`                           | 否   | -        | 上报配置                          |
| `samplingConfig`  | `SamplingConfig`                         | 否   | -        | 采样配置                          |
| `storageConfig`   | `StorageConfig`                          | 否   | -        | 存储配置                          |
| `configProvider`  | `ConfigProvider`                         | 否   | -        | 配置提供者                        |
| `networkAdapter`  | `INetworkAdapter`                        | 否   | -        | 网络适配器                        |
| `storageAdapter`  | `IStorageAdapter`                        | 否   | -        | 存储适配器                        |
| `onReady`         | `() => void`                             | 否   | -        | SDK 就绪回调                      |
| `beforeSend`      | `(event) => TraceEvent \| false \| void` | 否   | -        | 发送前回调，返回 `false` 丢弃事件 |
| `onReportSuccess` | `(event) => void`                        | 否   | -        | 上报成功回调                      |
| `onReportFail`    | `(event, error) => void`                 | 否   | -        | 上报失败回调                      |

### ReportConfig

| 配置项          | 类型     | 默认值 | 说明             |
| --------------- | -------- | ------ | ---------------- |
| `batchSize`     | `number` | `10`   | 批量上报数量     |
| `flushInterval` | `number` | `3000` | 批量上报间隔(ms) |
| `maxRetries`    | `number` | `3`    | 最大重试次数     |
| `retryInterval` | `number` | `1000` | 重试间隔(ms)     |

### SamplingConfig

| 配置项             | 类型                        | 默认值  | 说明                     |
| ------------------ | --------------------------- | ------- | ------------------------ |
| `rate`             | `number`                    | `1`     | 全局采样率(0-1)          |
| `byEventType`      | `Record<EventType, number>` | -       | 按事件类型采样           |
| `consistentByUser` | `boolean`                   | `false` | 基于用户 ID 的采样一致性 |

### StorageConfig

| 配置项    | 类型      | 默认值      | 说明             |
| --------- | --------- | ----------- | ---------------- |
| `enabled` | `boolean` | `true`      | 是否启用本地存储 |
| `prefix`  | `string`  | `trace_`    | 存储 Key 前缀    |
| `expire`  | `number`  | `604800000` | 有效期(7天)      |
| `maxSize` | `number`  | `1000`      | 存储容量上限     |

---

## 事件追踪

TraceFlow SDK 提供以下事件追踪方法：

### track()

追踪用户行为事件。

```typescript
// 基础用法
sdk.track('button_click');

// 带属性
sdk.track('button_click', {
  button_name: 'submit',
  button_text: '提交',
  page: '/checkout',
});
```

**参数说明**

| 参数         | 类型                      | 必填 | 说明                                    |
| ------------ | ------------------------- | ---- | --------------------------------------- |
| `eventName`  | `string`                  | 是   | 事件名称，如 `button_click`、`purchase` |
| `properties` | `Record<string, unknown>` | 否   | 事件属性，自定义数据                    |

**事件结构**

```typescript
{
  eventType: 'track',
  properties: {
    event: eventName,    // 事件名称
    ...properties        // 自定义属性
  }
}
```

### page()

记录页面浏览。

```typescript
// 基础用法
sdk.page();

// 指定 URL 和标题
sdk.page('/home', '首页');

// 带属性
sdk.page('/product/123', '商品详情', {
  category: '电子产品',
  productId: '123',
});
```

**参数说明**

| 参数         | 类型                      | 必填 | 说明     |
| ------------ | ------------------------- | ---- | -------- |
| `url`        | `string`                  | 否   | 页面 URL |
| `title`      | `string`                  | 否   | 页面标题 |
| `properties` | `Record<string, unknown>` | 否   | 页面属性 |

**自动采集信息**

- URL 查询参数
- 来源页面 (referrer)
- 路由路径

### error()

上报错误信息。

```typescript
try {
  // 业务代码
  JSON.parse(invalidJson);
} catch (error) {
  sdk.error(error, {
    context: 'JSON 解析',
    data: invalidJson,
  });
}
```

**参数说明**

| 参数      | 类型                      | 必填 | 说明           |
| --------- | ------------------------- | ---- | -------------- |
| `error`   | `Error`                   | 是   | 错误对象       |
| `context` | `Record<string, unknown>` | 否   | 错误上下文信息 |

**错误事件属性**

```typescript
{
  eventType: 'error',
  properties: {
    name: error.name,           // 错误类型名称
    message: error.message,     // 错误信息
    stack: error.stack,         // 错误堆栈
    ...context                   // 自定义上下文
  },
  priority: 'critical'           // 错误事件自动设为高优先级
}
```

### identify()

关联用户身份。

```typescript
// 用户登录时
sdk.identify('user_123', {
  email: 'user@example.com',
  name: '张三',
  plan: 'pro',
});

// 用户退出时
sdk.identify('');
```

**参数说明**

| 参数     | 类型                      | 必填 | 说明                            |
| -------- | ------------------------- | ---- | ------------------------------- |
| `userId` | `string`                  | 是   | 用户 ID（空字符串表示退出登录） |
| `traits` | `Record<string, unknown>` | 否   | 用户属性                        |

---

## 插件系统

TraceFlow 的插件系统允许你扩展 SDK 功能，包括修改事件、处理数据、添加自动采集等。

### 核心概念

```
┌─────────────────────────────────────────────────────────┐
│                      TraceSDK                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Plugin    │ -> │   Plugin    │ -> │   Plugin    │  │
│  │ (Priority 100)│    │ (Priority 50) │    │ (Priority 0) │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │        │
│         └──────────────────┼──────────────────┘        │
│                            ▼                            │
│                   ┌─────────────┐                       │
│                   │  Reporter   │                       │
│                   └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### 插件接口

```typescript
interface Plugin {
  /** 插件名称 (唯一标识) */
  name: string;

  /** 插件优先级 (数值越大越先执行，默认 0) */
  priority?: number;

  /** 插件加载时调用 */
  onLoad?(context: PluginContext): void | Promise<void>;

  /** 事件处理钩子 (返回 void 表示丢弃事件) */
  onEvent?(event: TraceEvent): TraceEvent | void;

  /** 错误处理钩子 */
  onError?(error: Error): void;

  /** 批量上报前处理钩子 */
  onReport?(events: TraceEvent[]): TraceEvent[];

  /** 插件卸载时调用 */
  onUnload?(): void;
}
```

### BasePlugin 抽象类

SDK 提供 `BasePlugin` 抽象类作为插件开发的基类：

```typescript
import { BasePlugin } from '@traceflow/sdk';

class MyPlugin extends BasePlugin {
  name = 'my-plugin';
  priority = 50;

  onLoad(context) {
    console.log('插件加载', context.deviceInfo);
  }

  onEvent(event) {
    // 添加公共属性
    event.properties = {
      ...event.properties,
      customField: 'value',
    };
    return event;
  }

  onUnload() {
    console.log('插件卸载');
  }
}
```

### PluginContext

插件上下文，提供操作 SDK 的能力：

```typescript
interface PluginContext {
  /** SDK 配置 */
  config: SDKConfig;

  /** 设备信息 */
  deviceInfo: DeviceInfo;

  /** 匿名 ID */
  anonymousId: string;

  /** 会话 ID */
  sessionId: string;

  /** 用户 ID */
  userId?: string;

  /** 更新匿名 ID */
  setAnonymousId: (id: string) => void;

  /** 更新用户 ID */
  setUserId: (id: string | undefined) => void;

  /** 上报事件（插件采集的事件通过此方法进入 SDK 上报管道） */
  reportEvent: (event: TraceEvent) => void;
}
```

### 注册插件

```typescript
import { TraceSDK, WebErrorPlugin } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
});

// 注册官方插件
sdk.use(new WebErrorPlugin());

// 注册自定义插件
sdk.use({
  name: 'my-plugin',
  priority: 50,

  onLoad(context) {
    console.log('插件加载', context.deviceInfo);
  },

  onEvent(event) {
    // 添加公共属性
    event.properties = {
      ...event.properties,
      customField: 'value',
    };
    return event;
  },

  onUnload() {
    console.log('插件卸载');
  },
});
```

### 生命周期钩子

| 钩子       | 触发时机                  | 用途                       |
| ---------- | ------------------------- | -------------------------- |
| `onLoad`   | 插件注册时                | 初始化插件，绑定事件监听器 |
| `onEvent`  | 每个事件上报前            | 修改事件属性、过滤事件     |
| `onError`  | 手动调用 `sdk.error()` 时 | 预处理错误信息             |
| `onReport` | 批量上报前                | 批量处理事件数据           |
| `onUnload` | SDK 销毁时                | 清理资源，移除事件监听     |

### 插件示例：添加公共属性

```typescript
const CommonPropsPlugin = {
  name: 'common-props',

  onLoad(context) {
    // 获取 APP 版本（可通过配置或其他方式获取）
    this.appVersion = context.config.appVersion || '1.0.0';
  },

  onEvent(event) {
    // 添加公共属性到所有事件
    event.properties = {
      ...event.properties,
      appVersion: this.appVersion,
      environment: process.env.NODE_ENV,
    };
    return event;
  },
};

sdk.use(CommonPropsPlugin);
```

### 插件示例：过滤敏感事件

```typescript
const PrivacyPlugin = {
  name: 'privacy-filter',

  onEvent(event) {
    // 过滤包含敏感词的属性
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard'];

    if (event.properties) {
      for (const key of sensitiveKeys) {
        if (key in event.properties) {
          delete event.properties[key];
        }
      }
    }

    return event;
  },
};

sdk.use(PrivacyPlugin);
```

---

## 官方插件

TraceFlow 提供以下官方插件：

### WebErrorPlugin

Web 错误监控插件，自动捕获 JS 运行时错误和 Promise 拒绝。

**功能特性**

- 自动捕获 `window.onerror` 错误
- 自动捕获未处理的 Promise 拒绝
- 自动分类错误类型（JS Error、Promise Error）
- 解析错误堆栈信息

**安装使用**

```typescript
import { TraceSDK, WebErrorPlugin } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
});

// 注册插件
sdk.use(new WebErrorPlugin());

// 手动上报错误
sdk.error(new Error('Something went wrong'));
```

**错误事件属性**

| 属性           | 类型     | 说明                                                     |
| -------------- | -------- | -------------------------------------------------------- |
| `errorName`    | `string` | 错误类型名称                                             |
| `errorMessage` | `string` | 错误信息                                                 |
| `stack`        | `string` | 错误堆栈                                                 |
| `category`     | `string` | 错误分类 (`js_error` / `promise_error` / `custom_error`) |
| `source`       | `string` | 错误来源文件                                             |
| `lineno`       | `number` | 行号                                                     |
| `colno`        | `number` | 列号                                                     |

### WebPageViewPlugin

Web 页面浏览自动采集插件，支持 SPA 路由监听。

**功能特性**

- 自动采集首次页面浏览
- 监听 History API（`pushState`、`replaceState`、`popstate`）
- 监听 Hash 变化
- 自动解析 URL 查询参数

**安装使用**

```typescript
import { TraceSDK, WebPageViewPlugin } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
});

// 使用默认配置
sdk.use(new WebPageViewPlugin());

// 自定义配置
sdk.use(
  new WebPageViewPlugin({
    autoTrack: true, // 自动采集首次页面（默认 true）
    listenRouteChange: true, // 监听路由变化（默认 true）
    useHistoryApi: true, // 使用 History API 监听（默认 true）
    useHashChange: true, // 使用 hashchange 监听（默认 true）
  }),
);
```

**页面事件属性**

| 属性       | 类型     | 说明         |
| ---------- | -------- | ------------ |
| `url`      | `string` | 完整 URL     |
| `title`    | `string` | 页面标题     |
| `referrer` | `string` | 来源页面     |
| `path`     | `string` | URL 路径     |
| `query`    | `object` | 查询参数对象 |
| `hash`     | `string` | URL Hash     |

### WebClickPlugin

Web 点击事件自动采集插件。

**功能特性**

- 自动采集用户点击事件
- 支持 CSS 选择器过滤
- 自动识别点击元素信息

**安装使用**

```typescript
import { TraceSDK, WebClickPlugin } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
});

sdk.use(
  new WebClickPlugin({
    // 只采集匹配选择器的元素点击
    selector: '[data-track]',
    // 排除特定元素
    exclude: '[data-no-track]',
  }),
);
```

### WebPerformancePlugin

Web 性能监控插件，采集页面性能指标。

**功能特性**

- 采集 LCP (Largest Contentful Paint)
- 采集 CLS (Cumulative Layout Shift)
- 采集页面加载时间

**安装使用**

```typescript
import { TraceSDK, WebPerformancePlugin } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
});

sdk.use(
  new WebPerformancePlugin({
    // 是否采集 LCP（默认 true）
    trackLCP: true,
    // 是否采集 CLS（默认 true）
    trackCLS: true,
  }),
);
```

---

## 平台适配

TraceFlow 为不同平台提供优化的适配器，包括网络层和存储层实现。

### 平台检测

SDK 会自动检测当前运行环境：

```typescript
import { detectPlatform } from '@traceflow/sdk';

const platform = detectPlatform();
// 返回: 'web' | 'miniapp-weixin' | 'miniapp-alipay' | 'miniapp-baidu' | 'miniapp-toutiao' | 'nodejs'
```

也可手动指定平台：

```typescript
const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
  platform: 'web', // 手动指定
});
```

### Web

Web 平台使用浏览器原生 API：

```typescript
import {
  TraceSDK,
  WebNetworkAdapter,
  WebStorageAdapter,
  localStorageAdapter,
  sessionStorageAdapter,
} from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',

  // 可选：自定义存储适配器
  storageAdapter: localStorageAdapter, // 或 sessionStorageAdapter
});
```

**WebNetworkAdapter**

使用 `fetch` API 和 `sendBeacon` 发送请求：

```typescript
import { WebNetworkAdapter } from '@traceflow/sdk';

const adapter = new WebNetworkAdapter({
  serverUrl: 'https://your-server.com/track',
});
```

### 微信小程序

```typescript
import { TraceSDK, WeixinNetworkAdapter, WeixinStorageAdapter } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
  platform: 'miniapp-weixin',
});
```

**适配器特性**

- `WeixinNetworkAdapter`：使用 `wx.request` 发送请求
- `WeixinStorageAdapter`：使用 `wx.getStorageSync` / `wx.setStorageSync`

### 支付宝小程序

```typescript
import {
  TraceSDK,
  AlipayNetworkAdapter,
  AlipayStorageAdapter,
  AlipayConfigProvider,
} from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
  platform: 'miniapp-alipay',
});
```

**适配器特性**

- `AlipayNetworkAdapter`：使用 `my.httpRequest` 发送请求
- `AlipayStorageAdapter`：使用 `my.getStorage` / `my.setStorage`
- `AlipayConfigProvider`：获取支付宝设备信息和匿名 ID

### 其他小程序

百度小程序和字节小程序使用方式类似：

```typescript
// 百度小程序
import { BaiduNetworkAdapter, BaiduStorageAdapter } from '@traceflow/sdk';

// 字节小程序
import { ToutiaoNetworkAdapter, ToutiaoStorageAdapter } from '@traceflow/sdk';
```

### Node.js

```typescript
import { TraceSDK, NodeNetworkAdapter, NodeStorageAdapter } from '@traceflow/sdk';

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
  platform: 'nodejs',

  // Node.js 特有配置
  storageConfig: {
    prefix: 'trace_',
    expire: 86400000, // 1 天
  },
});
```

**NodeNetworkAdapter**

使用 Node.js 原生 `http` / `https` 模块发送请求：

```typescript
import { NodeNetworkAdapter } from '@traceflow/sdk';

const adapter = new NodeNetworkAdapter({
  serverUrl: 'https://your-server.com/track',
  // 自定义 headers
  headers: {
    'X-API-Key': 'your-api-key',
  },
});
```

---

## API 参考

### SDKConfig

```typescript
interface SDKConfig {
  // 必填配置
  appId: string;
  serverUrl: string;

  // 可选配置
  platform?: Platform;
  debug?: boolean;
  reportConfig?: ReportConfig;
  samplingConfig?: SamplingConfig;
  storageConfig?: StorageConfig;
  configProvider?: ConfigProvider;
  networkAdapter?: INetworkAdapter;
  storageAdapter?: IStorageAdapter;

  // 回调钩子
  onReady?: () => void;
  beforeSend?: (event: TraceEvent) => TraceEvent | false | void;
  onReportSuccess?: (event: TraceEvent) => void;
  onReportFail?: (event: TraceEvent, error: Error) => void;
}
```

### TraceEvent

```typescript
interface TraceEvent {
  // 事件标识
  eventId: string; // 事件唯一 ID
  eventType: EventType; // 事件类型
  eventName?: string; // 事件名称（track 事件）

  // 时间与用户
  timestamp: number; // 事件时间戳
  userId?: string; // 用户 ID
  anonymousId: string; // 匿名 ID
  sessionId: string; // 会话 ID

  // 设备信息
  deviceInfo: DeviceInfo; // 设备信息

  // 页面信息
  url?: string; // 当前 URL
  title?: string; // 页面标题
  referrer?: string; // 来源页面

  // 事件数据
  properties?: Record<string, unknown>; // 事件属性

  // 上报控制
  priority?: EventPriority; // 事件优先级
  _sent?: boolean; // 是否已发送
  _retryCount?: number; // 重试次数

  // 扩展字段
  [key: string]: unknown;
}
```

### EventType

```typescript
type EventType = 'track' | 'page' | 'error' | 'identify' | 'custom';
```

### Platform

```typescript
type Platform =
  | 'web'
  | 'miniapp-weixin'
  | 'miniapp-alipay'
  | 'miniapp-baidu'
  | 'miniapp-toutiao'
  | 'nodejs';
```

### Plugin

```typescript
interface Plugin {
  name: string;
  priority?: number;

  onLoad?(context: PluginContext): void | Promise<void>;
  onEvent?(event: TraceEvent): TraceEvent | void;
  onError?(error: Error): void;
  onReport?(events: TraceEvent[]): TraceEvent[];
  onUnload?(): void;
}
```

### DeviceInfo

```typescript
interface DeviceInfo {
  deviceId: string; // 设备唯一标识
  platform: Platform; // 平台类型
  userAgent?: string; // User Agent
  screenWidth?: number; // 屏幕宽度
  screenHeight?: number; // 屏幕高度
  os?: string; // 操作系统
  osVersion?: string; // 系统版本
  browser?: string; // 浏览器名称
  browserVersion?: string; // 浏览器版本
  language?: string; // 语言
  timezone?: string; // 时区
  networkType?: string; // 网络类型
  appVersion?: string; // 应用版本
  sdkVersion?: string; // SDK 版本
  channel?: string; // 渠道来源
  [key: string]: unknown; // 扩展字段
}
```

### 工具函数

SDK 导出以下工具函数：

```typescript
import {
  generateId, // 生成唯一 ID
  randomString, // 生成随机字符串
  uuid, // 生成 UUID
  shortId, // 生成短 ID
  SessionManager, // 会话管理器
  getSessionManager, // 获取会话管理器实例
  parseStackFrames, // 解析错误堆栈
  parseError, // 解析错误对象
  getErrorMessage, // 获取错误信息
  categorizeError, // 错误分类
} from '@traceflow/sdk';
```

---

## CDN 构建

### 构建产物

| 平台         | 文件名                   | 大小 (gzip) | 说明            |
| ------------ | ------------------------ | ----------- | --------------- |
| Web          | `trace-sdk.iife.js`      | ~12 KB      | 含 Web 官方插件 |
| Web          | `trace-sdk.es.js`        | ~19 KB      | ESM 格式        |
| Web          | `trace-sdk.cjs.js`       | ~13 KB      | CJS 格式        |
| 微信小程序   | `trace-sdk.weixin.*.js`  | ~8 KB       | -               |
| 支付宝小程序 | `trace-sdk.alipay.*.js`  | ~8 KB       | -               |
| 百度小程序   | `trace-sdk.baidu.*.js`   | ~8 KB       | -               |
| 字节小程序   | `trace-sdk.toutiao.*.js` | ~8 KB       | -               |
| Node.js      | `trace-sdk.nodejs.*.js`  | ~12 KB      | CJS/ESM 格式    |

### CDN 引入

**unpkg**

```html
<script src="https://unpkg.com/@traceflow/sdk@0.1.0/dist/trace-sdk.iife.js"></script>
```

**jsDelivr**

```html
<script src="https://cdn.jsdelivr.net/npm/@traceflow/sdk@0.1.0/dist/trace-sdk.iife.js"></script>
```

### 全局变量

CDN 引入后，通过 `window.TraceSDK` 访问：

```typescript
// 初始化
TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
}).then((sdk) => {
  // 使用 SDK
  sdk.track('event', { key: 'value' });
});
```

### 本地构建

```bash
# 构建所有平台
npm run build:all

# 按平台构建
npm run build:web       # Web
npm run build:weixin     # 微信小程序
npm run build:alipay     # 支付宝小程序
npm run build:baidu      # 百度小程序
npm run build:toutiao    # 字节小程序
npm run build:nodejs     # Node.js
```

---

## FAQ

### Q: SDK 是否会阻塞页面加载？

不会。TraceFlow SDK 内部使用异步机制，不会阻塞主线程。批量上报和重试机制也采用异步实现，对页面性能影响极小。

### Q: 如何调试 SDK？

启用调试模式：

```typescript
const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
  debug: true,
});
```

调试模式下，SDK 会在控制台输出详细日志。

### Q: 事件丢失如何处理？

TraceFlow 内置以下机制保证事件可靠性：

1. **本地缓存**：事件先存入本地存储，上报成功后再删除
2. **批量上报**：积累一定数量后批量发送，减少请求次数
3. **智能重试**：上报失败后自动重试（最多 3 次）
4. **离线支持**：断网时缓存事件，恢复后自动发送

### Q: 如何自定义上报逻辑？

通过 `networkAdapter` 自定义：

```typescript
import { WebNetworkAdapter } from '@traceflow/sdk';

class CustomNetworkAdapter extends WebNetworkAdapter {
  async send(event) {
    // 自定义上报逻辑
    await fetch('/custom-track', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }
}

const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',
  networkAdapter: new CustomNetworkAdapter({ serverUrl: '...' }),
});
```

### Q: 小程序中如何处理域名校验？

小程序需要将上报域名添加到合法域名列表中。SDK 默认使用 `serverUrl` 配置的地址进行请求。

### Q: 如何实现采样？

```typescript
const sdk = await TraceSDK.init({
  appId: 'your_app_id',
  serverUrl: 'https://your-server.com/track',

  samplingConfig: {
    rate: 0.5, // 全局采样 50%
    byEventType: {
      error: 1, // 错误 100% 采集
      track: 0.1, // 行为事件 10% 采样
    },
    consistentByUser: true, // 相同用户结果一致
  },
});
```

---

## 更新日志

### v0.1.0 (2026-04)

- 初始版本发布
- 支持 Web、微信/支付宝/百度/字节小程序、Node.js
- 内置插件系统
- 提供 WebErrorPlugin、WebPageViewPlugin、WebClickPlugin、WebPerformancePlugin 四个官方插件
