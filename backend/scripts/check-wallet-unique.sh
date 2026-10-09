#!/bin/bash
set -euo pipefail
cd /var/www/crypto-workflow/backend
# shellcheck disable=SC1091
set -a
source .env
set +a
psql "$DATABASE_URL" -c "\d wallets"
echo '--- migrations ---'
psql "$DATABASE_URL" -c "SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name LIKE '%wallet%' OR migration_name LIKE '%asset%' ORDER BY finished_at DESC NULLS LAST LIMIT 20;"
echo '--- constraints ---'
psql "$DATABASE_URL" -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'wallets'::regclass AND contype = 'u';"
