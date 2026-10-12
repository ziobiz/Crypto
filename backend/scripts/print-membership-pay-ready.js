/** Live ops check: card / ICOPAY / sellable membership products (no secrets). */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function summarizeIcopay(v) {
  if (!v || typeof v !== 'object') return { missing: true };
  return {
    enabled: v.enabled === true,
    compId: v.compId || v.mid || null,
    mid: v.mid || null,
    activeBrokerEnv: v.activeBrokerEnv || null,
    sandbox: v.sandbox === true,
    channel: v.channel || null,
    apiBaseUrl: v.apiBaseUrl || null,
    hasBracketSecret: Boolean(v.bracketSecret && String(v.bracketSecret).trim()),
    bracketSecretLen: v.bracketSecret ? String(v.bracketSecret).trim().length : 0,
  };
}

function summarizeCard(v) {
  if (!v || typeof v !== 'object') return { missing: true };
  return {
    enabled: v.enabled === true,
    cardFeeMode: v.cardFeeMode || null,
    cardFeePercent: v.cardFeePercent,
  };
}

(async () => {
  const card = await p.systemConfig.findUnique({ where: { key: 'hq.payment.card' } });
  const icopay = await p.systemConfig.findUnique({ where: { key: 'hq.platform.icopay' } });
  const products = await p.systemConfig.findUnique({
    where: { key: 'hq.paid_membership.products' },
  });

  const cardS = summarizeCard(card && card.value);
  const icopayS = summarizeIcopay(icopay && icopay.value);
  const items =
    products && products.value && Array.isArray(products.value.items)
      ? products.value.items
      : [];
  const sellable = items
    .filter((i) => i && i.enabled && Number(i.price) > 0)
    .map((i) => ({
      id: i.id,
      name: i.name,
      grade: i.grade,
      customerType: i.customerType,
      payMeans: i.payMeans,
      currency: i.currency,
      price: i.price,
    }));

  const cardCheckoutReady =
    cardS.enabled === true &&
    icopayS.enabled === true &&
    Boolean(icopayS.compId) &&
    icopayS.hasBracketSecret === true;

  const allProducts = items.map((i) => ({
    id: i.id,
    name: i.name,
    grade: i.grade,
    customerType: i.customerType,
    enabled: i.enabled === true,
    payMeans: i.payMeans,
    currency: i.currency,
    price: i.price,
    periodDays: i.periodDays,
  }));

  console.log(
    JSON.stringify(
      {
        cardPayment: cardS,
        icopay: icopayS,
        membershipCardCheckoutReady: cardCheckoutReady,
        membershipCryptoCheckoutReady: false,
        cryptoNote: 'Code hard-blocks CRYPTO with CRYPTO_CHECKOUT_NOT_READY (phase-1 card only)',
        productCount: allProducts.length,
        sellableProductCount: sellable.length,
        allProducts,
        sellable,
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch(async (e) => {
  console.error(String(e && e.stack ? e.stack : e));
  try {
    await p.$disconnect();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
