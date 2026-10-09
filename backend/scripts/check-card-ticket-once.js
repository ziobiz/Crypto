const { PrismaClient } = require('@prisma/client');

const ticketNo = process.argv[2] || '202610060263455341';

(async () => {
  const p = new PrismaClient();
  const t = await p.transactionTicket.findFirst({
    where: { ticketNo },
    include: { usdtPurchase: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
  });
  if (!t) {
    console.log(JSON.stringify({ found: false, ticketNo }));
    await p.$disconnect();
    return;
  }
  const d = t.usdtPurchase;
  console.log(
    JSON.stringify(
      {
        found: true,
        id: t.id,
        ticketNo: t.ticketNo,
        createdAt: t.createdAt,
        status: d?.status,
        paymentMethod: d?.paymentMethod,
        fiatAmount: d ? String(d.fiatAmount) : null,
        fiatCurrency: d?.fiatCurrency,
        expectedUsdt: d ? String(d.expectedUsdtAmount) : null,
        exchangeRate: d ? String(d.exchangeRate) : null,
        cardChargeFiat: d ? String(d.cardChargeFiat) : null,
        cardPayAmount: d ? String(d.cardPayAmount) : null,
        cardPayCurrency: d?.cardPayCurrency,
        cardPaymentStatus: d?.cardPaymentStatus,
        icopayOrderId: d?.icopayOrderId,
        icopayTransactionId: d?.icopayTransactionId,
        cardLast4: d?.cardLast4,
        history: (t.statusHistory || []).map((h) => ({
          from: h.fromStatus,
          to: h.toStatus,
          note: h.note,
          at: h.createdAt,
        })),
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
