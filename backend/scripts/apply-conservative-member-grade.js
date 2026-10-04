/**
 * 회원등급 EXPRESS 추가 수수료 — 1차 보수안을 HQ 설정에 적용
 *   cd backend && node scripts/apply-conservative-member-grade.js
 *
 * Standard 0% / Premium 3% / VIP 5% / VVIP 8% / Prestige 12% /
 * Black 15% + 1 USDT + ULTRA 지정가 0
 * 법인·개인 동일. 티어 지정가는 Black ULTRA 외 본사따름.
 */
const { PrismaClient } = require('@prisma/client');

const KEY = 'hq.commission.member_grade';
const TIERS = ['ULTRA', 'PRIORITY', 'HALF', 'DAY', 'T1', 'T2', 'BASIC'];

function benefit(discountPercent, discountUsdt = 0, ultraFeeUsdt = null) {
  const tierFees = {};
  const tierFeePercents = {};
  for (const tier of TIERS) {
    tierFees[tier] = tier === 'ULTRA' && ultraFeeUsdt != null ? ultraFeeUsdt : null;
    tierFeePercents[tier] = null;
  }
  return { tierFees, tierFeePercents, discountPercent, discountUsdt };
}

function customerTypePolicy() {
  return {
    grades: {
      STANDARD: benefit(0, 0),
      PREMIUM: benefit(3, 0),
      VIP: benefit(5, 0),
      VVIP: benefit(8, 0),
      PRESTIGE: benefit(12, 0),
      BLACK: benefit(15, 1, 0),
    },
  };
}

function policy() {
  return {
    INDIVIDUAL: customerTypePolicy(),
    CORPORATE: customerTypePolicy(),
  };
}

(async () => {
  const prisma = new PrismaClient();
  const value = policy();
  await prisma.systemConfig.upsert({
    where: { key: KEY },
    create: {
      key: KEY,
      value,
      description: '회원등급 EXPRESS 추가 수수료 (개인/법인) — 1차 보수안',
    },
    update: {
      value,
      description: '회원등급 EXPRESS 추가 수수료 (개인/법인) — 1차 보수안',
    },
  });
  console.log('Applied conservative member-grade EXPRESS policy:');
  console.log(
    JSON.stringify(
      {
        STANDARD: '0% / 0 USDT',
        PREMIUM: '3% / 0 USDT',
        VIP: '5% / 0 USDT',
        VVIP: '8% / 0 USDT',
        PRESTIGE: '12% / 0 USDT',
        BLACK: '15% / 1 USDT + ULTRA=0',
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
