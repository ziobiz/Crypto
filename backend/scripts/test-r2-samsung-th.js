/**
 * Round-2 thorough scenario seed + validation for samsung.th@gmail.com
 * Creates ~20 USDT purchases across statuses/methods + escrow cases,
 * then validates list/serialize invariants.
 */
const {
  PrismaClient,
  TicketType,
  UsdtPurchaseStatus,
  UsdtPaymentMethod,
  TradeEscrowStatus,
  EscrowTradeTier,
  CardPaymentStatus,
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
  const utcMidnight = new Date(kst.getTime() - 9 * 3600 * 1000);
  return new Date(utcMidnight.getTime() + hour * 3600 * 1000);
}

function ticketNo(prefix, i, createdAt) {
  const ymd = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-R2-${ymd}-${String(9100 + i)}`;
}

async function main() {
  const issues = [];
  const results = [];

  const user = await prisma.user.findFirst({
    where: { email: EMAIL, deletedAt: null },
    include: {
      customerProfile: true,
      wallets: { where: { isActive: true } },
    },
  });
  if (!user?.customerProfile) throw new Error('customer missing');
  const wallet = user.wallets[0];
  if (!wallet) throw new Error('wallet missing');

  const peer = await prisma.user.findFirst({
    where: {
      role: 'CUSTOMER',
      email: { not: EMAIL },
      deletedAt: null,
      customerProfile: { isNot: null },
    },
  });
  if (!peer) throw new Error('peer customer missing');

  const rates = { JPY: 148.5, KRW: 1380, THB: 34.2, USD: 1, CNY: 7.2 };

  /** Japan-primary test account — all scenarios in JPY */
  const usdtPlan = [
    // Sandbox CURFEX — various stages
    { kind: 'sandbox', status: 'COMPLETED', daysAgo: 7, currency: 'JPY', fiat: 210000, hour: 9 },
    { kind: 'sandbox', status: 'ADMIN_REVIEWING', daysAgo: 2, currency: 'JPY', fiat: 175000, hour: 10 },
    { kind: 'sandbox', status: 'DEPOSIT_PROOF_PENDING', daysAgo: 0, currency: 'JPY', fiat: 160000, hour: 11, futureDeadline: true },
    { kind: 'sandbox', status: 'TRANSFER_IN_PROGRESS', daysAgo: 1, currency: 'JPY', fiat: 190000, hour: 14 },
    { kind: 'sandbox', status: 'CANCELLED', daysAgo: 5, currency: 'JPY', fiat: 100000, hour: 8 },
    // Manual FIXED bank (JPY)
    { kind: 'manual', status: 'COMPLETED', daysAgo: 8, currency: 'JPY', fiat: 235000, hour: 11 },
    { kind: 'manual', status: 'COMPLETED', daysAgo: 4, currency: 'JPY', fiat: 198000, hour: 13 },
    { kind: 'manual', status: 'DEPOSIT_PROOF_PENDING', daysAgo: 0, currency: 'JPY', fiat: 185000, hour: 15, futureDeadline: true },
    { kind: 'manual', status: 'ADMIN_REVIEWING', daysAgo: 1, currency: 'JPY', fiat: 250000, hour: 12 },
    { kind: 'manual', status: 'APPLICATION_COMPLETED', daysAgo: 0, currency: 'JPY', fiat: 142000, hour: 16 },
    { kind: 'manual', status: 'TRANSFER_IN_PROGRESS', daysAgo: 3, currency: 'JPY', fiat: 168000, hour: 9 },
    { kind: 'manual', status: 'CANCELLED', daysAgo: 6, currency: 'JPY', fiat: 95000, hour: 10 },
    // Card (JPY)
    { kind: 'card', status: 'COMPLETED', daysAgo: 7, currency: 'JPY', fiat: 88000, hour: 17 },
    { kind: 'card', status: 'COMPLETED', daysAgo: 2, currency: 'JPY', fiat: 112000, hour: 18 },
    { kind: 'card', status: 'CARD_PAYMENT_PENDING', daysAgo: 0, currency: 'JPY', fiat: 72000, hour: 19 },
    { kind: 'card', status: 'ADMIN_REVIEWING', daysAgo: 1, currency: 'JPY', fiat: 96000, hour: 11 },
    { kind: 'card', status: 'CANCELLED', daysAgo: 5, currency: 'JPY', fiat: 55000, hour: 12 },
    // Extra COMPLETED mix to reach ~20
    { kind: 'manual', status: 'COMPLETED', daysAgo: 3, currency: 'JPY', fiat: 320000, hour: 14 },
    { kind: 'sandbox', status: 'COMPLETED', daysAgo: 6, currency: 'JPY', fiat: 230000, hour: 8 },
    { kind: 'card', status: 'TRANSFER_IN_PROGRESS', daysAgo: 2, currency: 'JPY', fiat: 99000, hour: 15 },
  ];

  console.log('USDT plan', usdtPlan.length);

  for (let i = 0; i < usdtPlan.length; i++) {
    const row = usdtPlan[i];
    const createdAt = seoulOffsetDays(row.daysAgo, row.hour);
    const rate = rates[row.currency] || 1;
    const gross = row.fiat / rate;
    const fxFee = +(gross * 0.005).toFixed(8);
    const gas = 1;
    const transfer = 2;
    const other = 0.5;
    const net = +(gross - fxFee - gas - transfer - other).toFixed(8);
    const isCard = row.kind === 'card';
    const isSandbox = row.kind === 'sandbox';
    const status = row.status;
    const completed = status === 'COMPLETED';
    const cancelled = status === 'CANCELLED';
    const tNo = ticketNo('USDT', i, createdAt);

    let depositDeadlineAt = null;
    if (!isCard && ['DEPOSIT_PROOF_PENDING', 'APPLICATION_COMPLETED', 'ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS', 'COMPLETED'].includes(status)) {
      depositDeadlineAt = row.futureDeadline
        ? new Date(Date.now() + 2 * 3600 * 1000)
        : new Date(createdAt.getTime() + 2 * 3600 * 1000);
    }

    try {
      const ticket = await prisma.transactionTicket.create({
        data: {
          ticketNo: tNo,
          type: TicketType.USDT_PURCHASE,
          customerId: user.customerProfile.id,
          commissionSettled: completed,
          commissionSettledAt: completed ? new Date(createdAt.getTime() + 7200 * 1000) : null,
          createdAt,
          updatedAt: new Date(createdAt.getTime() + 3600 * 1000),
          usdtPurchase: {
            create: {
              status,
              paymentMethod: isCard ? UsdtPaymentMethod.CARD : UsdtPaymentMethod.BANK_TRANSFER,
              fiatAmount: row.fiat,
              fiatCurrency: row.currency,
              exchangeRate: rate,
              exchangeRateAt: createdAt,
              exchangeSource: 'test_r2',
              expectedUsdtAmount: net,
              expectedUsdtMin: +(net * 0.98).toFixed(8),
              expectedUsdtMax: +(net * 1.02).toFixed(8),
              targetUsdtAmount: net,
              depositDeadlineAt,
              depositAmount:
                !isCard && ['ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS', 'COMPLETED'].includes(status)
                  ? row.fiat
                  : null,
              depositorName:
                !isCard && ['ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS', 'COMPLETED'].includes(status)
                  ? user.name
                  : null,
              depositTransferredAt:
                !isCard && ['ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS', 'COMPLETED'].includes(status)
                  ? new Date(createdAt.getTime() + 20 * 60 * 1000)
                  : null,
              fxFeePercentSnapshot: 0.005,
              gasFeeSnapshot: gas,
              transferFeeSnapshot: transfer,
              otherFeeSnapshot: other,
              platformFeeSnapshot: 0,
              feePolicySnapshot: { seed: 'R2', kind: row.kind },
              cardFeePercentSnapshot: isCard ? 0.03 : null,
              cardFeeFiatSnapshot: isCard ? +(row.fiat * 0.03).toFixed(2) : null,
              cardChargeFiat: isCard ? +(row.fiat * 1.03).toFixed(2) : null,
              cardPaymentStatus: isCard
                ? status === 'CARD_PAYMENT_PENDING'
                  ? CardPaymentStatus.PENDING
                  : status === 'CANCELLED'
                    ? CardPaymentStatus.DECLINED
                    : CardPaymentStatus.APPROVED
                : null,
              cardWaiverAcceptedAt: isCard ? createdAt : null,
              icopayOrderId: isCard ? `R2-ORD-${tNo}` : null,
              icopayTransactionId: isCard ? `R2-TX-${randomBytes(3).toString('hex')}` : null,
              cardLast4: isCard ? '4242' : null,
              collectionProvider: isSandbox ? 'CURFEX' : isCard ? null : 'FIXED',
              curfexRefNo: isSandbox ? `R2SBX-${randomBytes(3).toString('hex').toUpperCase()}` : null,
              curfexStatusCode: isSandbox
                ? status === 'COMPLETED' || status === 'ADMIN_REVIEWING' || status === 'TRANSFER_IN_PROGRESS'
                  ? 'DEPOSITED'
                  : 'ISSUED'
                : null,
              collectionAccountJson: isSandbox
                ? {
                    bankName: 'Sandbox Ginko',
                    branchName: 'R2',
                    accountNo: `R2${200000 + i}`,
                    accountName: user.name,
                    sandbox: true,
                  }
                : undefined,
              curfexDepositDetectedAt:
                isSandbox &&
                ['ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS', 'COMPLETED'].includes(status)
                  ? new Date(createdAt.getTime() + 40 * 60 * 1000)
                  : null,
              walletId: wallet.id,
              usdtTxId: completed ? `0xr2${randomBytes(16).toString('hex')}` : null,
              actualUsdtAmount: completed ? net : null,
              brokerUsdtAmount: completed ? +(net * 0.997).toFixed(8) : null,
              cancelReason: cancelled ? 'R2 test cancel' : null,
              adminNote: `${TAG} ${row.kind} ${status}`,
              createdAt,
              updatedAt: new Date(createdAt.getTime() + 3600 * 1000),
            },
          },
          statusHistory: {
            create: [
              {
                fromStatus: null,
                toStatus: 'APPLICATION_COMPLETED',
                changedById: user.id,
                note: 'R2 seed',
                createdAt,
              },
              {
                fromStatus: 'APPLICATION_COMPLETED',
                toStatus: status,
                changedById: user.id,
                note: 'R2 seed jump',
                createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
              },
            ],
          },
          ...(completed
            ? {
                ledgerEntries: {
                  create: {
                    organizationId: user.customerProfile.recruitingOrgId,
                    entryType: 'COMMISSION_EARNED',
                    amount: +(transfer * rate).toFixed(2) || 100,
                    currency: row.currency === 'USDT' ? 'KRW' : row.currency,
                    ratePercent: 0,
                    baseAmount: +(transfer * rate).toFixed(2) || 100,
                    description: `R2 USDT commission`,
                  },
                },
              }
            : {}),
        },
      });
      results.push({ ok: true, type: 'USDT', ticketNo: tNo, kind: row.kind, status, id: ticket.id });
    } catch (e) {
      results.push({ ok: false, type: 'USDT', ticketNo: tNo, error: String(e.message || e) });
      issues.push(`USDT create fail ${tNo}: ${e.message || e}`);
    }
  }

  // Escrow scenarios (~6)
  const escrowPlan = [
    { status: 'ESCROW_COMPLETED', daysAgo: 6, title: 'R2 Escrow completed goods' },
    { status: 'CONTRACT_CONFIRMED', daysAgo: 2, title: 'R2 Escrow contract confirmed' },
    { status: 'BUYER_DEPOSIT_PROOF', daysAgo: 1, title: 'R2 Escrow buyer deposit' },
    { status: 'SHIPPING_STARTED', daysAgo: 3, title: 'R2 Escrow shipping' },
    { status: 'ESCROW_CREATED', daysAgo: 0, title: 'R2 Escrow awaiting accept', futureDeadline: true },
    { status: 'CANCELLED', daysAgo: 4, title: 'R2 Escrow cancelled' },
  ];

  for (let i = 0; i < escrowPlan.length; i++) {
    const ep = escrowPlan[i];
    const createdAt = seoulOffsetDays(ep.daysAgo, 13);
    const tNo = ticketNo('ESC', i, createdAt);
    const status = ep.status;
    const deadline = ep.futureDeadline
      ? new Date(Date.now() + 48 * 3600 * 1000)
      : new Date(createdAt.getTime() + 48 * 3600 * 1000);
    try {
      const ticket = await prisma.transactionTicket.create({
        data: {
          ticketNo: tNo,
          type: TicketType.TRADE_ESCROW,
          customerId: user.customerProfile.id,
          commissionSettled: status === 'ESCROW_COMPLETED',
          commissionSettledAt: status === 'ESCROW_COMPLETED' ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
          tradeEscrow: {
            create: {
              status,
              tradeTier: EscrowTradeTier.STANDARD,
              buyerId: user.id,
              sellerId: peer.id,
              initiatedByUserId: user.id,
              initiatedAsRole: 'BUYER',
              title: ep.title,
              description: 'R2 escrow seed',
              escrowTerms: 'R2 test terms',
              amount: 12000 + i * 1500,
              currency: 'USD',
              totalCommissionPool: 120 + i * 15,
              buyerAcceptedAt: status === 'ESCROW_CREATED' ? null : createdAt,
              sellerAcceptedAt:
                status === 'ESCROW_CREATED' || status === 'CANCELLED' ? null : createdAt,
              buyerDisclaimerAt: createdAt,
              sellerDisclaimerAt: status === 'ESCROW_CREATED' ? null : createdAt,
              acceptanceDeadlineAt: deadline,
              buyerContractConfirmedAt: [
                'CONTRACT_CONFIRMED',
                'BUYER_DEPOSIT_PROOF',
                'SHIPPING_STARTED',
                'ESCROW_COMPLETED',
              ].includes(status)
                ? createdAt
                : null,
              sellerContractConfirmedAt: [
                'CONTRACT_CONFIRMED',
                'BUYER_DEPOSIT_PROOF',
                'SHIPPING_STARTED',
                'ESCROW_COMPLETED',
              ].includes(status)
                ? createdAt
                : null,
              depositAmount: ['BUYER_DEPOSIT_PROOF', 'SHIPPING_STARTED', 'ESCROW_COMPLETED'].includes(
                status,
              )
                ? 12000 + i * 1500
                : null,
              depositTransferredAt: ['BUYER_DEPOSIT_PROOF', 'SHIPPING_STARTED', 'ESCROW_COMPLETED'].includes(
                status,
              )
                ? new Date(createdAt.getTime() + 3600 * 1000)
                : null,
              depositorName: user.name,
              shippingStartedAt: ['SHIPPING_STARTED', 'ESCROW_COMPLETED'].includes(status)
                ? new Date(createdAt.getTime() + 2 * 3600 * 1000)
                : null,
              payoutTxId: status === 'ESCROW_COMPLETED' ? `r2-esc-${randomBytes(3).toString('hex')}` : null,
              payoutProcessedAt:
                status === 'ESCROW_COMPLETED' ? new Date(createdAt.getTime() + 5 * 3600 * 1000) : null,
              adminNote: `${TAG} escrow ${status}`,
              createdAt,
              updatedAt: createdAt,
            },
          },
          ...(status === 'ESCROW_COMPLETED'
            ? {
                ledgerEntries: {
                  create: {
                    organizationId: user.customerProfile.recruitingOrgId,
                    entryType: 'COMMISSION_EARNED',
                    amount: 120 + i * 15,
                    currency: 'USD',
                    ratePercent: 0,
                    baseAmount: 120 + i * 15,
                    description: 'R2 escrow commission',
                  },
                },
              }
            : {}),
        },
      });
      results.push({ ok: true, type: 'ESCROW', ticketNo: tNo, status, id: ticket.id });
    } catch (e) {
      results.push({ ok: false, type: 'ESCROW', ticketNo: tNo, error: String(e.message || e) });
      issues.push(`ESCROW create fail ${tNo}: ${e.message || e}`);
    }
  }

  // ——— Validation ———
  const r2Usdt = await prisma.usdtPurchaseDetail.findMany({
    where: { adminNote: { startsWith: TAG }, ticket: { customerId: user.customerProfile.id } },
    include: { ticket: true, wallet: true },
  });
  const r2Esc = await prisma.tradeEscrowDetail.findMany({
    where: { adminNote: { startsWith: TAG }, ticket: { customerId: user.customerProfile.id } },
    include: { ticket: true, buyer: true, seller: true },
  });

  const statusCounts = {};
  const kindCounts = {};
  for (const u of r2Usdt) {
    statusCounts[u.status] = (statusCounts[u.status] || 0) + 1;
    const k =
      u.collectionProvider === 'CURFEX' ? 'sandbox' : u.paymentMethod === 'CARD' ? 'card' : 'manual';
    kindCounts[k] = (kindCounts[k] || 0) + 1;

    // Invariants
    if (!u.walletId) issues.push(`${u.ticket.ticketNo}: missing wallet`);
    if (u.paymentMethod === 'CARD' && !u.cardPaymentStatus) {
      issues.push(`${u.ticket.ticketNo}: card without cardPaymentStatus`);
    }
    if (u.collectionProvider === 'CURFEX' && !u.collectionAccountJson) {
      issues.push(`${u.ticket.ticketNo}: CURFEX without account json`);
    }
    if (u.status === 'COMPLETED' && (!u.usdtTxId || u.actualUsdtAmount == null)) {
      issues.push(`${u.ticket.ticketNo}: COMPLETED missing tx fields`);
    }
    if (u.status === 'DEPOSIT_PROOF_PENDING' && u.depositDeadlineAt && u.depositDeadlineAt < new Date()) {
      issues.push(`${u.ticket.ticketNo}: DEPOSIT_PROOF_PENDING already past deadline (will auto-cancel on list)`);
    }
    if (u.status === 'COMPLETED' && !u.ticket.commissionSettled) {
      issues.push(`${u.ticket.ticketNo}: COMPLETED but commissionSettled=false`);
    }
    // Serialize-like Number() safety
    for (const field of ['fiatAmount', 'exchangeRate', 'expectedUsdtAmount', 'gasFeeSnapshot']) {
      const n = Number(u[field]);
      if (!Number.isFinite(n)) issues.push(`${u.ticket.ticketNo}: bad number ${field}`);
    }
  }

  for (const e of r2Esc) {
    if (e.buyerId === e.sellerId) issues.push(`${e.ticket.ticketNo}: buyer=seller`);
    if (e.status === 'ESCROW_CREATED' && e.acceptanceDeadlineAt && e.acceptanceDeadlineAt < new Date()) {
      issues.push(`${e.ticket.ticketNo}: ESCROW_CREATED past acceptanceDeadline (auto-void risk)`);
    }
    if (e.status === 'ESCROW_COMPLETED' && !e.payoutTxId) {
      issues.push(`${e.ticket.ticketNo}: completed without payoutTxId`);
    }
    if (!Number.isFinite(Number(e.amount))) issues.push(`${e.ticket.ticketNo}: bad amount`);
  }

  // List-path simulation: expired deposit window should not touch non-pending
  const pendingExpired = r2Usdt.filter(
    (u) =>
      u.status === 'DEPOSIT_PROOF_PENDING' &&
      u.depositDeadlineAt &&
      u.depositDeadlineAt < new Date(),
  );
  if (pendingExpired.length) {
    issues.push(`auto-expire candidates: ${pendingExpired.map((u) => u.ticket.ticketNo).join(',')}`);
  }

  // Try requiring dist serializers if available
  let serializeOk = null;
  try {
    const usdtSvc = require('../dist/services/usdt-purchase.service');
    const escSvc = require('../dist/services/trade-escrow.service');
    const authUser = {
      id: user.id,
      role: 'CUSTOMER',
      customerProfileId: user.customerProfile.id,
      organizationPath: null,
    };
    // SUPER_ADMIN list is safer for full view
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', deletedAt: null } });
    const adminAuth = {
      id: admin.id,
      role: 'SUPER_ADMIN',
      customerProfileId: null,
      organizationPath: null,
      email: admin.email,
      name: admin.name,
    };
    const listed = await usdtSvc.listUsdtPurchaseTickets(adminAuth);
    const mine = listed.filter((t) => t.adminNote && String(t.adminNote).startsWith(TAG));
    const escListed = await escSvc.listTradeEscrowTickets(adminAuth);
    const escMine = escListed.filter((t) => t.adminNote && String(t.adminNote).startsWith(TAG));
    serializeOk = { usdtListed: mine.length, escrowListed: escMine.length, totalUsdtList: listed.length };

    for (const t of mine) {
      if (t.collectionProvider === 'CURFEX' && t.curfexAutoDetect !== true) {
        issues.push(`${t.ticketNo}: curfexAutoDetect false for CURFEX`);
      }
      if (t.paymentMethod === 'CARD' && t.collectionProvider !== 'FIXED' && t.collectionProvider != null) {
        // serialize defaults null collection to FIXED
      }
      if (typeof t.fiatAmount !== 'number' || typeof t.expectedUsdtAmount !== 'number') {
        issues.push(`${t.ticketNo}: serialize number types wrong`);
      }
    }
    for (const t of escMine) {
      if (!t.buyer || !t.seller) issues.push(`${t.ticketNo}: serialize missing party`);
      if (typeof t.amount !== 'number') issues.push(`${t.ticketNo}: escrow amount not number`);
    }
  } catch (e) {
    issues.push(`service list/serialize failed: ${e.message || e}`);
    serializeOk = { error: String(e.message || e) };
  }

  const summary = {
    createdOk: results.filter((r) => r.ok).length,
    createdFail: results.filter((r) => !r.ok).length,
    usdtR2: r2Usdt.length,
    escrowR2: r2Esc.length,
    statusCounts,
    kindCounts,
    serializeOk,
    issues,
    fails: results.filter((r) => !r.ok),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (issues.length) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
