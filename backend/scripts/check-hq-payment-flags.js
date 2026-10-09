const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  const keys = await p.systemConfig.findMany({
    where: {
      OR: [
        { key: { contains: 'deposit' } },
        { key: { contains: 'platform' } },
        { key: { contains: 'card' } },
        { key: { contains: 'currency' } },
        { key: { contains: 'limit' } },
        { key: { contains: 'risk' } },
      ],
    },
    select: { key: true },
  });
  console.log('keys', keys.map((k) => k.key));

  const interesting = [
    'hq.platform',
    'hq.commission.platform',
    'hq.card_payment',
    'hq.commission.card_payment',
    'hq.commission.usdt_risk',
    'hq.commission.transaction_limits',
  ];
  for (const key of interesting) {
    const row = await p.systemConfig.findUnique({ where: { key } });
    if (!row) continue;
    const v = row.value;
    const slim =
      v && typeof v === 'object'
        ? {
            currencyTrade: v.currencyTrade ?? v.usdtCurrencyTrade,
            depositReceivingAccounts: v.depositReceivingAccounts
              ? Object.fromEntries(
                  Object.entries(v.depositReceivingAccounts).map(([c, a]) => [
                    c,
                    a && {
                      transferEnabled: a.transferEnabled,
                      cardEnabled: a.cardEnabled,
                      remittanceEnabled: a.remittanceEnabled,
                      hasAccount: !!(a.accountNumber || a.bankName),
                    },
                  ]),
                )
              : undefined,
            cardPayment: v.cardPayment ?? v.enabled,
            defaultUsdtFiatCurrency: v.defaultUsdtFiatCurrency,
            transactionLimits: v.transactionLimits
              ? { INDIVIDUAL: v.transactionLimits.INDIVIDUAL, CORPORATE_KRW: v.transactionLimits.CORPORATE?.KRW }
              : undefined,
          }
        : v;
    console.log('\n==', key, '==');
    console.log(JSON.stringify(slim, null, 2));
  }

  // risk limit tiers
  const risk = await p.systemConfig.findFirst({
    where: { OR: [{ key: { contains: 'risk' } }, { key: { contains: 'usdt_risk' } }] },
  });
  if (risk) {
    console.log('\n== risk row', risk.key, '==');
    console.log(JSON.stringify(risk.value, null, 2).slice(0, 4000));
  }

  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
