/** List customers missing phoneCountryCode; find Takeda. */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const missing = await p.user.findMany({
    where: {
      role: 'CUSTOMER',
      OR: [{ phoneCountryCode: null }, { phoneCountryCode: '' }],
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      phoneCountryCode: true,
      customerProfile: { select: { limitCountry: true, customerType: true } },
    },
    orderBy: { email: 'asc' },
  });
  const takeda = await p.user.findMany({
    where: {
      OR: [
        { name: { contains: '다케다', mode: 'insensitive' } },
        { name: { contains: 'takeda', mode: 'insensitive' } },
        { name: { contains: '武田', mode: 'insensitive' } },
        { name: { contains: 'ヒロシ', mode: 'insensitive' } },
        { name: { contains: 'hiroshi', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      phoneCountryCode: true,
      customerProfile: { select: { limitCountry: true } },
    },
  });
  console.log(
    JSON.stringify(
      {
        missingCount: missing.length,
        missing,
        takeda,
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  try {
    await p.$disconnect();
  } catch (_) {}
  process.exit(1);
});
