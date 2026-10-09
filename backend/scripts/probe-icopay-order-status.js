/**
 * Poll ICOPAY checkout status for an order (no secrets printed).
 *   node scripts/probe-icopay-order-status.js 202610060263455341 [sessionId]
 */
const { PrismaClient } = require('@prisma/client');

function pickStatus(data) {
  return String(
    data.paymentStatus ?? data.status ?? data.resultCode ?? data.result_code ?? data.payStatus ?? '',
  );
}

(async () => {
  const orderNo = process.argv[2];
  const sessionHint = process.argv[3] || '';
  if (!orderNo) {
    console.error('usage: node scripts/probe-icopay-order-status.js <orderNo> [sessionId]');
    process.exit(1);
  }
  const p = new PrismaClient();
  const row = await p.systemConfig.findUnique({ where: { key: 'hq.platform.icopay' } });
  const v = row?.value && typeof row.value === 'object' ? row.value : {};
  const ticket = await p.transactionTicket.findFirst({
    where: { ticketNo: orderNo },
    include: { usdtPurchase: true },
  });
  await p.$disconnect();

  const compId = String(v.compId || v.mid || '').trim();
  const secret = String(v.bracketSecret || '').trim();
  const api = String(v.apiBaseUrl || 'https://api.icopay.co.kr').replace(/\/$/, '');
  const sessionId = sessionHint || ticket?.usdtPurchase?.icopayTransactionId || '';
  if (!compId || !secret) {
    console.log(JSON.stringify({ error: 'ICOPAY not configured' }));
    return;
  }

  const qs = new URLSearchParams({ compId, orderNo });
  if (sessionId) qs.set('sessionId', sessionId);
  const res = await fetch(`${api}/api/middleware/v1/merchant/checkout/status?${qs}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Icopay-Merchant-Broker-Secret': secret,
    },
  });
  const raw = await res.json().catch(() => ({}));
  const data = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  const stripKeys = new Set(['secret', 'token', 'sessionToken', 'cardNo', 'pan', 'cvv']);
  const safe = JSON.parse(
    JSON.stringify(raw, (k, val) => (stripKeys.has(k) ? '[redacted]' : val)),
  );
  console.log(
    JSON.stringify(
      {
        http: res.status,
        orderNo,
        sessionIdSet: Boolean(sessionId),
        ticketStatus: ticket?.usdtPurchase?.status || null,
        cardPayAmount: ticket?.usdtPurchase ? String(ticket.usdtPurchase.cardPayAmount) : null,
        parsedStatus: pickStatus(data),
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
        rawKeys: raw && typeof raw === 'object' ? Object.keys(raw) : [],
        safe,
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
