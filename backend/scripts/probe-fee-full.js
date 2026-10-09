const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const risk = await p.systemConfig.findUnique({ where: { key: 'hq.commission.risk' } });
  const card = await p.systemConfig.findUnique({ where: { key: 'hq.payment.card' } });
  const tiersBy = await p.systemConfig.findUnique({
    where: { key: 'hq.commission.fee_tiers_by_customer' },
  });
  const orgShare = await p.systemConfig.findUnique({ where: { key: 'hq.commission.org_share' } });
  const rv = risk?.value || {};
  const out = {
    risk: {
      defaultFxFeeMode: rv.defaultFxFeeMode,
      defaultFxFeePercent: rv.defaultFxFeePercent,
      defaultFxFeeUsdt: rv.defaultFxFeeUsdt,
      defaultGasFeeMode: rv.defaultGasFeeMode,
      defaultGasFeePercent: rv.defaultGasFeePercent,
      defaultGasFeeUsdt: rv.defaultGasFeeUsdt,
      defaultTransferFeeMode: rv.defaultTransferFeeMode,
      defaultTransferFeePercent: rv.defaultTransferFeePercent,
      defaultTransferFeeUsdt: rv.defaultTransferFeeUsdt,
      defaultOtherFeeMode: rv.defaultOtherFeeMode,
      defaultOtherFeePercent: rv.defaultOtherFeePercent,
      defaultOtherFeeUsdt: rv.defaultOtherFeeUsdt,
    },
    card: {
      cardFeeMode: card?.value?.cardFeeMode,
      cardFeePercent: card?.value?.cardFeePercent,
      cardFeeByBrand: card?.value?.cardFeeByBrand,
    },
    orgShare: orgShare?.value || null,
    tiersIndiv: (tiersBy?.value?.INDIVIDUAL || []).slice(0, 3),
    tiersCorp: (tiersBy?.value?.CORPORATE || []).slice(0, 3),
    feeTypeCount: await p.feeTypeTemplate.count().catch(() => null),
    feeTypes: await p.feeTypeTemplate
      .findMany({
        select: { ticketKind: true, code: true, name: true, isDefault: true, config: true },
        take: 10,
      })
      .catch(() => null),
  };
  console.log(JSON.stringify(out, null, 2));
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
