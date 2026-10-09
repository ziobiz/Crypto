/**
 * Emergency fix: drop leftover unique index blocking USDC twin wallets.
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`DROP INDEX IF EXISTS "wallets_userId_address_network_key"`);
  await p.$executeRawUnsafe(
    `ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "wallets_userId_address_network_key"`,
  );
  const indexes = await p.$queryRawUnsafe(`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'wallets' ORDER BY indexname
  `);
  console.log(JSON.stringify({ ok: true, indexes }, null, 2));
  await p.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await p.$disconnect().catch(() => {});
  process.exit(1);
});
