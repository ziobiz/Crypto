#!/bin/bash
set -euo pipefail
cd /var/www/crypto-workflow/backend
npx prisma migrate resolve --rolled-back 20261009200000_drop_legacy_wallet_unique || true
# Index already dropped manually; ensure gone then mark applied after redeploy
node -e 'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();(async()=>{await p.$executeRawUnsafe("DROP INDEX IF EXISTS \"wallets_userId_address_network_key\"");const rows=await p.$queryRawUnsafe("SELECT indexname FROM pg_indexes WHERE tablename='\''wallets'\''");console.log(JSON.stringify(rows));await p.$disconnect();})().catch(e=>{console.error(e);process.exit(1);});'
