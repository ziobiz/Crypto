/**
 * Fix samsung.th test seeds:
 * - Rebalance to 10 BANK + 10 CARD (50/50)
 * - Backfill ledger entries for commissionSettled tickets
 * - Normalize createdAt to Asia/Seoul calendar days (8 days ago .. yesterday)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';

function seoulDayStart(daysAgo) {
  // Approximate: KST = UTC+9
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  // convert back to UTC instant for that KST midnight
  return new Date(kst.getTime() - 9 * 3600 * 1000);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    include: { customerProfile: { include: { recruitingOrg: true } } },
  });
  if (!user?.customerProfile) throw new Error('no user');
  const cid = user.customerProfile.id;
  const orgId = user.customerProfile.recruitingOrgId;

  const tickets = await prisma.transactionTicket.findMany({
    where: {
      customerId: cid,
      usdtPurchase: { adminNote: { contains: 'TEST SEED' } },
    },
    include: { usdtPurchase: true, ledgerEntries: true },
    orderBy: { createdAt: 'asc' },
  });

  // Convert 5 oldest manual BANK tickets to CARD for 50/50
  const manuals = tickets.filter(
    (t) =>
      t.usdtPurchase?.paymentMethod === 'BANK_TRANSFER' &&
      t.usdtPurchase?.collectionProvider === 'FIXED',
  );
  const toCard = manuals.slice(0, 5);
  for (const t of toCard) {
    const fiat = Number(t.usdtPurchase.fiatAmount);
    await prisma.usdtPurchaseDetail.update({
      where: { id: t.usdtPurchase.id },
      data: {
        paymentMethod: 'CARD',
        collectionProvider: null,
        depositAmount: null,
        depositorName: null,
        depositTransferredAt: null,
        depositDeadlineAt: null,
        cardFeePercentSnapshot: 0.03,
        cardFeeFiatSnapshot: +(fiat * 0.03).toFixed(2),
        cardChargeFiat: +(fiat * 1.03).toFixed(2),
        cardPaymentStatus: 'APPROVED',
        cardWaiverAcceptedAt: t.usdtPurchase.createdAt,
        icopayOrderId: `TEST-ORD-${t.ticketNo}`,
        icopayTransactionId: `TEST-TX-${t.id.slice(-8)}`,
        cardLast4: '4242',
        feePolicySnapshot: { seed: true, kind: 'card' },
        adminNote: '[TEST SEED] card (rebalanced 50%)',
      },
    });
  }
  console.log('converted to card', toCard.map((t) => t.ticketNo));

  // Ensure dates sit on KST days 8..1
  const dayTargets = [8, 7, 6, 5, 4, 3, 2, 1];
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const daysAgo = dayTargets[i % dayTargets.length];
    const base = seoulDayStart(daysAgo);
    const createdAt = new Date(base.getTime() + (10 + (i % 8)) * 3600 * 1000 + i * 60 * 1000);
    const completedAt = new Date(createdAt.getTime() + 2 * 3600 * 1000);
    await prisma.transactionTicket.update({
      where: { id: t.id },
      data: { createdAt, updatedAt: completedAt },
    });
    await prisma.usdtPurchaseDetail.update({
      where: { id: t.usdtPurchase.id },
      data: { createdAt, updatedAt: completedAt, exchangeRateAt: createdAt },
    });
  }
  console.log('normalized dates to KST window');

  // Backfill ledger for settled tickets without entries
  const settled = await prisma.transactionTicket.findMany({
    where: {
      customerId: cid,
      commissionSettled: true,
      ledgerEntries: { none: {} },
      OR: [
        { usdtPurchase: { adminNote: { contains: 'TEST SEED' } } },
        { tradeEscrow: { adminNote: { contains: 'TEST SEED' } } },
      ],
    },
    include: { usdtPurchase: true, tradeEscrow: true },
  });

  let ledgerCreated = 0;
  for (const t of settled) {
    if (!orgId) continue;
    let amount = 0;
    let currency = 'KRW';
    if (t.usdtPurchase) {
      amount = Number(t.usdtPurchase.otherFeeSnapshot || 0) + Number(t.usdtPurchase.transferFeeSnapshot || 0);
      if (amount <= 0) amount = 5;
      // ledger currency is fiat CurrencyCode
      currency = t.usdtPurchase.fiatCurrency || 'KRW';
      // convert rough USDT fees to fiat for display
      const rate = Number(t.usdtPurchase.exchangeRate || 1);
      amount = +(amount * rate).toFixed(2);
      if (amount <= 0) amount = 100;
    } else if (t.tradeEscrow) {
      amount = Number(t.tradeEscrow.totalCommissionPool || 0);
      currency = t.tradeEscrow.currency;
      if (amount <= 0) amount = 10;
    }
    await prisma.ledgerEntry.create({
      data: {
        organizationId: orgId,
        ticketId: t.id,
        entryType: 'COMMISSION_EARNED',
        amount,
        currency,
        ratePercent: 0,
        baseAmount: amount,
        description: `${t.type} commission — test seed backfill`,
      },
    });
    ledgerCreated++;
  }
  console.log('ledger backfill', ledgerCreated);

  // Recount
  const usdt = await prisma.usdtPurchaseDetail.findMany({
    where: { ticket: { customerId: cid }, adminNote: { contains: 'TEST SEED' } },
  });
  const methods = {};
  for (const u of usdt) methods[u.paymentMethod] = (methods[u.paymentMethod] || 0) + 1;
  const stillMissing = await prisma.transactionTicket.count({
    where: {
      customerId: cid,
      commissionSettled: true,
      ledgerEntries: { none: {} },
      OR: [
        { usdtPurchase: { adminNote: { contains: 'TEST SEED' } } },
        { tradeEscrow: { adminNote: { contains: 'TEST SEED' } } },
      ],
    },
  });
  console.log(JSON.stringify({ methods, stillMissingLedger: stillMissing, usdt: usdt.length }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
