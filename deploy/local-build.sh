#!/bin/bash
# 로컬 PC에서 실행 — 배포용 빌드 (backend + frontend + server)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Backend (tsc)"
npm ci --prefix backend
npm run build --prefix backend
npx prisma generate --prefix backend 2>/dev/null || (cd backend && npx prisma generate)

echo "==> Frontend (next build)"
npm ci --prefix frontend
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
npm run build --prefix frontend

echo "==> Server (tsc)"
npm ci --prefix server
npm run build --prefix server

echo ""
echo "빌드 완료. FTP 업로드 후 서버에서:"
echo "  bash deploy/cafe24-business/ftp-apply-built.sh"
echo ""
echo "FTP 대상: backend/dist, frontend/.next, server/dist, package.json×3, prisma, deploy"
