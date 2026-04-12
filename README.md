# TraceFlow 全链路埋点监控平台

TraceFlow 是一个面向前端、后端和管理端的全链路埋点与监控平台，当前仓库采用 Monorepo 结构，便于多人协作和模块化开发。

## 项目结构

- `packages/trace-sdk`：埋点 SDK，负责数据采集、插件扩展和沙箱隔离
- `packages/trace-server`：后端服务，基于 NestJS，负责埋点数据接收、处理和分析
- `packages/trace-admin`：可视化管理平台，负责数据展示、配置管理和运营分析

## 开发环境

### 依赖要求

- Node.js >= 20
- pnpm >= 8

### 本地启动

```bash
# 安装依赖
pnpm install

# 启动所有包的开发模式
pnpm dev
```

### 常用命令

- `pnpm dev`：启动开发模式
- `pnpm build`：构建所有包
- `pnpm test`：运行所有测试
- `pnpm lint`：执行代码检查
- `pnpm format`：格式化代码

### Git 提交流程

1. 基于主分支创建功能分支
2. 完成开发后提交代码
3. 提交 Pull Request 进行评审

## 技术栈

- **工程管理**：pnpm workspaces
- **前端管理后台**：React + Vite + Echarts + TS
- **后端服务**：NestJS + TypeScript
- **埋点 SDK**：TypeScript
