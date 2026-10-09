const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const indexes = await p.$queryRawUnsafe(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'wallets'
    ORDER BY indexname
  `);
  const sample = await p.$queryRawUnsafe(`
    SELECT id, "userId", address, network, "assetType"::text, "isActive"
    FROM wallets
    WHERE "isActive" = true
    ORDER BY "createdAt" DESC
    LIMIT 20
  `);
  console.log(JSON.stringify({ indexes, sample }, null, 2));
  await p.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await p.$disconnect().catch(() => {});
  process.exit(1);
});
