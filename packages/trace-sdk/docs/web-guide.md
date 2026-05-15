# TraceFlow Web SDK 使用指南

本文说明如何在 Web 项目中接入 `@traceflow/sdk/web`，并把行为、页面、错误和性能事件上报到 TraceFlow 后端采集接口。

## 安装

```bash
npm install @traceflow/sdk
```

如果使用 pnpm：

```bash
pnpm add @traceflow/sdk
```

## 快速开始

```ts
import { initWeb } from '@traceflow/sdk/web';

const sdk = await initWeb({
  appId: 'your-app-id',
  baseUrl: 'https://trace.example.com/api/v1',
});

sdk.setUserId('user-123');
sdk.page();
sdk.track('button_click', {
  buttonName: 'submit',
});
```

`baseUrl` 会自动拼接 `/collect`，最终请求地址为：

```text
https://trace.example.com/api/v1/collect
```

也可以直接传入完整采集地址：

```ts
const sdk = await initWeb({
  appId: 'your-app-id',
  serverUrl: 'https://trace.example.com/api/v1/collect',
});
```

`baseUrl` 和 `serverUrl` 二选一即可。如果两者都传，SDK 优先使用 `baseUrl`。

## 推荐初始化配置

```ts
import { initWeb, WebTestClickPlugin } from '@traceflow/sdk/web';

const sdk = await initWeb({
  appId: 'web-demo',
  baseUrl: 'https://trace.example.com/api/v1',
  platform: 'web',

  reportConfig: {
    batchSize: 10,
    flushInterval: 3000,
  },

  samplingConfig: {
    rate: 1,
    byEventType: {
      behavior: 1,
      performance: 0.5,
      error: 1,
    },
    consistentByUser: true,
  },

  storageConfig: {
    enabled: true,
    prefix: 'trace_',
    expire: 7 * 24 * 60 * 60 * 1000,
    maxSize: 1000,
  },

  web: {
    useBeaconOnUnload: true,
    beaconQueueStrategy: 'keep-for-retry',
  },

  beforeSend(event) {
    if (event.data?.eventName === 'debug_event') {
      return false;
    }
    return event;
  },

  onReportFail(event, error) {
    console.warn('[TraceFlow] report failed', event.msgId, error);
  },
});

sdk.use(new WebTestClickPlugin());
```

## 初始化参数

| 字段              | 类型                                | 必填 | 说明                                                 |
| ----------------- | ----------------------------------- | ---- | ---------------------------------------------------- |
| `appId`           | `string`                            | 是   | 应用标识，会随每批事件一起上报。                     |
| `baseUrl`         | `string`                            | 否   | REST API 基础地址，SDK 会请求 `${baseUrl}/collect`。 |
| `serverUrl`       | `string`                            | 否   | 完整采集接口地址。未配置 `baseUrl` 时使用。          |
| `platform`        | `string`                            | 否   | 平台标识，Web 项目建议传 `web`。                     |
| `debug`           | `boolean`                           | 否   | 调试开关，保留配置项。                               |
| `reportConfig`    | `ReportConfig`                      | 否   | 批量上报配置。                                       |
| `samplingConfig`  | `SamplingConfig`                    | 否   | 采样配置。                                           |
| `storageConfig`   | `StorageConfig`                     | 否   | 本地队列和设备 ID 存储配置。                         |
| `web`             | `WebOptions`                        | 否   | Web 专用配置。                                       |
| `beforeSend`      | `(event) => event \| false \| void` | 否   | 上报前处理事件；返回 `false` 丢弃事件。              |
| `onReportSuccess` | `(event) => void`                   | 否   | 单个事件成功发送后的回调。                           |
| `onReportFail`    | `(event, error) => void`            | 否   | 单个事件最终发送失败后的回调。                       |
| `onReady`         | `() => void`                        | 否   | SDK 初始化完成回调。                                 |
| `networkAdapter`  | `INetworkAdapter`                   | 否   | 自定义网络适配器。                                   |
| `storageAdapter`  | `IStorageAdapter`                   | 否   | 自定义存储适配器。                                   |

### reportConfig

| 字段            | 类型     | 默认值 | 说明                                                                                               |
| --------------- | -------- | ------ | -------------------------------------------------------------------------------------------------- |
| `batchSize`     | `number` | `10`   | 队列达到该数量后触发批量上报。建议取值 `1-100`，不要超过后端 `/collect` 单次接收的 `events` 上限。 |
| `flushInterval` | `number` | `3000` | 定时批量上报间隔，单位毫秒。                                                                       |
| `maxRetries`    | `number` | `3`    | 类型保留配置项；当前内部重试策略默认最多重试 3 次。                                                |
| `retryInterval` | `number` | `1000` | 类型保留配置项；当前内部重试策略默认从 1000ms 开始指数退避。                                       |

### samplingConfig

| 字段               | 类型                                 | 默认值 | 说明                                         |
| ------------------ | ------------------------------------ | ------ | -------------------------------------------- |
| `rate`             | `number`                             | `1`    | 全局采样率，取值范围 `0` 到 `1`。            |
| `byEventType`      | `Partial<Record<EventType, number>>` | `{}`   | 按事件类型设置采样率。                       |
| `consistentByUser` | `boolean`                            | `true` | 是否基于用户、事件类型和事件名做一致性采样。 |

错误事件和 `priority: 'critical'` 的事件不会被采样丢弃。

### storageConfig

| 字段      | 类型      | 默认值         | 说明                       |
| --------- | --------- | -------------- | -------------------------- |
| `enabled` | `boolean` | `false`        | 是否启用持久化事件队列。   |
| `prefix`  | `string`  | `trace_`       | Web Storage 键名前缀。     |
| `expire`  | `number`  | `7 天`         | 本地数据有效期，单位毫秒。 |
| `maxSize` | `number`  | 由队列实现决定 | 本地队列容量上限。         |

Web 端默认使用 `localStorage` 保存设备 ID。启用 `storageConfig.enabled` 后，普通事件队列也会尝试持久化，便于失败后重试。

### web

| 字段                  | 类型                                       | 默认值             | 说明                                                                     |
| --------------------- | ------------------------------------------ | ------------------ | ------------------------------------------------------------------------ |
| `useBeaconOnUnload`   | `boolean`                                  | `false`            | 页面隐藏或卸载时，是否使用 `navigator.sendBeacon` 尽力补发队列中的事件。 |
| `beaconQueueStrategy` | `'keep-for-retry' \| 'remove-on-accepted'` | `'keep-for-retry'` | `sendBeacon` 被浏览器接受后的队列处理策略。                              |

`sendBeacon` 返回 `true` 只表示浏览器接受了发送任务，不代表服务端一定处理成功。当前卸载期补发只会取当前普通上报批次，最多 `reportConfig.batchSize` 条事件，不保证清空全部 pending 队列。生产环境建议使用默认的 `keep-for-retry`，保留队列给后续正常上报继续重试。若业务更重视避免重复上报，可以改为 `remove-on-accepted`。

## API

### initWeb(config)

初始化 Web SDK。

```ts
import { initWeb } from '@traceflow/sdk/web';

const sdk = await initWeb({
  appId: 'web-demo',
  baseUrl: 'https://trace.example.com/api/v1',
});
```

### sdk.track(eventName, data?)

上报行为事件。事件类型为 `behavior`，`eventName` 会写入 `data.eventName`。

```ts
sdk.track('product_view', {
  productId: 'sku-001',
  price: 99,
});
```

### sdk.page(data?)

上报页面访问事件。事件类型为 `behavior`，默认事件名为 `page_view`。

```ts
sdk.page({
  pageName: 'Home',
});
```

未显式传入时，SDK 会尝试从浏览器环境补充：

| 字段        | 默认来源            |
| ----------- | ------------------- |
| `pageUrl`   | `location.href`     |
| `pageTitle` | `document.title`    |
| `referrer`  | `document.referrer` |

### sdk.error(error, context?)

上报错误事件。错误事件会立即上报，不进入普通批量等待。

```ts
try {
  throw new Error('load failed');
} catch (error) {
  sdk.error(error as Error, {
    module: 'product-list',
  });
}
```

也可以传字符串：

```ts
sdk.error('request timeout', {
  api: '/api/products',
});
```

### sdk.performance(metricName, data?)

上报性能事件。事件类型为 `performance`。

```ts
sdk.performance('api_latency', {
  api: '/api/products',
  duration: 128,
});
```

### sdk.setUserId(userId?)

设置或清空当前用户 ID。设置后新产生的事件会携带 `userId`。

```ts
sdk.setUserId('user-123');
sdk.setUserId(undefined);
```

### sdk.flush()

触发一次普通事件队列刷新。

```ts
await sdk.flush();
```

`flush()` 会尝试发送当前批次的普通事件；如果本次网络请求失败，事件会保留在队列中并按重试策略等待后续再次上报，`await sdk.flush()` 不代表服务端已经成功接收事件。建议在路由切换、关键流程完成、用户退出登录前主动调用。

### sdk.use(plugin)

注册插件。

```ts
import { WebTestClickPlugin } from '@traceflow/sdk/web';

sdk.use(
  new WebTestClickPlugin({
    eventName: 'test_click',
  }),
);
```

当前内置的 `WebTestClickPlugin` 只用于验证 Web 插件链路和后端 DTO，不建议当作完整点击采集方案直接用于生产精细化埋点。

### sdk.destroy()

销毁 SDK，停止定时上报并卸载插件。

```ts
sdk.destroy();
```

如果开启了 `web.useBeaconOnUnload`，`destroy()` 会同时移除页面生命周期监听。

## 上报协议

Web SDK 使用 `fetch` 发送 `POST` 请求。

### 请求地址

优先级如下：

1. 配置了 `baseUrl`：请求 `${baseUrl}/collect`
2. 未配置 `baseUrl`，配置了 `serverUrl`：请求 `serverUrl`

### 请求体

`events` 数组建议保持 `1-100` 条；不要把 `reportConfig.batchSize` 配置为超过 `100`，否则后端可能拒收本次请求。

```json
{
  "appId": "web-demo",
  "events": [
    {
      "msgId": "1710000000000-abc123",
      "deviceId": "device_1710000000000_xxx",
      "userId": "user-123",
      "eventTime": 1710000000000,
      "eventType": "behavior",
      "platform": "web",
      "userAgent": "Mozilla/5.0 ...",
      "os": "Windows",
      "browser": "Chrome",
      "data": {
        "eventName": "button_click",
        "buttonName": "submit"
      }
    }
  ]
}
```

发送前 SDK 会剥离内部字段，例如 `_createdAt`、`_retryCount`、`priority`。

### 事件字段

| 字段        | 类型                                     | 说明                                       |
| ----------- | ---------------------------------------- | ------------------------------------------ |
| `msgId`     | `string`                                 | 消息 ID，可用于后端去重。                  |
| `deviceId`  | `string`                                 | 设备 ID，Web 端默认保存在 `localStorage`。 |
| `userId`    | `string`                                 | 当前用户 ID。                              |
| `eventTime` | `number`                                 | 事件发生时间戳，单位毫秒。                 |
| `eventType` | `'behavior' \| 'performance' \| 'error'` | 事件类型。                                 |
| `platform`  | `string`                                 | 平台，Web 端通常为 `web`。                 |
| `userAgent` | `string`                                 | 浏览器 UA。                                |
| `os`        | `string`                                 | 操作系统识别结果。                         |
| `browser`   | `string`                                 | 浏览器识别结果。                           |
| `data`      | `Record<string, unknown>`                | 业务自定义数据。                           |

### 响应格式

SDK 支持后端返回 JSON：

```json
{
  "code": 200,
  "message": "ok",
  "data": null,
  "requestId": "req-xxx"
}
```

HTTP 状态码非 2xx 会视为网络失败。响应体为 JSON 且 `code` 不在 `[200, 299]` 时，会视为业务失败并进入失败处理。

## 插件开发

插件可以在事件创建后、批量上报前插入处理逻辑，也可以通过 `context.reportEvent` 主动创建事件。

```ts
import { BasePlugin } from '@traceflow/sdk/web';
import type { PluginContext, TraceEvent } from '@traceflow/sdk';

class AddCommonDataPlugin extends BasePlugin {
  name = 'add-common-data';
  priority = 10;

  onEvent(event: TraceEvent): TraceEvent {
    return {
      ...event,
      data: {
        ...event.data,
        release: '1.0.0',
      },
    };
  }

  onLoad(context: PluginContext): void {
    context.setUserId('user-from-plugin');
  }
}

sdk.use(new AddCommonDataPlugin());
```

插件常用钩子：

| 钩子               | 说明                                                 |
| ------------------ | ---------------------------------------------------- |
| `onLoad(context)`  | 插件加载时调用。                                     |
| `onEvent(event)`   | 单个事件进入上报管道前调用；返回 `void` 会丢弃事件。 |
| `onReport(events)` | 批量发送前调用，可统一处理事件数组。                 |
| `onError(error)`   | 调用 `sdk.error(Error)` 时触发。                     |
| `onUnload()`       | SDK 销毁时调用。                                     |

## 单页应用接入建议

### 路由切换

SDK 不会自动感知所有前端路由框架。SPA 项目建议在路由切换完成后手动调用 `page()`：

```ts
router.afterEach((to) => {
  sdk.page({
    pageName: String(to.name || ''),
    pageUrl: window.location.href,
  });
});
```

### 全局错误

可以把浏览器全局错误转成 SDK 错误事件：

```ts
window.addEventListener('error', (event) => {
  sdk.error(event.error || event.message, {
    source: 'window.error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  sdk.error(event.reason instanceof Error ? event.reason : String(event.reason), {
    source: 'unhandledrejection',
  });
});
```

### 页面关闭前补发

如果希望在页面隐藏或关闭时尽力补发队列事件，开启：

```ts
const sdk = await initWeb({
  appId: 'web-demo',
  baseUrl: 'https://trace.example.com/api/v1',
  web: {
    useBeaconOnUnload: true,
    beaconQueueStrategy: 'keep-for-retry',
  },
});
```

开启后 SDK 会监听：

| 事件               | 触发时机                       |
| ------------------ | ------------------------------ |
| `pagehide`         | 页面进入历史缓存、关闭或跳转。 |
| `visibilitychange` | 页面变为 `hidden`。            |

当前卸载期补发只会取一个普通上报批次，最多 `reportConfig.batchSize` 条事件。`beaconQueueStrategy` 为 `keep-for-retry` 时，即使浏览器接受了 beacon 任务，事件也会保留在队列中等待后续正常上报；为 `remove-on-accepted` 时，只会移除本次被浏览器接受的这批事件。

## 隐私与数据治理建议

- 不要在 `data` 中上传密码、Token、身份证、手机号等敏感信息。
- 使用 `beforeSend` 做统一脱敏、字段裁剪或黑名单过滤。
- 对高频行为事件设置合理采样率，避免不必要的网络和存储开销。
- 后端应使用 `msgId` 做幂等处理，因为失败重试和 `sendBeacon` 都可能带来重复投递。

示例：

```ts
const sdk = await initWeb({
  appId: 'web-demo',
  baseUrl: 'https://trace.example.com/api/v1',
  beforeSend(event) {
    const data = { ...event.data };
    delete data.password;
    delete data.token;

    return {
      ...event,
      data,
    };
  },
});
```

## 常见问题

### 上报地址到底该传哪个？

优先使用 `baseUrl`，例如 `https://trace.example.com/api/v1`。SDK 会自动请求 `/collect`。只有在后端采集路径不符合该约定时，才使用 `serverUrl` 传完整地址。

### 为什么普通事件没有立刻发出去？

普通行为和性能事件默认进入批量队列。队列达到 `batchSize` 或等待到 `flushInterval` 后才发送。错误事件和 `priority: 'critical'` 的事件会立即发送。

### `sendBeacon` 成功后为什么还可能重复？

`navigator.sendBeacon` 的返回值只代表浏览器接受发送任务，不能确认服务端处理成功。默认策略 `keep-for-retry` 会保留队列，因此后续可能再次上报同一批事件。后端需要用 `msgId` 去重。

### SSR 环境能不能导入？

Web 入口中的存储单例使用延迟初始化，设备信息采集也会判断 `navigator` 是否存在。但实际初始化 Web SDK 仍建议放在浏览器侧执行，避免服务端环境没有 `localStorage`、`fetch` 等 Web API。

### 如何确认事件已经发出？

可以使用浏览器 DevTools 查看采集接口请求，也可以配置 `onReportSuccess` 和 `onReportFail`：

```ts
const sdk = await initWeb({
  appId: 'web-demo',
  baseUrl: 'https://trace.example.com/api/v1',
  onReportSuccess(event) {
    console.log('reported', event.msgId);
  },
  onReportFail(event, error) {
    console.warn('report failed', event.msgId, error);
  },
});
```
