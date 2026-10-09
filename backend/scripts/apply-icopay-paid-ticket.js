/** Apply ICOPAY-confirmed PAID onto a pending card ticket. */
const { PrismaClient, CardPaymentStatus, UsdtPurchaseStatus } = require('@prisma/client');

const ticketNo = process.argv[2];
const transactionId = process.argv[3] || '';
if (!ticketNo) {
  console.error('usage: node scripts/apply-icopay-paid-ticket.js <ticketNo> [transactionId]');
  process.exit(1);
}

(async () => {
  const p = new PrismaClient();
  const t = await p.transactionTicket.findFirst({
    where: { ticketNo },
    include: { usdtPurchase: true, customer: { select: { userId: true } } },
  });
  if (!t?.usdtPurchase) {
    console.log(JSON.stringify({ ok: false, reason: 'not found' }));
    await p.$disconnect();
    return;
  }
  if (
    t.usdtPurchase.cardPaymentStatus === CardPaymentStatus.APPROVED ||
    t.usdtPurchase.status === UsdtPurchaseStatus.ADMIN_REVIEWING ||
    t.usdtPurchase.status === UsdtPurchaseStatus.COMPLETED
  ) {
    console.log(JSON.stringify({ ok: true, already: true, status: t.usdtPurchase.status }));
    await p.$disconnect();
    return;
  }
  const actorUserId = t.customer?.userId;
  if (!actorUserId) throw new Error('no actor');
  await p.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId: t.id },
      data: {
        status: UsdtPurchaseStatus.ADMIN_REVIEWING,
        cardPaymentStatus: CardPaymentStatus.APPROVED,
        icopayTransactionId: transactionId || t.usdtPurchase.icopayTransactionId,
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId: t.id,
        fromStatus: t.usdtPurchase.status,
        toStatus: UsdtPurchaseStatus.ADMIN_REVIEWING,
        changedById: actorUserId,
        note: `ICOPAY status 승인 (${transactionId || 'PAID'})`,
      },
    });
  });
  const after = await p.usdtPurchaseDetail.findUnique({
    where: { ticketId: t.id },
    select: { status: true, cardPaymentStatus: true, icopayTransactionId: true },
  });
  console.log(JSON.stringify({ ok: true, ticketNo, ...after }, null, 2));
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
