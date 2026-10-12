/**
 * Backfill User.phoneCountryCode for customers missing it.
 * - TAKEDA / 다케다 → +81 (JP)
 * - samsung.th@gmail.com → +66 (TH)
 * - other KR demo accounts with phone → +82
 * Canonicalizes national number when possible.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const TRUNK_ZERO = new Set([
  '81', '82', '66', '86', '44', '61', '49', '33', '39', '34', '31', '46', '47', '45',
  '41', '43', '32', '353', '64', '27', '60', '62', '63', '84', '90', '91', '92', '94', '95', '98',
]);

function canonicalize(ccRaw, phoneRaw) {
  const cc = String(ccRaw ?? '').replace(/\D/g, '');
  if (!cc || phoneRaw == null) return null;
  let digits = String(phoneRaw).trim().replace(/\(0\)/g, '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith(cc) && digits.length > cc.length + 5) digits = digits.slice(cc.length);
  if (TRUNK_ZERO.has(cc) && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length < 6) return { phoneCountryCode: `+${cc}`, phone: digits };
  return { phoneCountryCode: `+${cc}`, phone: digits };
}

function pickCc(user) {
  const email = String(user.email || '').toLowerCase();
  const name = String(user.name || '');
  const nameL = name.toLowerCase();
  if (
    nameL.includes('takeda') ||
    name.includes('다케다') ||
    name.includes('武田') ||
    email.includes('takeda') ||
    email.includes('onthelinejp')
  ) {
    return '+81';
  }
  if (email.endsWith('.th') || email.includes('samsung.th') || email.endsWith('.th@') || /@.*\.th$/.test(email) || email === 'samsung.th@gmail.com') {
    return '+66';
  }
  if (email.includes('.jp') || email.endsWith('jp.com')) return '+81';
  if (user.phone) return '+82';
  return null;
}

(async () => {
  const users = await p.user.findMany({
    where: {
      OR: [{ phoneCountryCode: null }, { phoneCountryCode: '' }],
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      phoneCountryCode: true,
      role: true,
      customerProfile: { select: { id: true, limitCountry: true } },
    },
  });

  const results = [];
  for (const u of users) {
    const cc = pickCc(u);
    if (!cc) {
      results.push({ id: u.id, email: u.email, skipped: true, reason: 'no_phone_and_no_rule' });
      continue;
    }
    const phoneLooksValid = u.phone && !/[a-zA-Z@]/.test(u.phone);
    const canon = phoneLooksValid ? canonicalize(cc, u.phone) : null;
    const data = {
      phoneCountryCode: (canon && canon.phoneCountryCode) || cc,
      ...(canon && canon.phone ? { phone: canon.phone } : {}),
    };
    await p.user.update({ where: { id: u.id }, data });
    if (u.customerProfile && cc === '+81' && !u.customerProfile.limitCountry) {
      await p.customerProfile.update({
        where: { id: u.customerProfile.id },
        data: { limitCountry: 'JP' },
      });
    }
    if (u.customerProfile && cc === '+66' && !u.customerProfile.limitCountry) {
      await p.customerProfile.update({
        where: { id: u.customerProfile.id },
        data: { limitCountry: 'TH' },
      });
    }
    results.push({
      id: u.id,
      email: u.email,
      name: u.name,
      before: { phone: u.phone, phoneCountryCode: u.phoneCountryCode },
      after: data,
    });
  }

  console.log(JSON.stringify({ updated: results.filter((r) => !r.skipped).length, results }, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  try {
    await p.$disconnect();
  } catch (_) {}
  process.exit(1);
});
