#!/bin/bash
# 카페24 비즈니스 — 코드 배포/업데이트 (2GB RAM: 빌드 순차 실행)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Backend"
cd backend
npm ci
if [ ! -d node_modules/express ]; then
  echo "ERROR: backend dependencies missing (express not found). Run: cd backend && npm ci"
  exit 1
fi
npx prisma generate
npm run build
echo "==> DB 스키마 동기화"
MIGRATION_DIRS=$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
if [ "${MIGRATION_DIRS}" -gt 0 ]; then
  npx prisma migrate deploy
else
  echo "    (migrations 없음 → db push 사용)"
  npx prisma db push || {
    echo "ERROR: prisma db push 실패 — 로그인 500 원인. 수동: bash deploy/cafe24-business/fix-db-login.sh"
    exit 1
  }
fi
cd ..

echo "==> Frontend (메모리 절약: NODE_OPTIONS 제한)"
cd frontend
npm ci
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build
cd ..

echo "==> Server (통합 Express + Next)"
cd server
npm ci
npm run build
cd ..

echo "==> PM2 재시작 (crypto 단일 프로세스 :3000)"
pm2 delete crypto-api crypto-web 2>/dev/null || true
pm2 delete crypto 2>/dev/null || true
pm2 start deploy/cafe24-business/ecosystem.config.cjs
pm2 save

echo "==> 배포 완료"
pm2 status
curl -sf http://127.0.0.1:3000/health && echo " health OK" || echo " health check failed"
curl -sf -o /dev/null http://127.0.0.1:3000/login && echo " web OK" || echo " web check failed"
