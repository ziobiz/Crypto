/**
 * Rewrite stored customer phones to E.164 national form (no trunk 0).
 * +82 010…, +82 10…, and +82(0)10… become phoneCountryCode +82 and phone 10…
 */
const { PrismaClient } = require('@prisma/client');
const { canonicalizePhone } = require('../dist/lib/phone-number');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, phone: { not: null } },
    select: { id: true, phone: true, phoneCountryCode: true },
  });
  let updated = 0;
  let skipped = 0;
  for (const user of users) {
    const canon = canonicalizePhone(user.phoneCountryCode, user.phone);
    if (!canon) {
      skipped += 1;
      continue;
    }
    if (canon.phone === user.phone && canon.phoneCountryCode === user.phoneCountryCode) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { phone: canon.phone, phoneCountryCode: canon.phoneCountryCode },
    });
    updated += 1;
  }
  console.log(`phones checked=${users.length} updated=${updated} skipped=${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
