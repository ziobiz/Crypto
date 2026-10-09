const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  for (const key of ['hq.commission.risk', 'hq.commission.simulator_risk']) {
    const row = await p.systemConfig.findUnique({ where: { key } });
    const tiers = row?.value?.usdtRiskLimitTiers;
    console.log(key, JSON.stringify(tiers, null, 2));
  }
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
