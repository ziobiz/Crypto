/** Retry failed R2 scenarios with unique ticket numbers */
const {
  PrismaClient,
  TicketType,
  UsdtPaymentMethod,
  CardPaymentStatus,
  EscrowTradeTier,
} = require('@prisma/client');
const { randomBytes } = require('crypto');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';
const TAG = '[TEST R2]';

function seoulOffsetDays(daysAgo, hour = 12) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return new Date(kst.getTime() - 9 * 3600 * 1000 + hour * 3600 * 1000);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    include: { customerProfile: true, wallets: { where: { isActive: true } } },
  });
  const peer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER', email: { not: EMAIL }, deletedAt: null, customerProfile: { isNot: null } },
  });
  const wallet = user.wallets[0];
  const suf = randomBytes(2).toString('hex');
  const created = [];

  const missingUsdt = [
    { kind: 'sandbox', status: 'COMPLETED', daysAgo: 7, currency: 'JPY', fiat: 211000, hour: 9 },
    { kind: 'sandbox', status: 'ADMIN_REVIEWING', daysAgo: 2, currency: 'JPY', fiat: 176000, hour: 10 },
    { kind: 'sandbox', status: 'DEPOSIT_PROOF_PENDING', daysAgo: 0, currency: 'JPY', fiat: 161000, hour: 11, futureDeadline: true },
    { kind: 'manual', status: 'ADMIN_REVIEWING', daysAgo: 1, currency: 'JPY', fiat: 251000, hour: 12 },
  ];

  for (let i = 0; i < missingUsdt.length; i++) {
    const row = missingUsdt[i];
    const createdAt = seoulOffsetDays(row.daysAgo, row.hour);
    const tNo = `USDT-R2B-${suf}-${9100 + i}`;
    const rate = row.currency === 'JPY' ? 148.5 : 1380;
    const net = +(row.fiat / rate - 3.5).toFixed(8);
    const isSandbox = row.kind === 'sandbox';
    await prisma.transactionTicket.create({
      data: {
        ticketNo: tNo,
        type: TicketType.USDT_PURCHASE,
        customerId: user.customerProfile.id,
        commissionSettled: row.status === 'COMPLETED',
        createdAt,
        updatedAt: createdAt,
        usdtPurchase: {
          create: {
            status: row.status,
            paymentMethod: UsdtPaymentMethod.BANK_TRANSFER,
            fiatAmount: row.fiat,
            fiatCurrency: row.currency,
            exchangeRate: rate,
            exchangeRateAt: createdAt,
            exchangeSource: 'test_r2b',
            expectedUsdtAmount: net,
            depositDeadlineAt: row.futureDeadline
              ? new Date(Date.now() + 2 * 3600 * 1000)
              : new Date(createdAt.getTime() + 2 * 3600 * 1000),
            fxFeePercentSnapshot: 0.005,
            gasFeeSnapshot: 1,
            transferFeeSnapshot: 2,
            otherFeeSnapshot: 0.5,
            platformFeeSnapshot: 0,
            feePolicySnapshot: { seed: 'R2B', kind: row.kind },
            collectionProvider: isSandbox ? 'CURFEX' : 'FIXED',
            curfexRefNo: isSandbox ? `R2B-${suf}` : null,
            collectionAccountJson: isSandbox
              ? { bankName: 'Sandbox Ginko', accountNo: `R2B${i}`, accountName: user.name, sandbox: true }
              : undefined,
            walletId: wallet.id,
            usdtTxId: row.status === 'COMPLETED' ? `0xr2b${suf}${i}` : null,
            actualUsdtAmount: row.status === 'COMPLETED' ? net : null,
            adminNote: `${TAG} ${row.kind} ${row.status} retry`,
            createdAt,
            updatedAt: createdAt,
          },
        },
      },
    });
    created.push(tNo);
  }

  const missingEsc = [
    { status: 'ESCROW_COMPLETED', daysAgo: 6, title: 'R2B Escrow completed' },
    { status: 'ESCROW_CREATED', daysAgo: 0, title: 'R2B Escrow open', futureDeadline: true },
    { status: 'CANCELLED', daysAgo: 4, title: 'R2B Escrow cancelled' },
  ];
  for (let i = 0; i < missingEsc.length; i++) {
    const ep = missingEsc[i];
    const createdAt = seoulOffsetDays(ep.daysAgo, 13);
    const tNo = `ESC-R2B-${suf}-${9200 + i}`;
    await prisma.transactionTicket.create({
      data: {
        ticketNo: tNo,
        type: TicketType.TRADE_ESCROW,
        customerId: user.customerProfile.id,
        commissionSettled: ep.status === 'ESCROW_COMPLETED',
        createdAt,
        updatedAt: createdAt,
        tradeEscrow: {
          create: {
            status: ep.status,
            tradeTier: EscrowTradeTier.STANDARD,
            buyerId: user.id,
            sellerId: peer.id,
            initiatedByUserId: user.id,
            initiatedAsRole: 'BUYER',
            title: ep.title,
            amount: 13000 + i * 1000,
            currency: 'USD',
            totalCommissionPool: 130,
            acceptanceDeadlineAt: ep.futureDeadline
              ? new Date(Date.now() + 48 * 3600 * 1000)
              : new Date(createdAt.getTime() + 48 * 3600 * 1000),
            buyerAcceptedAt: ep.status === 'ESCROW_CREATED' ? null : createdAt,
            sellerAcceptedAt: ep.status === 'ESCROW_CREATED' || ep.status === 'CANCELLED' ? null : createdAt,
            buyerDisclaimerAt: createdAt,
            sellerDisclaimerAt: ep.status === 'ESCROW_CREATED' ? null : createdAt,
            payoutTxId: ep.status === 'ESCROW_COMPLETED' ? `r2b-${suf}` : null,
            payoutProcessedAt: ep.status === 'ESCROW_COMPLETED' ? createdAt : null,
            adminNote: `${TAG} escrow ${ep.status} retry`,
            createdAt,
            updatedAt: createdAt,
          },
        },
      },
    });
    created.push(tNo);
  }

  // Validate card serialize bug
  const usdtSvc = require('../dist/services/usdt-purchase.service');
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', deletedAt: null } });
  const listed = await usdtSvc.listUsdtPurchaseTickets({
    id: admin.id,
    role: 'SUPER_ADMIN',
    customerProfileId: null,
    organizationPath: null,
  });
  const cardBugs = listed.filter(
    (t) =>
      t.adminNote &&
      String(t.adminNote).startsWith(TAG) &&
      t.paymentMethod === 'CARD' &&
      t.collectionProvider === 'FIXED',
  );
  console.log(
    JSON.stringify(
      {
        created,
        cardMislabelledAsFixed: cardBugs.length,
        sampleCard: cardBugs[0]
          ? { ticketNo: cardBugs[0].ticketNo, paymentMethod: cardBugs[0].paymentMethod, collectionProvider: cardBugs[0].collectionProvider }
          : null,
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
