#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping development services..."

# Kill NestJS dev server (Windows compatible)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping NestJS..."
if command -v pkill &> /dev/null; then
  pkill -f "nest start" 2>/dev/null || true
  pkill -f "node.*main.js" 2>/dev/null || true
else
  # Windows: use taskkill
  taskkill //F //IM node.exe 2>/dev/null || true
fi

# Stop docker-compose
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping Docker Compose..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] All services stopped."
