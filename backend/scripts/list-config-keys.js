const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const all = await p.systemConfig.findMany({ select: { key: true } });
  console.log(all.map((x) => x.key).sort().join('\n'));
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
