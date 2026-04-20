# TraceFlow Server

埋点采集服务 - NestJS + Prisma + MySQL

## 快速开始

### 1. 安装依赖

```bash
pnpm install
pnpm prisma generate
```

### 2. 配置数据库

复制 `.env.example` 为 `.env`，修改 `DATABASE_URL`：

```env
DATABASE_URL="mysql://user:password@localhost:3306/traceflow"
PORT=3000
NODE_ENV=development
```

### 3. 创建数据库

```sql
CREATE DATABASE traceflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 执行迁移

```bash
# 方式一：使用 Prisma Migrate
pnpm prisma migrate dev --name init

# 方式二：手动执行 SQL
mysql -u user -p traceflow < prisma/migrations/001_init.sql
```

### 5. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start:prod
```

## API 接口

### POST /api/track - 单条事件上报

```json
{
  "eventId": "uuid-xxx",
  "eventType": "track",
  "timestamp": 1713001234567,
  "anonymousId": "anon-123",
  "sessionId": "sess-456",
  "deviceInfo": {
    "deviceId": "device-001",
    "platform": "web"
  }
}
```

### POST /api/track/batch - 批量事件上报

```json
{
  "events": [{ ... }, { ... }]
}
```

### GET /api/track/:id - 查询事件

### GET /api/track/analytics/simple-stats - 简单统计

查询参数：`startTime`, `endTime`, `userId`, `eventType`

## 项目结构

```
src/
├── main.ts                    # 入口
├── app.module.ts              # 根模块
├── modules/track/             # 埋点模块
│   ├── track.controller.ts    # HTTP 接口
│   ├── track.service.ts       # 业务逻辑
│   └── dto/                   # 数据传输对象
├── prisma/                    # Prisma 服务
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── common/                    # 公共模块
    ├── filters/               # 异常过滤器
    ├── interceptors/          # 拦截器
    └── decorators/            # 装饰器
```
