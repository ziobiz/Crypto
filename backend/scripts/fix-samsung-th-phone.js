/** Set samsung.th@gmail.com to KR +82 / 01020237899 (canonical national digits). */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const email = 'samsung.th@gmail.com';
  const u = await p.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      phone: true,
      phoneCountryCode: true,
      customerProfile: { select: { id: true, limitCountry: true } },
    },
  });
  if (!u) {
    console.log(JSON.stringify({ found: false, email }));
    await p.$disconnect();
    return;
  }
  const updated = await p.user.update({
    where: { id: u.id },
    data: {
      phoneCountryCode: '+82',
      phone: '1020237899',
    },
    select: { email: true, phone: true, phoneCountryCode: true },
  });
  if (u.customerProfile) {
    await p.customerProfile.update({
      where: { id: u.customerProfile.id },
      data: { limitCountry: 'KR' },
    });
  }
  console.log(
    JSON.stringify(
      {
        before: {
          phone: u.phone,
          phoneCountryCode: u.phoneCountryCode,
          limitCountry: u.customerProfile?.limitCountry ?? null,
        },
        after: { ...updated, limitCountry: 'KR' },
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
