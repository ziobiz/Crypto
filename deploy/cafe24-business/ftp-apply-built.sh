#!/bin/bash
# FTP로 빌드 산출물(dist, .next)만 올린 경우 (로컬 PC에서 빌드 후)
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/ftp-apply-built.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=============================================="
echo " FTP 재배포 적용 (빌드 산출물만 — 서버 빌드 생략)"
echo "=============================================="

if [ ! -f backend/dist/index.js ]; then
  echo "ERROR: backend/dist/index.js 없음 — 로컬에서 npm run build 후 dist/ 업로드"
  exit 1
fi

if [ ! -d frontend/.next ]; then
  echo "ERROR: frontend/.next 없음 — 로컬에서 npm run build 후 .next/ 업로드"
  exit 1
fi

echo "==> Backend runtime deps + Prisma"
cd backend
npm ci --omit=dev
npx prisma generate
MIGRATION_DIRS=$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
if [ "${MIGRATION_DIRS}" -gt 0 ]; then
  npx prisma migrate deploy
else
  npx prisma db push
fi
cd ..

echo "==> Frontend runtime deps"
cd frontend
npm ci --omit=dev
cd ..

echo "==> PM2 재시작"
pm2 delete crypto-api crypto-web 2>/dev/null || true
pm2 start deploy/cafe24-business/ecosystem.config.cjs
pm2 save

pm2 status
curl -sf http://127.0.0.1:4000/health && echo " API OK" || echo " API check failed"
curl -sf -o /dev/null http://127.0.0.1:3000 && echo " Web OK" || echo " Web check failed"
