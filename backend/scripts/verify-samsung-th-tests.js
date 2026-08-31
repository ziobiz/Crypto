const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    include: { customerProfile: true },
  });
  const cid = user.customerProfile.id;

  const usdt = await prisma.usdtPurchaseDetail.findMany({
    where: { ticket: { customerId: cid }, adminNote: { contains: 'TEST SEED' } },
    include: { ticket: true },
    orderBy: { createdAt: 'asc' },
  });

  const byKind = {};
  const byMethod = {};
  const byCurrency = {};
  const byDay = {};
  const issues = [];

  for (const u of usdt) {
    const kind = u.feePolicySnapshot?.kind || u.collectionProvider || '?';
    byKind[kind] = (byKind[kind] || 0) + 1;
    byMethod[u.paymentMethod] = (byMethod[u.paymentMethod] || 0) + 1;
    byCurrency[u.fiatCurrency] = (byCurrency[u.fiatCurrency] || 0) + 1;
    const day = u.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;

    if (u.status !== 'COMPLETED') issues.push(`${u.ticket.ticketNo} status=${u.status}`);
    if (!u.walletId) issues.push(`${u.ticket.ticketNo} missing wallet`);
    if (u.paymentMethod === 'BANK_TRANSFER' && !u.collectionProvider) {
      issues.push(`${u.ticket.ticketNo} bank without collectionProvider`);
    }
    if (u.collectionProvider === 'CURFEX' && !u.curfexDepositDetectedAt) {
      issues.push(`${u.ticket.ticketNo} CURFEX without deposit detect`);
    }
    if (u.paymentMethod === 'CARD' && u.cardPaymentStatus !== 'APPROVED') {
      issues.push(`${u.ticket.ticketNo} card not APPROVED`);
    }
    if (!u.usdtTxId || !u.actualUsdtAmount) {
      issues.push(`${u.ticket.ticketNo} missing tx completion fields`);
    }
    // date window: 8 days ago .. yesterday
    const ageDays = (Date.now() - u.createdAt.getTime()) / 86400000;
    if (ageDays < 0.9 || ageDays > 8.5) {
      issues.push(`${u.ticket.ticketNo} ageDays=${ageDays.toFixed(2)} out of window`);
    }
  }

  const escrows = await prisma.tradeEscrowDetail.findMany({
    where: { ticket: { customerId: cid }, adminNote: { contains: 'TEST SEED' } },
    include: { ticket: true, buyer: true, seller: true },
  });

  for (const e of escrows) {
    if (e.buyerId === e.sellerId) issues.push(`${e.ticket.ticketNo} buyer=seller`);
    if (!e.title) issues.push(`${e.ticket.ticketNo} empty title`);
  }

  // ledger entries for settled tickets
  const settledNoLedger = await prisma.transactionTicket.findMany({
    where: {
      customerId: cid,
      commissionSettled: true,
      ledgerEntries: { none: {} },
      OR: [
        { usdtPurchase: { adminNote: { contains: 'TEST SEED' } } },
        { tradeEscrow: { adminNote: { contains: 'TEST SEED' } } },
      ],
    },
    select: { ticketNo: true, type: true },
  });
  if (settledNoLedger.length) {
    issues.push(
      `commissionSettled but no ledgerEntries: ${settledNoLedger.map((t) => t.ticketNo).join(', ')}`,
    );
  }

  // list API simulation fields used by frontend
  const sample = usdt[0];
  const listShapeOk =
    sample &&
    sample.ticket?.ticketNo &&
    sample.fiatAmount != null &&
    sample.expectedUsdtAmount != null;

  console.log(
    JSON.stringify(
      {
        usdtCount: usdt.length,
        byKind,
        byMethod,
        byCurrency,
        byDay,
        escrowCount: escrows.length,
        escrowStatuses: escrows.map((e) => e.status),
        settledNoLedger: settledNoLedger.length,
        listShapeOk,
        issues,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
