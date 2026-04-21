# TraceFlow 埋点系统

NestJS + Prisma + MySQL 埋点事件采集服务

## 技术栈

- **框架**: NestJS 10.x
- **ORM**: Prisma 5.x
- **数据库**: MySQL 8.0
- **文档**: Swagger (OpenAPI 3.0)

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动数据库

```bash
pnpm db:up
```

### 3. 执行迁移

```bash
pnpm prisma migrate dev --name init
```

### 4. 启动服务

```bash
pnpm dev
```

服务地址: http://localhost:3000/api
Swagger文档: http://localhost:3000/api/docs

## 环境变量

```env
DATABASE_URL="mysql://root:rootpassword@localhost:3306/traceflow"
PORT=3000
NODE_ENV=development
```

## API 接口

### 1. 单条事件上报

**POST** `/api/track`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "track",
  "eventName": "button_click",
  "timestamp": 1713001234567,
  "userId": "user-123",
  "anonymousId": "anon-456",
  "sessionId": "sess-789",
  "deviceInfo": {
    "deviceId": "device-001",
    "platform": "web",
    "userAgent": "Mozilla/5.0...",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "os": "Windows",
    "osVersion": "10",
    "browser": "Chrome",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai"
  },
  "url": "https://example.com/page",
  "title": "首页",
  "referrer": "https://google.com",
  "properties": { "buttonName": "提交" },
  "priority": "normal"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "eventId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 2. 批量事件上报

**POST** `/api/track/batch`

```json
{
  "events": [
    {
      /* 事件1 */
    },
    {
      /* 事件2 */
    }
  ]
}
```

最多100条

**响应**

```json
{
  "success": true,
  "data": {
    "accepted": 98,
    "rejected": 2,
    "errors": []
  }
}
```

---

### 3. 查询事件

**GET** `/api/track/{id}`

| 参数   | 类型   | 说明                      |
| ------ | ------ | ------------------------- |
| id     | string | 事件ID                    |
| idType | string | `eventId`(默认) 或 `dbId` |

**响应**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "page",
    "eventName": null,
    "timestamp": "1713001234567",
    "userId": "user-123",
    "anonymousId": "anon-456",
    "sessionId": "sess-789",
    "url": "https://example.com/page",
    "title": "首页",
    "referrer": "https://google.com",
    "deviceInfo": { "deviceId": "device-001", "platform": "web" },
    "properties": { "key": "value" },
    "priority": "normal",
    "createdAt": "1713001235000"
  }
}
```

---

### 4. 简单统计

**GET** `/api/track/analytics/simple-stats`

| 参数      | 类型   | 必填 | 说明           |
| --------- | ------ | ---- | -------------- |
| startTime | number | 是   | 开始时间戳(ms) |
| endTime   | number | 是   | 结束时间戳(ms) |
| userId    | string | 否   | 按用户筛选     |
| eventType | string | 否   | 按事件类型筛选 |

**响应**

```json
{
  "success": true,
  "data": {
    "totalEvents": 1234567,
    "byEventType": {
      "track": 500000,
      "page": 600000,
      "error": 100000,
      "identify": 34567,
      "custom": 0
    },
    "byPlatform": {
      "web": 800000,
      "miniapp-weixin": 400000
    },
    "uniqueUsers": 50000,
    "uniqueSessions": 120000
  }
}
```

---

## 字段说明

### 事件类型 (eventType)

| 值       | 说明       |
| -------- | ---------- |
| track    | 自定义事件 |
| page     | 页面浏览   |
| error    | 错误事件   |
| identify | 用户身份   |
| custom   | 自定义     |

### 平台类型 (platform)

| 值              | 说明          |
| --------------- | ------------- |
| web             | Web端         |
| miniapp-weixin  | 微信小程序    |
| miniapp-alipay  | 支付宝小程序  |
| miniapp-baidu   | 百度小程序    |
| miniapp-toutiao | 字节小程序    |
| nodejs          | Node.js服务端 |

### 优先级 (priority)

| 值       | 说明     |
| -------- | -------- |
| critical | 高优先级 |
| normal   | 普通     |
| low      | 低优先级 |

---

## 数据库

### 表结构

```sql
trace_events
├── id                    -- 自增主键
├── event_id              -- 客户端UUID (唯一索引)
├── event_type            -- 事件类型
├── event_name            -- 事件名称
├── timestamp             -- 事件时间
├── user_id               -- 用户ID (索引)
├── anonymous_id          -- 匿名ID (索引)
├── session_id            -- 会话ID (索引)
├── url                   -- 页面URL
├── title                 -- 页面标题
├── referrer              -- 来源
├── device_info           -- JSON 设备信息
├── properties            -- JSON 自定义属性
├── priority              -- 优先级
├── _sent                 -- 发送标志
├── _retry_count          -- 重试次数
└── _created_at           -- 服务端创建时间
```

### 索引

| 索引名                | 字段                  | 类型 |
| --------------------- | --------------------- | ---- |
| uk_event_id           | event_id              | 唯一 |
| idx_timestamp         | timestamp             | 普通 |
| idx_user_id           | user_id               | 普通 |
| idx_anonymous_id      | anonymous_id          | 普通 |
| idx_session_id        | session_id            | 普通 |
| idx_event_type        | event_type            | 普通 |
| idx_priority          | priority              | 普通 |
| idx_user_timestamp    | user_id, timestamp    | 联合 |
| idx_session_timestamp | session_id, timestamp | 联合 |

---

## 脚本命令

```bash
pnpm db:up        # 启动数据库
pnpm db:down      # 停止数据库
pnpm db:restart   # 重启数据库
pnpm dev          # 开发模式 (自动启动数据库)
pnpm build        # 构建
pnpm start:prod   # 生产模式
pnpm prisma:generate  # 生成Prisma Client
pnpm prisma:migrate   # 执行迁移
pnpm prisma:studio    # 打开Prisma Studio
```

---

## 项目结构

```
src/
├── main.ts                      # 入口
├── app.module.ts                # 根模块
├── modules/track/
│   ├── track.controller.ts       # HTTP接口
│   ├── track.service.ts          # 业务逻辑
│   └── dto/                      # DTO定义
│       ├── create-track.dto.ts
│       ├── batch-track.dto.ts
│       └── track-query.dto.ts
├── prisma/
│   ├── prisma.service.ts         # Prisma服务
│   └── prisma.module.ts
└── common/
    ├── filters/                   # 异常过滤
    ├── interceptors/              # 拦截器
    └── decorators/                # 装饰器
```

---

## 演进路线

### V1 (当前)

NestJS + Prisma + MySQL

适用规模: < 10万/日

### V2

- Redis + BullMQ

适用规模: 10-100万/日

改进: 异步写入、批量消费、失败重试

### V3

- Kafka + ClickHouse

适用规模: > 100万/日

改进: 实时分析、复杂查询、冷热分离
