const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  const rows = await p.systemConfig.findMany({
    where: {
      OR: [
        { key: { startsWith: 'hq.platform' } },
        { key: { contains: 'curfex' } },
        { key: { contains: 'collection' } },
        { key: { contains: 'icopay' } },
      ],
    },
  });
  for (const row of rows) {
    const v = row.value;
    console.log('\n==', row.key, '==');
    if (!v || typeof v !== 'object') {
      console.log(v);
      continue;
    }
    const slim = {
      ...Object.fromEntries(
        Object.entries(v).filter(([k]) =>
          [
            'defaultCollectionMode',
            'individualCollectionMode',
            'corporateCollectionMode',
            'collectionMode',
            'enabled',
            'currencies',
            'depositReceivingAccounts',
            'defaultUsdtFiatCurrency',
            'individualDirectRemit',
            'provider',
            'mode',
          ].some((x) => k.toLowerCase().includes(x.toLowerCase()) || k === x),
        ),
      ),
    };
    if (v.depositReceivingAccounts) {
      slim.depositReceivingAccounts = Object.fromEntries(
        Object.entries(v.depositReceivingAccounts).map(([c, a]) => [
          c,
          a && {
            transferEnabled: a.transferEnabled,
            cardEnabled: a.cardEnabled,
            remittanceEnabled: a.remittanceEnabled,
            bankName: a.bankName,
            accountNumber: a.accountNumber ? String(a.accountNumber).slice(0, 6) + '…' : null,
          },
        ]),
      );
    }
    console.log(JSON.stringify(Object.keys(v).length > 20 ? slim : v, null, 2).slice(0, 5000));
  }
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
