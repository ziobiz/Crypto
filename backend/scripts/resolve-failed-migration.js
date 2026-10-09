const path = require('path');
const { execSync } = require('child_process');
process.chdir(path.join(__dirname, '..'));

try {
  execSync('npx prisma migrate resolve --rolled-back 20261009200000_drop_legacy_wallet_unique', {
    stdio: 'inherit',
  });
} catch {
  console.log('resolve rolled-back skipped/failed (may already be clear)');
}

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`DROP INDEX IF EXISTS "wallets_userId_address_network_key"`);
  await p.$executeRawUnsafe(
    `ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "wallets_userId_address_network_key"`,
  );
  const failed = await p.$queryRawUnsafe(`
    SELECT migration_name, finished_at, rolled_back_at, logs
    FROM _prisma_migrations
    WHERE migration_name = '20261009200000_drop_legacy_wallet_unique'
  `);
  console.log(JSON.stringify({ failed, ok: true }, null, 2));
  await p.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await p.$disconnect().catch(() => {});
  process.exit(1);
});
