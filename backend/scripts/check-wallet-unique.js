const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const constraints = await p.$queryRawUnsafe(`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'wallets'::regclass AND contype = 'u'
  `);
  const migrations = await p.$queryRawUnsafe(`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    WHERE migration_name ILIKE '%wallet%'
       OR migration_name ILIKE '%asset%'
       OR migration_name ILIKE '%settlement%'
       OR migration_name ILIKE '%20261009%'
    ORDER BY finished_at DESC NULLS LAST
    LIMIT 30
  `);
  const cols = await p.$queryRawUnsafe(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name IN ('assetType','network','address','userId')
  `);
  console.log(JSON.stringify({ constraints, migrations, cols }, null, 2));
  await p.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await p.$disconnect().catch(() => {});
  process.exit(1);
});
