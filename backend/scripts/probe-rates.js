const { getExchangeRateDisplay } = require('../dist/services/exchange-rate.service');

(async () => {
  const out = {};
  for (const c of ['USD', 'EUR', 'JPY', 'KRW', 'THB']) {
    try {
      out[c] = await getExchangeRateDisplay(c);
    } catch (e) {
      out[c] = { error: e.message };
    }
  }
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
