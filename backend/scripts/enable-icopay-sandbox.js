/**
 * Switch HQ ICOPAY to official SANDBOX mode (keeps existing secrets).
 * Optionally set sandbox secret via env:
 *   ICOPAY_BROKER_SECRET_SANDBOX=ic_... node backend/scripts/enable-icopay-sandbox.js
 *
 * Also ensures card payment enabled + compId/mid defaults for DEALMAI TINPASS.
 */
const { PrismaClient } = require('@prisma/client');

const ICOPAY_KEY = 'hq.platform.icopay';
const CARD_KEY = 'hq.payment.card';

const LIVE = {
  mid: '5f681081-2466-4c1c-9505-5ff960715ec3',
  compId: '6000000064',
  apiBaseUrl: 'https://api.icopay.co.kr',
  channel: 'IN',
};

function mask(s) {
  const t = String(s || '').trim();
  if (!t) return '(empty)';
  return `${t.slice(0, 4)}…(len=${t.length})`;
}

async function main() {
  const prisma = new PrismaClient();
  const row = await prisma.systemConfig.findUnique({ where: { key: ICOPAY_KEY } });
  const prev = row?.value && typeof row.value === 'object' ? { ...row.value } : {};

  let brokerSecretLive = String(prev.brokerSecretLive || '').trim();
  let brokerSecretSandbox = String(prev.brokerSecretSandbox || '').trim();
  let bracketSecret = String(prev.bracketSecret || '').trim();

  const envSandbox = String(process.env.ICOPAY_BROKER_SECRET_SANDBOX || '').trim();
  if (envSandbox) brokerSecretSandbox = envSandbox;

  // Migrate legacy single secret into slots
  if (bracketSecret && bracketSecret.toUpperCase() !== 'SANDBOX') {
    if (bracketSecret.startsWith('ic_')) {
      if (!brokerSecretSandbox) brokerSecretSandbox = bracketSecret;
    } else if (!brokerSecretLive) {
      brokerSecretLive = bracketSecret;
    }
  }

  if (!brokerSecretSandbox) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: 'NO_SANDBOX_SECRET',
          hint:
            'DB에 SANDBOX Broker Secret이 없습니다. ICOPAY에서 받은 ic_… 키로 실행하세요: ICOPAY_BROKER_SECRET_SANDBOX=ic_xxx node backend/scripts/enable-icopay-sandbox.js',
          current: {
            enabled: prev.enabled,
            compId: prev.compId,
            activeBrokerEnv: prev.activeBrokerEnv,
            brokerSecretLive: mask(brokerSecretLive),
            brokerSecretSandbox: mask(brokerSecretSandbox),
            bracketSecret: mask(bracketSecret),
          },
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const config = {
    ...prev,
    enabled: true,
    mid: String(prev.mid || LIVE.mid).trim() || LIVE.mid,
    compId: String(prev.compId || LIVE.compId).trim() || LIVE.compId,
    apiBaseUrl: String(prev.apiBaseUrl || LIVE.apiBaseUrl).trim() || LIVE.apiBaseUrl,
    channel: prev.channel === 'RE' ? 'RE' : 'IN',
    sandbox: true,
    activeBrokerEnv: 'SANDBOX',
    brokerSecretLive,
    brokerSecretSandbox,
    bracketSecret: brokerSecretSandbox,
  };

  await prisma.systemConfig.upsert({
    where: { key: ICOPAY_KEY },
    create: {
      key: ICOPAY_KEY,
      value: config,
      description: 'ICOPAY SANDBOX — DEALMAI SERVICE (TINPASS)',
    },
    update: {
      value: config,
      description: 'ICOPAY SANDBOX — DEALMAI SERVICE (TINPASS)',
    },
  });

  const cardRow = await prisma.systemConfig.findUnique({ where: { key: CARD_KEY } });
  const cardPrev = cardRow?.value && typeof cardRow.value === 'object' ? cardRow.value : {};
  const cardConfig = {
    ...cardPrev,
    enabled: true,
    cardFeePercent: Number(cardPrev.cardFeePercent ?? 3.5),
    limits: cardPrev.limits ?? {
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

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'SANDBOX',
        enabled: config.enabled,
        cardEnabled: cardConfig.enabled,
        compId: config.compId,
        mid: config.mid,
        apiBaseUrl: config.apiBaseUrl,
        channel: config.channel,
        activeBrokerEnv: config.activeBrokerEnv,
        sandboxCheckbox: config.sandbox,
        brokerSecretSandbox: mask(brokerSecretSandbox),
        brokerSecretLive: mask(brokerSecretLive),
        webhookUrl: 'https://api.tinpass.com/api/webhooks/icopay',
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
