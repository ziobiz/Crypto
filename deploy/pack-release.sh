#!/bin/bash
# 빌드 + 배포용 단일 zip 생성
#   bash deploy/pack-release.sh
#   bash deploy/pack-release.sh --skip-build
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SKIP_BUILD=false
if [ "${1:-}" = "--skip-build" ]; then
  SKIP_BUILD=true
fi

RELEASE_DIR="$ROOT/deploy/release"
ZIP_PATH="$RELEASE_DIR/crypto-release.zip"
STAGE="${TMPDIR:-/tmp}/crypto-release-stage"

if [ "$SKIP_BUILD" = false ]; then
  echo "==> 빌드"
  bash deploy/local-build.sh
fi

echo "==> 빌드 산출물 확인"
for f in backend/dist/index.js frontend/.next/BUILD_ID server/dist/index.js; do
  if [ ! -e "$f" ]; then
    echo "ERROR: $f 없음"
    exit 1
  fi
done

echo "==> 배포 패키지 생성"
rm -rf "$STAGE"
mkdir -p "$STAGE" "$RELEASE_DIR"
rm -f "$ZIP_PATH"

copy_item() {
  local src="$1" dst="$2"
  if [ -e "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp -a "$src" "$dst"
  else
    echo "WARN: $src 없음 — 건너뜀"
  fi
}

copy_item backend/dist "$STAGE/backend/dist"
copy_item backend/prisma "$STAGE/backend/prisma"
copy_item backend/package.json "$STAGE/backend/package.json"
copy_item backend/package-lock.json "$STAGE/backend/package-lock.json"
copy_item frontend/.next "$STAGE/frontend/.next"
copy_item frontend/public "$STAGE/frontend/public"
copy_item frontend/package.json "$STAGE/frontend/package.json"
copy_item frontend/package-lock.json "$STAGE/frontend/package-lock.json"
copy_item frontend/next.config.js "$STAGE/frontend/next.config.js"
copy_item server/dist "$STAGE/server/dist"
copy_item server/package.json "$STAGE/server/package.json"
copy_item server/package-lock.json "$STAGE/server/package-lock.json"
copy_item deploy "$STAGE/deploy"

(cd "$STAGE" && zip -rq "$ZIP_PATH" .)
rm -rf "$STAGE"

SIZE_MB=$(du -m "$ZIP_PATH" | cut -f1)
echo ""
echo "=============================================="
echo " 배포 패키지 생성 완료"
echo " 파일: $ZIP_PATH (${SIZE_MB} MB)"
echo "=============================================="
echo ""
echo " [1] FTP 업로드 → /var/www/crypto-workflow/incoming/crypto-release.zip"
echo " [2] SSH: cd /var/www/crypto-workflow && bash deploy/cafe24-business/apply-release.sh"
echo ""
