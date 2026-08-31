const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Restore open acceptance escrow with FUTURE deadline so it is not auto-voided
  const voided = await prisma.tradeEscrowDetail.findFirst({
    where: {
      adminNote: { contains: 'TEST SEED' },
      OR: [{ status: 'VOIDED' }, { status: 'ESCROW_CREATED' }],
      ticket: { ticketNo: { startsWith: 'ESC-' } },
    },
    include: { ticket: true },
  });
  if (!voided) {
    console.log('no escrow to reopen');
    return;
  }
  const deadline = new Date(Date.now() + 48 * 3600 * 1000);
  await prisma.tradeEscrowDetail.update({
    where: { id: voided.id },
    data: {
      status: 'ESCROW_CREATED',
      voidReason: null,
      buyerAcceptedAt: null,
      sellerAcceptedAt: null,
      sellerDisclaimerAt: null,
      acceptanceDeadlineAt: deadline,
      adminNote: '[TEST SEED] escrow open acceptance',
    },
  });
  console.log('reopened', voided.ticket.ticketNo, 'deadline', deadline.toISOString());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
