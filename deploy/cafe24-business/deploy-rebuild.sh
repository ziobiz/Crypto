#!/bin/bash
# 의존성 설치 생략 — 소스만 재빌드 (npm ci 실패·중단 후 재시도용)
#   bash deploy/cafe24-business/deploy-rebuild.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

need_modules() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ] || [ ! -f "$dir/node_modules/.package-lock.json" ]; then
    echo "ERROR: $dir/node_modules 없음 — 먼저: bash deploy/cafe24-business/deploy-install.sh"
    exit 1
  fi
}

need_modules backend
need_modules frontend
need_modules server

echo "==> Backend build"
cd backend
npx prisma generate
npm run build
cd ..

echo "==> Frontend build"
cd frontend
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"
npm run build
cd ..

echo "==> Server build"
cd server
npm run build
cd ..

echo "==> PM2 재시작"
pm2 restart crypto
sleep 2
pm2 status
curl -sf http://127.0.0.1:3000/health && echo " health OK"
