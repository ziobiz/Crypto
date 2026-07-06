#!/bin/bash
# Deploy pre-built artifacts (no next/tsc on server)
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/ftp-apply-built.sh
#
set -euo pipefail

on_err() {
  echo "ERROR: failed at line $1 (exit $?)"
  exit 1
}
trap 'on_err $LINENO' ERR

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=============================================="
echo " Deploy built artifacts (no server build)"
echo " ROOT: $ROOT"
echo "=============================================="

for f in backend/dist/index.js server/dist/index.js frontend/.next/BUILD_ID; do
  if [ ! -f "$f" ] && [ ! -e "$f" ]; then
    echo "ERROR: missing $f"
    echo "Run on PC: powershell -File deploy\\pack-release.ps1"
    exit 1
  fi
done

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env missing (server only)"
  exit 1
fi

echo "==> [1/4] Backend runtime + Prisma"
cd backend
npm ci --omit=dev --ignore-scripts
echo "    prisma generate..."
npx prisma generate
echo "    db push..."
MIGRATION_DIRS=0
if [ -d prisma/migrations ]; then
  MIGRATION_DIRS=$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
fi
if [ "${MIGRATION_DIRS:-0}" -gt 0 ]; then
  npx prisma migrate deploy
else
  npx prisma db push --accept-data-loss
fi
echo "    backend OK"
cd ..

echo "==> [2/4] Frontend runtime"
cd frontend
npm ci --omit=dev --ignore-scripts
echo "    frontend OK"
cd ..

echo "==> [3/4] Server runtime"
cd server
npm ci --omit=dev --ignore-scripts
echo "    server OK"
cd ..

echo "==> [4/4] PM2 restart"
pm2 delete crypto-api crypto-web 2>/dev/null || true
if pm2 describe crypto >/dev/null 2>&1; then
  pm2 restart crypto
else
  pm2 start deploy/cafe24-business/ecosystem.config.cjs
fi
pm2 save

echo "    waiting for app to start..."
HEALTH_OK=false
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 3
  if curl -sf http://127.0.0.1:3000/health >/dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  echo "    retry $i/10..."
done

sleep 1
pm2 status
if [ "$HEALTH_OK" = true ]; then
  curl -sf http://127.0.0.1:3000/health && echo " health OK" || echo " health check FAILED"
  curl -sf -o /dev/null http://127.0.0.1:3000/login && echo " web OK" || echo " web check FAILED"
else
  echo " health check FAILED (app still starting or crashed)"
  echo " Check: pm2 logs crypto --lines 50"
fi

echo ""
echo "Done: https://api.tinpass.com/login"
