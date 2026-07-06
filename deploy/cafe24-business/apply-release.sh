#!/bin/bash
# FTP로 올린 crypto-release.zip 한 번에 배포
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/apply-release.sh
#
# 업로드 위치: /var/www/crypto-workflow/incoming/crypto-release.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ZIP="$ROOT/incoming/crypto-release.zip"

echo "=============================================="
echo " 배포 패키지 적용 (crypto-release.zip)"
echo " ROOT: $ROOT"
echo "=============================================="

if [ ! -f "$ZIP" ]; then
  echo "ERROR: $ZIP 없음"
  echo ""
  echo "PC에서 패키지 생성:"
  echo "  powershell -File deploy\\pack-release.ps1"
  echo ""
  echo "FTP 업로드:"
  echo "  로컬: deploy/release/crypto-release.zip"
  echo "  서버: /var/www/crypto-workflow/incoming/crypto-release.zip"
  exit 1
fi

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env 없음 (서버 전용 — zip에 포함하지 말 것)"
  exit 1
fi

echo "==> 압축 해제"
mkdir -p "$ROOT/incoming"
unzip -o "$ZIP" -d "$ROOT"

echo "==> 배포 스크립트 적용"
sed -i 's/\r$//' deploy/cafe24-business/*.sh
chmod +x deploy/cafe24-business/*.sh

echo "==> 런타임 설치 + PM2 재시작"
bash deploy/cafe24-business/ftp-apply-built.sh

STAMP=$(date +%Y%m%d-%H%M%S)
mv "$ZIP" "$ROOT/incoming/crypto-release.applied-$STAMP.zip"
echo ""
echo "백업: incoming/crypto-release.applied-$STAMP.zip"
echo "완료: https://api.tinpass.com/login"
