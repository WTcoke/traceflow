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
traceflow-server/
├── .env                      # 环境变量（本地）
├── .env.production           # 环境变量（生产）
├── .eslintrc.js              # ESLint 配置
├── .prettierrc               # 代码格式化
├── nest-cli.json             # Nest CLI 配置
├── package.json
├── tsconfig.json             # TS 配置
├── prisma/                   # Prisma ORM
│   ├── schema.prisma         # 数据表定义（项目/用户/埋点/告警/AI结果）
│   └── migrations/           # 数据库迁移文件
├── src/
│   ├── main.ts               # 项目入口
│   ├── app.module.ts         # 根模块
│   ├── config/               # 全局配置
│   │   ├── configuration.ts   # 配置加载
│   │   ├── database.config.ts # MySQL/Redis 配置
│   │   └── swagger.config.ts # 接口文档配置
│   ├── common/                # 全局通用模块
│   │   ├── decorators/        # 自定义装饰器
│   │   ├── filters/           # 异常过滤器
│   │   ├── guards/            # 鉴权守卫（JWT/项目密钥）
│   │   ├── interceptors/      # 响应拦截/日志拦截
│   │   ├── middleware/        # 跨域/限流中间件
│   │   └── utils/             # 工具函数（加密/脱敏/时间）
│   ├── core/                  # 核心底层服务
│   │   ├── prisma/            # Prisma 模块
│   │   ├── redis/             # Redis 模块（缓存/限流/队列）
│   │   ├── logger/            # Winston 日志
│   │   └── bullmq/            # 异步队列（清洗/AI任务/归档）
│   ├── modules/               # 业务模块（核心）
│   │   ├── auth/              # 登录鉴权模块
│   │   ├── user/              # 用户/角色/权限
│   │   ├── project/           # 项目管理/密钥/采样率
│   │   ├── collect/           # 埋点上报（高并发核心）
│   │   ├── buried-point/      # 埋点数据查询/统计/清洗
│   │   ├── alarm/             # 监控告警/阈值/推送
│   │   ├── ai/                # AI对接/数据同步/异常检测
│   │   └── monitor/           # 服务监控/健康检查
│   ├── api/                   # 对外接口层（可选，统一路由）
│   └── filters/               # 全局异常处理
├── test/                      # 单元测试/e2e测试
└── README.md                  # 项目说明
```
