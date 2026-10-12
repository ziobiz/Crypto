/** Debug: buyer contact fields for a user email (no secrets). */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const email = process.argv[2] || 'samsung.th@gmail.com';

(async () => {
  const user = await p.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      phone: true,
      phoneCountryCode: true,
      name: true,
      legalFirstName: true,
      legalLastName: true,
      customerProfile: { select: { id: true, customerType: true } },
    },
  });
  if (!user) {
    console.log(JSON.stringify({ found: false, email }, null, 2));
    await p.$disconnect();
    return;
  }
  const cc = String(user.phoneCountryCode ?? '');
  const phone = String(user.phone ?? '');
  console.log(
    JSON.stringify(
      {
        found: true,
        email: user.email,
        phone,
        phoneCountryCode: user.phoneCountryCode,
        phoneCountryCodeRawJson: JSON.stringify(user.phoneCountryCode),
        phoneCountryCodeLen: cc.length,
        phoneCountryCodeChars: [...cc].map((c) => c.charCodeAt(0)),
        hasPlus: cc.trim().startsWith('+'),
        digitsOnlyCc: cc.trim().replace(/^\+/, '').replace(/\D/g, ''),
        legalFirstName: user.legalFirstName,
        legalLastName: user.legalLastName,
        customerType: user.customerProfile?.customerType ?? null,
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch(async (e) => {
  console.error(String(e && e.stack ? e.stack : e));
  try {
    await p.$disconnect();
  } catch (_) {}
  process.exit(1);
});
