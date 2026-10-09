/**
 * Compare HQ CARD risk limits vs hq.payment.card.limits (banner source).
 *   node backend/scripts/probe-card-limits-mismatch.js
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const risk = await p.systemConfig.findUnique({ where: { key: 'hq.commission.risk' } });
  const card = await p.systemConfig.findUnique({ where: { key: 'hq.payment.card' } });
  const keys = await p.systemConfig.findMany({
    where: { OR: [{ key: { contains: 'commission' } }, { key: { contains: 'card' } }] },
    select: { key: true },
  });
  const v = risk?.value && typeof risk.value === 'object' ? risk.value : {};
  const c = card?.value && typeof card.value === 'object' ? card.value : {};
  const methods = v.methodTransactionLimits || {};
  const pick = (policy) => {
    if (!policy) return null;
    const ind = policy.INDIVIDUAL || {};
    const out = {};
    for (const cur of ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR']) {
      const row = ind[cur] || {};
      out[cur] = {
        perTransactionMin: row.perTransactionMin,
        perTransactionMax: row.perTransactionMax,
      };
    }
    return out;
  };
  console.log(
    JSON.stringify(
      {
        configKeys: keys.map((k) => k.key),
        cardEnabled: c.enabled,
        cardLimits: c.limits || null,
        hasMethodTransactionLimits: Boolean(v.methodTransactionLimits),
        methodKeys: Object.keys(methods),
        CARD_INDIVIDUAL: pick(methods.CARD),
        BANK_INDIVIDUAL: pick(methods.BANK_TRANSFER),
        legacy_INDIVIDUAL: pick(v.transactionLimits),
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
