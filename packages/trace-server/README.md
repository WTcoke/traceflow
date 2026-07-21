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

## 项目结构

```
traceflow-server/
├── .env                      # 环境变量（本地）
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
│   │   ├── pipes/             # 校验管道
│   │   ├── interceptors/      # 响应拦截/日志拦截
│   │   ├── middleware/        # 跨域/限流中间件
│   │   └── utils/            # 工具：UA解析、IP解析、加密等
│   ├── core/                  # 核心底层服务
│   │   ├── prisma/            # Prisma 模块
│   │   ├── redis/             # Redis 模块（缓存/限流/队列）
│   │   ├── logger/            # Winston 日志
│   │   └── bullmq/            # 异步队列（清洗/AI任务/归档）
│   ├── modules/               # 业务模块（核心）
│   │   ├── auth/              # 登录鉴权模块
│   │   ├── system/            # 用户、角色、日志模块
│   │   ├── project/           # 项目管理/密钥/采样率
│   │   ├── collect/           # 埋点上报（高并发核心）
│   │   ├── statistics/        # 聚合统计模块
│   │   ├── behavior/          # 行为监控（用户行为/页面跳转/点击/访问轨迹）
│   │   ├── performance/       # 性能监控（加载/耗时/白屏/卡顿/资源）
│   │   ├── error/             # 错误监控（JS错误/Promise/接口/资源失败）
│   │   ├── alarm/             # 监控告警/阈值/推送
│   │   ├── ai/                # AI对接/数据同步/异常检测
│   │   └── monitor/           # 服务监控/健康检查
│   ├── api/                   # 对外接口层（可选，统一路由）
│   └── filters/               # 全局异常处理
├── test/                      # 单元测试/e2e测试
└── README.md                  # 项目说明
```

## 核心业务模块说明

### 1. Behavior 行为监控模块

**功能**：

- 用户行为轨迹追踪（鼠标移动、滚动、输入）
- 页面访问记录和访问时长统计
- 点击事件、自定义事件上报
- 会话（Session）管理和用户识别
- 用户路径分析和转化漏斗

**目录结构**：

```
behavior/
├── dto/               # 入参校验
├── entities/          # 类型/实体
├── behavior.module.ts
├── behavior.controller.ts   # 查询接口
└── behavior.service.ts      # 行为分析逻辑
```

### 2. Performance 性能监控模块

**功能**：

- 页面加载性能监控（FP/FCP/LCP/CLS 指标）
- 请求耗时、接口慢查询监控
- 资源加载监控（JS/CSS/Image 等）
- 白屏检测和首屏加载时间
- 卡顿、长任务（Long Task）监控
- 性能评分、趋势分析

**目录结构**：

```
performance/
├── dto/               # 入参校验
├── entities/          # 类型/实体
├── performance.module.ts
├── performance.controller.ts # 查询接口
└── performance.service.ts    # 性能分析逻辑
```

### 3. Error 错误监控模块

**功能**：

- JS 错误捕获（uncaught error）
- Promise 未捕获异常处理
- HTTP 接口错误监控（4xx/5xx）
- 资源加载失败监控（脚本、样式表等）
- 错误聚合、去重和分组
- 错误详情、堆栈轨迹和源码映射

**目录结构**：

```
error/
├── dto/               # 入参校验
├── entities/          # 类型/实体
├── error.module.ts
├── error.controller.ts  # 查询接口
└── error.service.ts     # 错误分析逻辑
```

docker compose up -d
