const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    include: { customerProfile: true },
  });
  const cid = user.customerProfile.id;

  const cards = await prisma.usdtPurchaseDetail.findMany({
    where: {
      ticket: { customerId: cid },
      adminNote: { contains: 'TEST SEED' },
      paymentMethod: 'CARD',
      OR: [
        { adminNote: { contains: 'rebalanced' } },
        { feePolicySnapshot: { path: ['kind'], equals: 'card' } },
      ],
    },
    include: { ticket: true },
    orderBy: { createdAt: 'asc' },
  });

  // Prefer ones marked rebalanced; take 5 back to FIXED bank
  const rebalanced = cards.filter((c) => String(c.adminNote || '').includes('rebalanced'));
  const pool = rebalanced.length >= 5 ? rebalanced : cards;
  const restore = pool.slice(0, 5);

  for (const u of restore) {
    const fiat = Number(u.fiatAmount);
    await prisma.usdtPurchaseDetail.update({
      where: { id: u.id },
      data: {
        paymentMethod: 'BANK_TRANSFER',
        collectionProvider: 'FIXED',
        depositAmount: fiat,
        depositorName: user.name,
        depositTransferredAt: new Date(u.createdAt.getTime() + 30 * 60 * 1000),
        depositDeadlineAt: new Date(u.createdAt.getTime() + 2 * 3600 * 1000),
        cardFeePercentSnapshot: null,
        cardFeeFiatSnapshot: null,
        cardChargeFiat: null,
        cardPaymentStatus: null,
        cardWaiverAcceptedAt: null,
        icopayOrderId: null,
        icopayTransactionId: null,
        cardLast4: null,
        feePolicySnapshot: { seed: true, kind: 'manual' },
        adminNote: '[TEST SEED] manual',
      },
    });
  }

  const all = await prisma.usdtPurchaseDetail.findMany({
    where: { ticket: { customerId: cid }, adminNote: { contains: 'TEST SEED' } },
  });
  const methods = {};
  const kinds = {};
  for (const u of all) {
    methods[u.paymentMethod] = (methods[u.paymentMethod] || 0) + 1;
    const k =
      u.collectionProvider === 'CURFEX'
        ? 'sandbox'
        : u.paymentMethod === 'CARD'
          ? 'card'
          : 'manual';
    kinds[k] = (kinds[k] || 0) + 1;
  }
  console.log(JSON.stringify({ restored: restore.map((r) => r.ticket.ticketNo), methods, kinds }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
