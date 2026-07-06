#!/bin/bash
# 저메모리 서버용 의존성 설치 (postinstall 중단 방지: --ignore-scripts)
#   bash deploy/cafe24-business/deploy-install.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

install_pkg() {
  local dir="$1"
  echo "==> npm ci: $dir"
  cd "$dir"
  # postinstall(prisma generate)를 npm ci 중에 돌리지 않음 — SIGINT·OOM 완화
  npm ci --ignore-scripts
  if [ -f prisma/schema.prisma ]; then
    npx prisma generate
  fi
  cd "$ROOT"
}

install_pkg backend
install_pkg frontend
install_pkg server

echo "의존성 설치 완료. 이어서: bash deploy/cafe24-business/deploy-rebuild.sh"
