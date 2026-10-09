/**
 * Probe ICOPAY + card payment flags (no secrets printed in full).
 *   node backend/scripts/probe-icopay-sandbox.js
 */
const { PrismaClient } = require('@prisma/client');

function mask(s) {
  const t = String(s || '').trim();
  if (!t) return { set: false, len: 0, prefix: '', isIc: false, isLocalMock: false };
  return {
    set: true,
    len: t.length,
    prefix: t.slice(0, 4),
    isIc: t.startsWith('ic_'),
    isLocalMock: t.toUpperCase() === 'SANDBOX',
  };
}

async function main() {
  const p = new PrismaClient();
  const ic = await p.systemConfig.findUnique({ where: { key: 'hq.platform.icopay' } });
  const card = await p.systemConfig.findUnique({ where: { key: 'hq.payment.card' } });
  const v = ic?.value && typeof ic.value === 'object' ? ic.value : {};
  const c = card?.value && typeof card.value === 'object' ? card.value : {};

  const out = {
    icopay: {
      enabled: v.enabled === true,
      compId: String(v.compId || ''),
      mid: String(v.mid || ''),
      apiBaseUrl: String(v.apiBaseUrl || ''),
      channel: v.channel || '',
      sandboxCheckbox: v.sandbox === true,
      activeBrokerEnv: v.activeBrokerEnv || null,
      bracketSecret: mask(v.bracketSecret),
      brokerSecretLive: mask(v.brokerSecretLive),
      brokerSecretSandbox: mask(v.brokerSecretSandbox),
    },
    card: {
      enabled: c.enabled === true,
      cardFeePercent: c.cardFeePercent,
    },
    readyForOfficialSandbox:
      v.enabled === true &&
      c.enabled === true &&
      Boolean(String(v.compId || v.mid || '').trim()) &&
      mask(v.brokerSecretSandbox).set &&
      v.activeBrokerEnv === 'SANDBOX',
  };

  console.log(JSON.stringify(out, null, 2));
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
