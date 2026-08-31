const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const u = await p.user.findFirst({
    where: { email: 'samsung.th@gmail.com' },
    include: { customerProfile: true },
  });
  const list = await p.transactionTicket.findMany({
    where: { customerId: u.customerProfile.id, type: 'USDT_PURCHASE' },
    include: { usdtPurchase: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  for (const t of list) {
    const d = t.usdtPurchase;
    console.log(
      [t.ticketNo, t.createdAt.toISOString().slice(0, 10), d.status, d.paymentMethod, d.collectionProvider, Number(d.fiatAmount), d.fiatCurrency].join(' | '),
    );
  }
  const esc = await p.tradeEscrowDetail.findMany({
    where: { ticket: { customerId: u.customerProfile.id } },
    include: { ticket: true, seller: true },
  });
  for (const e of esc) console.log([e.ticket.ticketNo, e.status, e.seller.email].join(' | '));
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
