/**
 * Sync CARD_PAYMENT_PENDING tickets against ICOPAY — approve paid, cancel failed/expired.
 *   node scripts/sync-pending-card-icopay.js [ticketNo?]
 */
const {
  PrismaClient,
  CardPaymentStatus,
  UsdtPurchaseStatus,
  UsdtPaymentMethod,
} = require('@prisma/client');

const onlyTicketNo = process.argv[2] || '';
const ABANDONED_MS = 30 * 60 * 1000;

function isPaid(status) {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  return (
    ['APPROVED', 'PAID', 'SUCCESS', 'SUCCEEDED', 'SUCCEED', 'COMPLETED', 'CAPTURED', 'OK', 'Y'].includes(s) ||
    ['0000', '00', '0'].includes(s)
  );
}

function isTerminalFail(status) {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  return [
    'DECLINED',
    'FAILED',
    'FAIL',
    'FAILURE',
    'CANCELLED',
    'CANCELED',
    'EXPIRED',
    'ERROR',
    'REJECTED',
    'VOID',
    'ABORTED',
  ].includes(s);
}

(async () => {
  const p = new PrismaClient();
  const ic = await p.systemConfig.findUnique({ where: { key: 'hq.platform.icopay' } });
  const v = ic?.value && typeof ic.value === 'object' ? ic.value : {};
  const compId = String(v.compId || v.mid || '').trim();
  const secret = String(v.bracketSecret || '').trim();
  const api = String(v.apiBaseUrl || 'https://api.icopay.co').replace(/\/$/, '');
  if (!compId || !secret) {
    console.log(JSON.stringify({ error: 'ICOPAY not configured' }));
    await p.$disconnect();
    return;
  }

  const where = onlyTicketNo
    ? { ticketNo: onlyTicketNo }
    : {
        usdtPurchase: {
          paymentMethod: UsdtPaymentMethod.CARD,
          status: UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
        },
      };

  const tickets = await p.transactionTicket.findMany({
    where,
    include: {
      usdtPurchase: true,
      customer: { select: { userId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const results = [];
  for (const t of tickets) {
    const d = t.usdtPurchase;
    if (!d || d.paymentMethod !== UsdtPaymentMethod.CARD) {
      results.push({ ticketNo: t.ticketNo, action: 'skip', reason: 'not card' });
      continue;
    }

    if (
      d.cardPaymentStatus === CardPaymentStatus.APPROVED ||
      d.status === UsdtPurchaseStatus.ADMIN_REVIEWING ||
      d.status === UsdtPurchaseStatus.COMPLETED ||
      d.status === UsdtPurchaseStatus.CANCELLED
    ) {
      results.push({
        ticketNo: t.ticketNo,
        action: 'already',
        status: d.status,
        cardPaymentStatus: d.cardPaymentStatus,
      });
      continue;
    }

    const orderNo = d.icopayOrderId || t.ticketNo;
    const qs = new URLSearchParams({ compId, orderNo });
    if (d.icopayTransactionId) qs.set('sessionId', d.icopayTransactionId);
    const res = await fetch(`${api}/api/middleware/v1/merchant/checkout/status?${qs}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Icopay-Merchant-Broker-Secret': secret,
      },
    });
    const raw = await res.json().catch(() => ({}));
    const data = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    const paymentStatus = String(data.paymentStatus ?? data.status ?? 'UNKNOWN').toUpperCase();
    const transactionId = data.transactionId
      ? String(data.transactionId)
      : data.tid
        ? String(data.tid)
        : '';
    const ageMs = Date.now() - new Date(t.createdAt).getTime();
    const actorUserId = t.customer?.userId;
    if (!actorUserId) {
      results.push({ ticketNo: t.ticketNo, action: 'error', reason: 'no actor' });
      continue;
    }

    let paid = isPaid(paymentStatus);
    let fail =
      isTerminalFail(paymentStatus) ||
      ((paymentStatus === 'NOT_FOUND' || paymentStatus === 'UNKNOWN') && ageMs >= ABANDONED_MS);

    if (!paid && !fail) {
      results.push({ ticketNo: t.ticketNo, action: 'leave', paymentStatus, status: d.status });
      continue;
    }

    await p.$transaction(async (tx) => {
      await tx.usdtPurchaseDetail.update({
        where: { ticketId: t.id },
        data: paid
          ? {
              status: UsdtPurchaseStatus.ADMIN_REVIEWING,
              cardPaymentStatus: CardPaymentStatus.APPROVED,
              icopayTransactionId: transactionId || d.icopayTransactionId,
            }
          : {
              status: UsdtPurchaseStatus.CANCELLED,
              cardPaymentStatus: CardPaymentStatus.DECLINED,
              cancelReason: `ICOPAY ${paymentStatus}`,
            },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: t.id,
          fromStatus: d.status,
          toStatus: paid ? UsdtPurchaseStatus.ADMIN_REVIEWING : UsdtPurchaseStatus.CANCELLED,
          changedById: actorUserId,
          note: paid
            ? `ICOPAY status 승인 (${transactionId || paymentStatus})`
            : `ICOPAY status 거래 실패 (${paymentStatus})`,
        },
      });
    });

    results.push({
      ticketNo: t.ticketNo,
      action: paid ? 'approved' : 'failed',
      paymentStatus,
      transactionId: transactionId || null,
      to: paid ? 'ADMIN_REVIEWING' : 'CANCELLED',
    });
  }

  console.log(JSON.stringify({ count: results.length, results }, null, 2));
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
