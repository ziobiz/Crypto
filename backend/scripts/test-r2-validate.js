/** Round-2 coverage + serialize invariant check for samsung.th@gmail.com */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';
const TAG = '[TEST R2]';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL, deletedAt: null },
    include: { customerProfile: true },
  });
  if (!user?.customerProfile) throw new Error('customer missing');
  const cid = user.customerProfile.id;

  const usdt = await prisma.usdtPurchaseDetail.findMany({
    where: {
      ticket: { customerId: cid },
      OR: [{ adminNote: { startsWith: TAG } }, { adminNote: { contains: TAG } }],
    },
    include: { ticket: { select: { ticketNo: true, commissionSettled: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const esc = await prisma.tradeEscrowDetail.findMany({
    where: {
      ticket: { customerId: cid },
      OR: [{ adminNote: { startsWith: TAG } }, { adminNote: { contains: TAG } }],
    },
    include: { ticket: { select: { ticketNo: true, commissionSettled: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const usdtBy = {};
  for (const u of usdt) {
    const kind =
      u.paymentMethod === 'CARD'
        ? 'card'
        : u.collectionProvider === 'CURFEX'
          ? 'sandbox'
          : 'manual';
    const key = `${kind}|${u.status}`;
    usdtBy[key] = (usdtBy[key] || 0) + 1;
  }
  const escBy = {};
  for (const e of esc) {
    escBy[e.status] = (escBy[e.status] || 0) + 1;
  }

  const issues = [];
  const requiredUsdt = [
    'sandbox|COMPLETED',
    'sandbox|ADMIN_REVIEWING',
    'sandbox|DEPOSIT_PROOF_PENDING',
    'sandbox|TRANSFER_IN_PROGRESS',
    'sandbox|CANCELLED',
    'manual|COMPLETED',
    'manual|DEPOSIT_PROOF_PENDING',
    'manual|ADMIN_REVIEWING',
    'manual|APPLICATION_COMPLETED',
    'manual|TRANSFER_IN_PROGRESS',
    'manual|CANCELLED',
    'card|COMPLETED',
    'card|CARD_PAYMENT_PENDING',
    'card|ADMIN_REVIEWING',
    'card|CANCELLED',
    'card|TRANSFER_IN_PROGRESS',
  ];
  for (const k of requiredUsdt) {
    if (!usdtBy[k]) issues.push(`missing USDT scenario: ${k}`);
  }
  const requiredEsc = [
    'ESCROW_COMPLETED',
    'ESCROW_CREATED',
    'CONTRACT_CONFIRMED',
    'BUYER_DEPOSIT_PROOF',
    'SHIPPING_STARTED',
    'CANCELLED',
  ];
  for (const k of requiredEsc) {
    if (!escBy[k]) issues.push(`missing escrow scenario: ${k}`);
  }

  let cardMislabelled = 0;
  try {
    const usdtSvc = require('../dist/services/usdt-purchase.service');
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', deletedAt: null } });
    const listed = await usdtSvc.listUsdtPurchaseTickets({
      id: admin.id,
      role: 'SUPER_ADMIN',
      customerProfileId: null,
      organizationPath: null,
    });
    const tagged = listed.filter((t) => t.adminNote && String(t.adminNote).includes(TAG));
    cardMislabelled = tagged.filter(
      (t) => t.paymentMethod === 'CARD' && t.collectionProvider === 'FIXED',
    ).length;
    if (cardMislabelled > 0) {
      issues.push(`card tickets serialized as FIXED: ${cardMislabelled}`);
    }
  } catch (e) {
    issues.push(`serialize check failed: ${e.message}`);
  }

  console.log(
    JSON.stringify(
      {
        email: EMAIL,
        usdtCount: usdt.length,
        escrowCount: esc.length,
        usdtBy,
        escBy,
        issues,
        ok: issues.length === 0,
      },
      null,
      2,
    ),
  );
  if (issues.length) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
