/**
 * One-time LIVE ICOPAY config seed (DEALMAI / TINPASS).
 * Usage (server):
 *   node backend/scripts/seed-icopay-live.js
 * Or with env overrides:
 *   ICOPAY_COMP_ID=... ICOPAY_MID=... ICOPAY_BROKER_SECRET=... node backend/scripts/seed-icopay-live.js
 */
const { PrismaClient } = require('@prisma/client');

const KEY = 'hq.platform.icopay';
const CARD_KEY = 'hq.payment.card';

async function main() {
  const prisma = new PrismaClient();
  const config = {
    enabled: true,
    mid: process.env.ICOPAY_MID || '5f681081-2466-4c1c-9505-5ff960715ec3',
    compId: process.env.ICOPAY_COMP_ID || '6000000064',
    bracketSecret: process.env.ICOPAY_BROKER_SECRET || '',
    apiBaseUrl: process.env.ICOPAY_API_URL || 'https://api.icopay.co.kr',
    sandbox: process.env.ICOPAY_SANDBOX === '1',
    channel: 'IN',
  };
  if (!config.bracketSecret) {
    console.error('ICOPAY_BROKER_SECRET is required');
    process.exit(1);
  }
  await prisma.systemConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: config, description: 'ICOPAY LIVE Unified Checkout' },
    update: { value: config, description: 'ICOPAY LIVE Unified Checkout' },
  });

  const existingCard = await prisma.systemConfig.findUnique({ where: { key: CARD_KEY } });
  const cardBase = (existingCard?.value && typeof existingCard.value === 'object'
    ? existingCard.value
    : {}) ;
  const cardConfig = {
    enabled: true,
    cardFeePercent: Number(cardBase.cardFeePercent ?? 3.5),
    limits: cardBase.limits ?? {
      KRW: { min: 10_000, max: 5_000_000 },
      JPY: { min: 1_000, max: 500_000 },
      THB: { min: 500, max: 200_000 },
      CNY: { min: 100, max: 50_000 },
      USD: { min: 10, max: 10_000 },
      EUR: { min: 10, max: 10_000 },
    },
  };
  await prisma.systemConfig.upsert({
    where: { key: CARD_KEY },
    create: { key: CARD_KEY, value: cardConfig, description: '카드 결제 정책' },
    update: { value: cardConfig },
  });

  console.log('ICOPAY LIVE seeded:', {
    compId: config.compId,
    mid: config.mid,
    apiBaseUrl: config.apiBaseUrl,
    sandbox: config.sandbox,
    cardEnabled: true,
    webhookUrl: 'https://api.tinpass.com/api/webhooks/icopay',
  });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
