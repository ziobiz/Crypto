const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const card = await p.systemConfig.findUnique({ where: { key: 'hq.payment.card' } });
  const risk = await p.systemConfig.findUnique({ where: { key: 'hq.commission.risk' } });
  const tiers = await p.systemConfig.findUnique({ where: { key: 'hq.commission.fee_tiers' } });
  const tiersBy = await p.systemConfig.findUnique({
    where: { key: 'hq.commission.fee_tiers_by_customer' },
  });
  const feeTypes = await p.systemConfig.findUnique({ where: { key: 'hq.commission.fee_types' } });

  const cv = card?.value || {};
  const rv = risk?.value || {};
  const out = {
    card: {
      cardFeeMode: cv.cardFeeMode,
      cardFeePercent: cv.cardFeePercent,
      cardFeeByBrand: cv.cardFeeByBrand,
    },
    riskDefaults: {
      defaultFxFeePercent: rv.defaultFxFeePercent,
      defaultFxFeeMode: rv.defaultFxFeeMode,
      defaultTransferFeePercent: rv.defaultTransferFeePercent,
      defaultOtherFeePercent: rv.defaultOtherFeePercent,
      defaultGasFeePercent: rv.defaultGasFeePercent,
    },
    feeTiersSample: Array.isArray(tiers?.value) ? tiers.value.slice(0, 3) : null,
    feeTiersByCustomerSample: tiersBy?.value
      ? {
          INDIVIDUAL: (tiersBy.value.INDIVIDUAL || []).slice(0, 2),
          CORPORATE: (tiersBy.value.CORPORATE || []).slice(0, 2),
        }
      : null,
    feeTypes: feeTypes?.value || null,
  };
  console.log(JSON.stringify(out, null, 2));
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
