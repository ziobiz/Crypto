#!/bin/bash
# 로컬에서 빌드한 산출물을 FTP로 올린 뒤 서버에서 실행 (NOTI식 — 서버 빌드 없음)
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/ftp-apply-built.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=============================================="
echo " 재배포 (빌드 산출물 — 서버 next/tsc 생략)"
echo " ROOT: $ROOT"
echo "=============================================="

for f in backend/dist/index.js server/dist/index.js frontend/.next/BUILD_ID; do
  if [ ! -f "$f" ] && [ ! -e "$f" ]; then
    echo "ERROR: $f 없음"
    echo "로컬 PC에서: bash deploy/local-build.sh 후 FTP 업로드"
    exit 1
  fi
done

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env 없음 (서버 전용 — FTP로 덮어쓰지 말 것)"
  exit 1
fi

echo "==> Backend runtime + Prisma"
cd backend
npm ci --omit=dev
npx prisma generate
MIGRATION_DIRS=$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
if [ "${MIGRATION_DIRS}" -gt 0 ]; then
  npx prisma migrate deploy
else
  npx prisma db push || {
    echo "ERROR: prisma db push 실패"
    exit 1
  }
fi
cd ..

echo "==> Frontend runtime (Next)"
cd frontend
npm ci --omit=dev
cd ..

echo "==> Server runtime"
cd server
npm ci --omit=dev
cd ..

echo "==> PM2 (통합 crypto 1개)"
pm2 delete crypto-api crypto-web 2>/dev/null || true
pm2 delete crypto 2>/dev/null || true
pm2 start deploy/cafe24-business/ecosystem.config.cjs
pm2 save

pm2 status
curl -sf http://127.0.0.1:3000/health && echo " health OK" || echo " health check failed"
curl -sf -o /dev/null http://127.0.0.1:3000/login && echo " web OK" || echo " web check failed"

echo ""
echo "완료: https://api.tinpass.com"
