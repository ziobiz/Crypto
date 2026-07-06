#!/bin/bash
# 서버 SSH에서 1회 실행 — GitHub 최신 코드 pull 후 빌드·재시작
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/server-pull-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> git pull"
git fetch origin main
git reset --hard origin/main

sed -i 's/\r$//' deploy/cafe24-business/*.sh
chmod +x deploy/cafe24-business/*.sh

if [ -f deploy/cafe24-business/ftp-apply-built.sh ] && [ -f backend/dist/index.js ] && [ -f frontend/.next/BUILD_ID ]; then
  echo "==> 빌드 산출물 있음 — ftp-apply-built"
  bash deploy/cafe24-business/ftp-apply-built.sh
else
  echo "==> 소스 빌드 — ftp-apply"
  bash deploy/cafe24-business/ftp-apply.sh
fi

echo ""
echo "완료: https://api.tinpass.com/login"
pm2 status
