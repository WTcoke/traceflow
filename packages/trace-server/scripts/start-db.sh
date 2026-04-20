#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting MySQL container..."
docker-compose up -d

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for MySQL to be ready..."
sleep 5

# Wait for MySQL to be healthy
for i in {1..30}; do
  if docker exec traceflow-mysql mysqladmin ping -h localhost -u root -prootpassword --silent 2>/dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MySQL is ready!"
    exit 0
  fi
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for MySQL... ($i/30)"
  sleep 2
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] MySQL failed to start within 60 seconds"
exit 1
