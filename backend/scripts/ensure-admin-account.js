/**
 * 총본사 관리자 계정 보장 — 배포 후 자동 실행
 *   cd backend && node scripts/ensure-admin-account.js
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const ADMIN_EMAIL = 'ziobizm@gmail.com';
const ADMIN_PASSWORD = 'ziobizm1!';

function initialPasswordFromEmail(email) {
  const local = email.trim().toLowerCase().split('@')[0];
  return `${local}1!`;
}

(async () => {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: ADMIN_EMAIL },
        { email: { equals: ADMIN_EMAIL, mode: 'insensitive' } },
        { role: 'SUPER_ADMIN' },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    const hq = await prisma.organization.findFirst({
      where: { type: 'HEAD_OFFICE' },
      orderBy: { createdAt: 'asc' },
    });
    user = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: '총본사 관리자',
        role: 'SUPER_ADMIN',
        organizationId: hq?.id ?? null,
        passwordMustChange: false,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Created SUPER_ADMIN ${ADMIN_EMAIL}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        passwordMustChange: false,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`Updated admin ${user.email} -> ${ADMIN_EMAIL}`);
  }

  const verify = await bcrypt.compare(ADMIN_PASSWORD, passwordHash);
  const policyMatch = ADMIN_PASSWORD === initialPasswordFromEmail(ADMIN_EMAIL);
  console.log(`Password verify=${verify} policyMatch=${policyMatch} use: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
