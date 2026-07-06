#!/bin/bash
# 서버 SSH에서 실행 — GitHub 최신 코드 강제 동기화 후 빌드·재시작
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/server-pull-deploy.sh
#
# git pull 충돌 시: 로컬 수정·미추적 파일을 정리하고 origin/main 과 동일하게 맞춤
# backend/.env · frontend/.env.local · uploads/ 는 보존
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ENV_BAK="/tmp/crypto-backend.env.bak"
FE_BAK="/tmp/crypto-frontend.env.local.bak"

echo "==> 환경 파일 백업"
[ -f backend/.env ] && cp backend/.env "$ENV_BAK"
[ -f frontend/.env.local ] && cp frontend/.env.local "$FE_BAK" || true

echo "==> GitHub origin/main 강제 동기화"
git fetch origin main
git reset --hard origin/main
# 미추적 파일 정리 (.env 는 gitignore — clean 전 백업됨)
git clean -fd -e uploads

[ -f "$ENV_BAK" ] && cp "$ENV_BAK" backend/.env
[ -f "$FE_BAK" ] && cp "$FE_BAK" frontend/.env.local || true

sed -i 's/\r$//' deploy/cafe24-business/*.sh
chmod +x deploy/cafe24-business/*.sh

if [ -f backend/dist/index.js ] && [ -f frontend/.next/BUILD_ID ] && [ -f server/dist/index.js ]; then
  echo "==> 빌드 산출물 있음 — ftp-apply-built"
  bash deploy/cafe24-business/ftp-apply-built.sh
else
  echo "==> 소스 빌드 — ftp-apply"
  bash deploy/cafe24-business/ftp-apply.sh
fi

echo ""
echo "완료: https://api.tinpass.com/login"
pm2 status
curl -sf http://127.0.0.1:3000/health && echo " health OK" || echo " health FAILED"
