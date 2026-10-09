const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const row = await p.systemConfig.findUnique({ where: { key: 'hq.platform.domains' } });
  const accounts = row?.value?.depositReceivingAccounts || {};
  console.log('account currencies', Object.keys(accounts));
  for (const [ccy, acc] of Object.entries(accounts)) {
    const a = acc || {};
    console.log(
      JSON.stringify({
        ccy,
        transferEnabled: a.transferEnabled,
        cardEnabled: a.cardEnabled,
      }),
    );
  }
  if (!Object.keys(accounts).length) console.log('EMPTY accounts — defaults apply (card true)');
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
