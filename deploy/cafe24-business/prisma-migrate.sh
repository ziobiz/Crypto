#!/bin/bash
# Run Prisma migrations from the correct directory.
#
#   cd /var/www/crypto-workflow
#   bash deploy/cafe24-business/prisma-migrate.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/backend"

if [ ! -f prisma/schema.prisma ]; then
  echo "ERROR: backend/prisma/schema.prisma not found"
  exit 1
fi

if [ -f .env ]; then
  sed -i 's/\r$//' .env
fi

echo "==> prisma migrate deploy (backend/)"
npx prisma migrate deploy
