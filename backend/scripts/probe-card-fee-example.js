/**
 * Live card fee numeric example using production fee defaults + live rates.
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();

  // Prefer compiled services if present
  let getRate;
  try {
    ({ getExchangeRateDisplay: getRate } = require('../dist/services/exchange-rate.service'));
  } catch {
    try {
      ({ getExchangeRateDisplay: getRate } = require('./dist/services/exchange-rate.service'));
    } catch {
      getRate = null;
    }
  }

  function round8(n) {
    return Number(Number(n).toFixed(8));
  }
  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  const risk = (await p.systemConfig.findUnique({ where: { key: 'hq.commission.risk' } }))?.value || {};
  const card = (await p.systemConfig.findUnique({ where: { key: 'hq.payment.card' } }))?.value || {};
  const orgShare = (await p.systemConfig.findUnique({ where: { key: 'hq.commission.org_share' } }))?.value;
  const defaultType = await p.feeTypeTemplate.findFirst({
    where: { ticketKind: 'USDT_PURCHASE', isDefault: true },
  });
  const share = defaultType?.config?.USDT_PURCHASE || orgShare?.USDT_PURCHASE || {};
  let opPct = 0;
  let opFixed = 0;
  for (const k of Object.keys(share)) {
    opPct += Number(share[k]?.poolPercent) || 0;
    opFixed += Number(share[k]?.perTicketUsdt) || 0;
  }

  const fxPct = Number(risk.defaultFxFeePercent) || 0;
  const gas = Number(risk.defaultGasFeeUsdt) || 0;
  const transfer = Number(risk.defaultTransferFeeUsdt) || 0;
  const otherFixed = Number(risk.defaultOtherFeeUsdt) || 0;
  const otherPct = Number(risk.defaultOtherFeePercent) || 0;
  const cardPct = Number(card.cardFeePercent) || 0;

  const pct = fxPct + otherPct + opPct;
  const fixed = gas + transfer + otherFixed + opFixed;

  const rates = {};
  if (getRate) {
    for (const c of ['USD', 'EUR', 'JPY', 'KRW', 'THB']) {
      try {
        const d = await getRate(c);
        rates[c] = Number(d.rate ?? d.exchangeRate);
      } catch (e) {
        rates[c] = `ERR:${e.message}`;
      }
    }
  }

  const target = 1000;
  const mult = 1 - pct / 100;
  const gross = round8((target + fixed) / mult);
  const fx = round8((gross * fxPct) / 100);
  const other = round8((gross * otherPct) / 100 + otherFixed);
  const operating = round8((gross * opPct) / 100 + opFixed);
  const symbolTotal = round8(fx + gas + transfer + other + operating);

  const fiatBlock = {};
  for (const [cur, rate] of Object.entries(rates)) {
    if (!(Number(rate) > 0)) {
      fiatBlock[cur] = { rate };
      continue;
    }
    const requiredFiat = round2(gross * Number(rate));
    const cardFeeFiat = round2((requiredFiat * cardPct) / 100);
    const cardCharge = round2(requiredFiat + cardFeeFiat);
    fiatBlock[cur] = {
      rate: Number(rate),
      requiredFiat,
      cardFeeFiat,
      cardCharge,
      cardFeePercent: cardPct,
    };
  }

  console.log(
    JSON.stringify(
      {
        note: 'Default fee type RATE C, no local premium, no wallet override',
        defaultFeeType: defaultType ? { code: defaultType.code, name: defaultType.name } : null,
        applied: {
          fxPct,
          gasUsdt: gas,
          transferUsdt: transfer,
          otherUsdt: otherFixed,
          otherPct,
          operatingPct: opPct,
          operatingFixedUsdt: opFixed,
          cardPct,
        },
        example_net_1000_USDT: {
          grossUsdt: gross,
          fxFeeUsdt: fx,
          gasFeeUsdt: gas,
          transferFeeUsdt: transfer,
          otherFeeUsdt: other,
          operatingFeeUsdt: operating,
          symbolFeeTotalUsdt: symbolTotal,
          netUsdt: target,
          byCurrency: fiatBlock,
        },
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
