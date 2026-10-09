const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

/** Enable card for ICOPAY currencies (THB primary + others for testing). */
const ENABLE_CARD_FOR = ['THB', 'JPY', 'USD', 'EUR', 'KRW', 'CNY'];

(async () => {
  const key = 'hq.platform.domains';
  const row = await p.systemConfig.findUnique({ where: { key } });
  if (!row?.value || typeof row.value !== 'object') {
    throw new Error('hq.platform.domains missing');
  }
  const value = { ...row.value };
  const accounts = { ...(value.depositReceivingAccounts || {}) };
  for (const ccy of ENABLE_CARD_FOR) {
    if (!accounts[ccy]) accounts[ccy] = {};
    accounts[ccy] = { ...accounts[ccy], cardEnabled: true };
    console.log('enabled card for', ccy, 'was', row.value.depositReceivingAccounts?.[ccy]?.cardEnabled);
  }
  value.depositReceivingAccounts = accounts;
  await p.systemConfig.update({
    where: { key },
    data: { value },
  });
  console.log('done');
  for (const ccy of Object.keys(accounts).sort()) {
    console.log(
      JSON.stringify({
        ccy,
        transferEnabled: accounts[ccy].transferEnabled,
        cardEnabled: accounts[ccy].cardEnabled,
      }),
    );
  }
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
