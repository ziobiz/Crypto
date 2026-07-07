#!/bin/bash
# Deploy crypto-release.zip (FTP upload)
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/apply-release.sh
#
# FTP upload (either path works):
#   /var/www/crypto-workflow/incoming/crypto-release.zip
#   /var/www/crypto-workflow/deploy/cafe24-business/crypto-release.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

ZIP=""
for candidate in \
  "$ROOT/incoming/crypto-release.zip" \
  "$ROOT/deploy/cafe24-business/crypto-release.zip"; do
  if [ -f "$candidate" ]; then
    ZIP="$candidate"
    break
  fi
done

echo "=============================================="
echo " Apply release package (crypto-release.zip)"
echo " ROOT: $ROOT"
echo "=============================================="

if [ -z "$ZIP" ]; then
  echo "ERROR: crypto-release.zip not found"
  echo ""
  echo "FTP upload to ONE of:"
  echo "  incoming/crypto-release.zip"
  echo "  deploy/cafe24-business/crypto-release.zip"
  echo ""
  echo "Create on PC:"
  echo "  powershell -File deploy\\pack-release.ps1"
  exit 1
fi

echo "Package: $ZIP"

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env missing (server only - do not include in zip)"
  exit 1
fi

echo "==> Extract zip"
mkdir -p "$ROOT/incoming"
bash deploy/cafe24-business/unpack-zip.sh "$ZIP" "$ROOT"

echo "==> Fix deploy scripts"
sed -i 's/\r$//' deploy/cafe24-business/*.sh
chmod +x deploy/cafe24-business/*.sh

echo "==> Install runtime + restart PM2"
bash deploy/cafe24-business/ftp-apply-built.sh

DEPLOY_SIZE_MB=""
if [ -f "$ZIP" ]; then
  DEPLOY_SIZE_MB=$(awk "BEGIN {printf \"%.1f\", $(stat -c%s "$ZIP" 2>/dev/null || stat -f%z "$ZIP") / 1048576}")
fi
if [ -f backend/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source backend/.env
  set +a
fi
if [ -n "${DEPLOY_RELEASE_TOKEN:-}" ]; then
  echo "==> Record deploy release log"
  curl -sf -X POST "http://127.0.0.1:${PORT:-4000}/api/internal/deploy-release" \
    -H "Content-Type: application/json" \
    -H "x-deploy-token: $DEPLOY_RELEASE_TOKEN" \
    -d "{\"packageSizeMb\": ${DEPLOY_SIZE_MB:-0}, \"notes\": \"apply-release.sh\"}" \
    || echo "WARN: deploy release log skipped (API not ready)"
fi

echo "==> Admin login (ziobizm@gmail.com / ziobizm1!)"

echo "==> Nginx / SSL"
if [ -f deploy/cafe24-business/setup-ssl-tinpass.sh ]; then
  if [ "$(id -u)" -eq 0 ]; then
    bash deploy/cafe24-business/setup-ssl-tinpass.sh
  elif command -v sudo >/dev/null 2>&1; then
    sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh || {
      echo "WARN: SSL setup failed — run manually:"
      echo "  sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh"
    }
  else
    echo "WARN: run SSL setup as root:"
    echo "  sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh"
  fi
fi

STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="$ROOT/incoming/crypto-release.applied-${STAMP}.zip"
mv "$ZIP" "$BACKUP"
echo ""
echo "Backup: $BACKUP"
echo "Done: https://tinpass.com/login"
