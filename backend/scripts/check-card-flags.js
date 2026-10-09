const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const keys = await p.systemConfig.findMany({
    where: {
      OR: [
        { key: { contains: 'card' } },
        { key: { contains: 'icopay' } },
        { key: { contains: 'Currency' } },
        { key: { contains: 'deposit' } },
        { key: { contains: 'payment' } },
      ],
    },
    select: { key: true, value: true },
  });
  for (const row of keys) {
    console.log('---', row.key);
    console.log(JSON.stringify(row.value, null, 2));
  }
  const profiles = await p.customerProfile.findMany({
    where: { customerType: 'INDIVIDUAL' },
    take: 10,
    select: {
      id: true,
      customerType: true,
      usdtPayCardMode: true,
      approvalStatus: true,
      user: { select: { email: true, name: true } },
    },
  });
  console.log('--- INDIVIDUAL samples');
  console.log(JSON.stringify(profiles, null, 2));
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
