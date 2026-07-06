#!/bin/bash
# FTP 업로드 후 서버에서 실행하는 재배포 스크립트
# (소스 코드를 FTP로 올린 뒤 SSH에서 1회 실행)
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/ftp-apply.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=============================================="
echo " FTP 재배포 적용 (소스 → 서버 빌드)"
echo " ROOT: $ROOT"
echo "=============================================="

if [ ! -f backend/package.json ] || [ ! -f frontend/package.json ]; then
  echo "ERROR: backend/ 또는 frontend/ 가 없습니다. FTP 업로드 경로를 확인하세요."
  exit 1
fi

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env 가 없습니다. (FTP로 덮어쓰지 말 것 — 서버에만 유지)"
  exit 1
fi

if [ ! -f frontend/.env.local ]; then
  echo "WARN: frontend/.env.local 없음 — same-origin API 사용 또는 아래 예시로 생성"
  echo "  echo 'NEXT_PUBLIC_API_URL=https://api.tinpass.com' > frontend/.env.local"
fi

bash deploy/cafe24-business/deploy.sh

echo ""
echo "완료: https://api.tinpass.com"
echo "확인: pm2 status && curl -s https://api.tinpass.com/health"
