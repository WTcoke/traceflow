# TraceFlow Full-Link Tracing Platform

TraceFlow is a full-link tracing and monitoring system.

## Project Structure

- `packages/trace-sdk`: Client-side SDK (TypeScript)
- `packages/trace-server`: Backend for data collection & analysis (Node.js/Express)
- `packages/trace-admin`: Visual management/dashboard (React/Vite)

## Development

### Prerequisites

- Node.js >= 20
- pnpm >= 8

### Setup

```bash
# Install dependencies
pnpm install

# Run dev mode for all packages
pnpm dev
```

### Git Workflow

1. Create a feature branch
2. Commit your changes
3. Open a Pull Request

## Technology Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Echarts
- **Backend**: Express + TypeScript + MongoDB/MySQL (Planned)
- **SDK**: Vanilla TypeScript
