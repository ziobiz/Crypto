/** Restore phones that were email strings mangled by digit extraction. */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const FIXES = [
  { email: 'staff@so-001.com', phone: 'cheng1000@naver.com' },
  { email: 'ziobizm@gmail.com', phone: 'cheng1000@naver.com' },
];

const CC_FIXES = [
  { email: 'tk@onthelinem.com', phoneCountryCode: '+66' },
  { email: 'krkouki0630@gmail.com', phoneCountryCode: '+81' },
];

(async () => {
  for (const f of FIXES) {
    const u = await p.user.findFirst({
      where: { email: { equals: f.email, mode: 'insensitive' } },
      select: { id: true, phone: true, phoneCountryCode: true, email: true },
    });
    if (!u) {
      console.log('missing', f.email);
      continue;
    }
    await p.user.update({ where: { id: u.id }, data: { phone: f.phone } });
    console.log(JSON.stringify({ email: u.email, before: u.phone, after: f.phone, cc: u.phoneCountryCode }));
  }
  for (const f of CC_FIXES) {
    const r = await p.user.updateMany({
      where: { email: { equals: f.email, mode: 'insensitive' } },
      data: { phoneCountryCode: f.phoneCountryCode },
    });
    console.log(JSON.stringify({ email: f.email, phoneCountryCode: f.phoneCountryCode, count: r.count }));
  }
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  try {
    await p.$disconnect();
  } catch (_) {}
  process.exit(1);
});
