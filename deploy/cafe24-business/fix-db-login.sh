#!/bin/bash
# 로그인 500 (DB 스키마 불일치) 복구 — SSH 1회 실행
#   cd /var/www/crypto-workflow && bash deploy/cafe24-business/fix-db-login.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Prisma 스키마 동기화 (users OTP·passwordMustChange 등)"
cd backend
npx prisma generate
npx prisma db push --accept-data-loss
cd ..

echo "==> 관리자 계정"
bash deploy/cafe24-business/update-admin-account.sh

echo "==> PM2 재시작"
pm2 restart crypto
sleep 2

echo "==> 확인"
curl -sf http://127.0.0.1:3000/health && echo " health OK"
echo -n " login: "
curl -sf -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ziobizm@gmail.com","password":"ziobizm1!"}' | head -c 300
echo ""
