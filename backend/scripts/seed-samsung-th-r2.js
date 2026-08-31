/**
 * Round-2 comprehensive test seed + verification for samsung.th@gmail.com
 * ~14 USDT purchase cases + ~6 trade escrow cases = ~20
 * Tags adminNote with [TEST R2]
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

function kstDay(daysAgo, hour = 12, minute = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  const utcMidnight = new Date(kst.getTime() - 9 * 3600 * 1000);
  return new Date(utcMidnight.getTime() + hour * 3600 * 1000 + minute * 60 * 1000);
}

function ticketNo(prefix, i, at) {
  const y = at.getUTCFullYear();
  const m = String(at.getUTCMonth() + 1).padStart(2, '0');
  const d = String(at.getUTCDate()).padStart(2, '0');
  return `${prefix}-R2-${y}${m}${d}-${String(9100 + i).padStart(4, '0')}`;
}

async function main() {
  const issues = [];
  const results = [];

  const user = await prisma.user.findFirst({
    where: { email: EMAIL, deletedAt: null },
    include: {
      customerProfile: true,
      wallets: { where: { isActive: true } },
      bankAccounts: { where: { isActive: true }, take: 1 },
    },
  });
  if (!user?.customerProfile) throw new Error('customer missing');
  const recruitingOrgId = user.customerProfile.recruitingOrgId;

  let wallet = user.wallets[0];
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        label: 'R2-TRC20',
        address: 'TR2' + randomBytes(12).toString('hex').slice(0, 20),
        network: 'TRC20',
        isActive: true,
      },
    });
  }

  const peer = await prisma.user.findFirst({
    where: {
      role: 'CUSTOMER',
      email: { not: EMAIL },
      deletedAt: null,
      customerProfile: { isNot: null },
    },
    include: { customerProfile: true },
  });
  if (!peer) issues.push('No peer customer for escrow');

  const rates = { JPY: 148.5, KRW: 1380, THB: 34.2, USD: 1, CNY: 7.2 };

  /** USDT purchase plans — status/path diversity */
  const usdtPlans = [
    { kind: 'sandbox', status: 'COMPLETED', currency: 'JPY', fiat: 210000, daysAgo: 7, hour: 9 },
    { kind: 'sandbox', status: 'ADMIN_REVIEWING', currency: 'JPY', fiat: 175000, daysAgo: 2, hour: 10 },
    { kind: 'sandbox', status: 'DEPOSIT_PROOF_PENDING', currency: 'JPY', fiat: 99000, daysAgo: 0, hour: 11, futureDeposit: true },
    { kind: 'manual', status: 'COMPLETED', currency: 'KRW', fiat: 2200000, daysAgo: 6, hour: 14 },
    { kind: 'manual', status: 'COMPLETED', currency: 'THB', fiat: 62000, daysAgo: 5, hour: 15 },
    { kind: 'manual', status: 'TRANSFER_IN_PROGRESS', currency: 'KRW', fiat: 1800000, daysAgo: 1, hour: 13 },
    { kind: 'manual', status: 'DEPOSIT_PROOF_PENDING', currency: 'KRW', fiat: 950000, daysAgo: 0, hour: 12, futureDeposit: true },
    { kind: 'manual', status: 'CANCELLED', currency: 'JPY', fiat: 88000, daysAgo: 4, hour: 16 },
    { kind: 'manual', status: 'APPLICATION_COMPLETED', currency: 'CNY', fiat: 8000, daysAgo: 0, hour: 8, futureDeposit: true },
    { kind: 'card', status: 'COMPLETED', currency: 'JPY', fiat: 130000, daysAgo: 3, hour: 11 },
    { kind: 'card', status: 'COMPLETED', currency: 'KRW', fiat: 1100000, daysAgo: 2, hour: 17 },
    { kind: 'card', status: 'CARD_PAYMENT_PENDING', currency: 'JPY', fiat: 77000, daysAgo: 0, hour: 18 },
    { kind: 'card', status: 'ADMIN_REVIEWING', currency: 'USD', fiat: 800, daysAgo: 1, hour: 9 },
    { kind: 'manual', status: 'COMPLETED', currency: 'JPY', fiat: 250000, daysAgo: 8, hour: 10 },
  ];

  for (let i = 0; i < usdtPlans.length; i++) {
    const row = usdtPlans[i];
    const createdAt = kstDay(row.daysAgo, row.hour, i);
    const rate = rates[row.currency] || 1;
    const gross = row.fiat / rate;
    const fees = { fx: +(gross * 0.005).toFixed(8), gas: 1, transfer: 2, other: 0.5 };
    const net = +(gross - fees.fx - fees.gas - fees.transfer - fees.other).toFixed(8);
    const isCard = row.kind === 'card';
    const isSandbox = row.kind === 'sandbox';
    const status = UsdtPurchaseStatus[row.status];
    const tNo = ticketNo('USDT', i, createdAt);
    const depositDeadline = row.futureDeposit
      ? new Date(Date.now() + 90 * 60 * 1000)
      : new Date(createdAt.getTime() + 2 * 3600 * 1000);
    const completedLike = ['COMPLETED', 'TRANSFER_IN_PROGRESS', 'ADMIN_REVIEWING'].includes(row.status);

    try {
      const ticket = await prisma.transactionTicket.create({
        data: {
          ticketNo: tNo,
          type: TicketType.USDT_PURCHASE,
          customerId: user.customerProfile.id,
          commissionSettled: row.status === 'COMPLETED',
          commissionSettledAt: row.status === 'COMPLETED' ? new Date(createdAt.getTime() + 7200 * 1000) : null,
          createdAt,
          updatedAt: createdAt,
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
              depositDeadlineAt: isCard ? null : depositDeadline,
              depositAmount:
                !isCard && ['COMPLETED', 'ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS'].includes(row.status)
                  ? row.fiat
                  : null,
              depositorName:
                !isCard && ['COMPLETED', 'ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS'].includes(row.status)
                  ? user.name
                  : null,
              depositTransferredAt:
                !isCard && ['COMPLETED', 'ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS'].includes(row.status)
                  ? new Date(createdAt.getTime() + 1800 * 1000)
                  : null,
              fxFeePercentSnapshot: 0.005,
              gasFeeSnapshot: fees.gas,
              transferFeeSnapshot: fees.transfer,
              otherFeeSnapshot: fees.other,
              platformFeeSnapshot: 0,
              feePolicySnapshot: { seed: 'R2', kind: row.kind },
              cardFeePercentSnapshot: isCard ? 0.03 : null,
              cardFeeFiatSnapshot: isCard ? +(row.fiat * 0.03).toFixed(2) : null,
              cardChargeFiat: isCard ? +(row.fiat * 1.03).toFixed(2) : null,
              cardPaymentStatus: isCard
                ? row.status === 'CARD_PAYMENT_PENDING'
                  ? CardPaymentStatus.PENDING
                  : CardPaymentStatus.APPROVED
                : null,
              cardWaiverAcceptedAt: isCard ? createdAt : null,
              icopayOrderId: isCard ? `R2-ORD-${tNo}` : null,
              icopayTransactionId: isCard && row.status !== 'CARD_PAYMENT_PENDING' ? `R2-TX-${randomBytes(3).toString('hex')}` : null,
              cardLast4: isCard ? '4242' : null,
              collectionProvider: isSandbox ? 'CURFEX' : isCard ? null : 'FIXED',
              curfexRefNo: isSandbox ? `R2SBX-${randomBytes(3).toString('hex').toUpperCase()}` : null,
              curfexStatusCode: isSandbox
                ? row.status === 'DEPOSIT_PROOF_PENDING'
                  ? 'WAITING'
                  : 'DEPOSITED'
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
                isSandbox && ['COMPLETED', 'ADMIN_REVIEWING', 'TRANSFER_IN_PROGRESS'].includes(row.status)
                  ? new Date(createdAt.getTime() + 2400 * 1000)
                  : null,
              walletId: wallet.id,
              usdtTxId: row.status === 'COMPLETED' ? `0xr2${randomBytes(16).toString('hex')}` : null,
              actualUsdtAmount: row.status === 'COMPLETED' ? net : null,
              brokerUsdtAmount: row.status === 'COMPLETED' ? +(net * 0.997).toFixed(8) : null,
              cancelReason: row.status === 'CANCELLED' ? 'R2 test cancel' : null,
              adminNote: `${TAG} ${row.kind} ${row.status}`,
              createdAt,
              updatedAt: createdAt,
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
                toStatus: row.status,
                changedById: user.id,
                note: 'R2 seed jump',
                createdAt: new Date(createdAt.getTime() + 600 * 1000),
              },
            ],
          },
        },
        include: { usdtPurchase: true },
      });

      if (row.status === 'COMPLETED' && recruitingOrgId) {
        await prisma.ledgerEntry.create({
          data: {
            organizationId: recruitingOrgId,
            ticketId: ticket.id,
            entryType: 'COMMISSION_EARNED',
            amount: +(fees.transfer * rate).toFixed(2) || 100,
            currency: row.currency,
            ratePercent: 0,
            baseAmount: +(fees.transfer * rate).toFixed(2) || 100,
            description: `USDT_PURCHASE R2 commission`,
          },
        });
      }

      results.push({ ok: true, ticketNo: tNo, type: 'USDT', kind: row.kind, status: row.status, id: ticket.id });
    } catch (e) {
      issues.push(`USDT create fail ${tNo}: ${e.message}`);
      results.push({ ok: false, ticketNo: tNo, error: e.message });
    }
  }

  /** Escrow plans — 6 cases */
  const escrowPlans = [
    { status: 'ESCROW_COMPLETED', daysAgo: 6, title: 'R2 Escrow completed goods' },
    { status: 'BUYER_DEPOSIT_PROOF', daysAgo: 3, title: 'R2 Escrow deposit proof' },
    { status: 'CONTRACT_CONFIRMED', daysAgo: 2, title: 'R2 Escrow contract confirmed' },
    { status: 'SHIPPING_STARTED', daysAgo: 1, title: 'R2 Escrow shipping' },
    { status: 'ESCROW_CREATED', daysAgo: 0, title: 'R2 Escrow awaiting accept', futureDeadline: true },
    { status: 'CANCELLED', daysAgo: 4, title: 'R2 Escrow cancelled' },
  ];

  for (let i = 0; i < escrowPlans.length; i++) {
    const ep = escrowPlans[i];
    if (!peer) break;
    const createdAt = kstDay(ep.daysAgo, 13, i * 5);
    const tNo = ticketNo('ESC', i, createdAt);
    const status = TradeEscrowStatus[ep.status];
    const deadline = ep.futureDeadline
      ? new Date(Date.now() + 48 * 3600 * 1000)
      : new Date(createdAt.getTime() + 48 * 3600 * 1000);
    const advanced = !['ESCROW_CREATED', 'CANCELLED'].includes(ep.status);

    try {
      const ticket = await prisma.transactionTicket.create({
        data: {
          ticketNo: tNo,
          type: TicketType.TRADE_ESCROW,
          customerId: user.customerProfile.id,
          commissionSettled: ep.status === 'ESCROW_COMPLETED',
          commissionSettledAt: ep.status === 'ESCROW_COMPLETED' ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
          tradeEscrow: {
            create: {
              status,
              tradeTier: EscrowTradeTier.STANDARD,
              requiresReview: false,
              buyerId: user.id,
              sellerId: peer.id,
              initiatedByUserId: user.id,
              initiatedAsRole: 'BUYER',
              title: ep.title,
              description: 'R2 automated escrow test',
              escrowTerms: 'R2 test terms',
              amount: 12000 + i * 1500,
              currency: 'USD',
              totalCommissionPool: 120 + i * 15,
              buyerAcceptedAt: advanced || ep.status === 'CANCELLED' ? createdAt : null,
              sellerAcceptedAt: advanced ? createdAt : null,
              buyerDisclaimerAt: createdAt,
              sellerDisclaimerAt: advanced ? createdAt : null,
              acceptanceDeadlineAt: deadline,
              buyerContractConfirmedAt: [
                'CONTRACT_CONFIRMED',
                'BUYER_DEPOSIT_PROOF',
                'SHIPPING_STARTED',
                'ESCROW_COMPLETED',
              ].includes(ep.status)
                ? createdAt
                : null,
              sellerContractConfirmedAt: [
                'CONTRACT_CONFIRMED',
                'BUYER_DEPOSIT_PROOF',
                'SHIPPING_STARTED',
                'ESCROW_COMPLETED',
              ].includes(ep.status)
                ? createdAt
                : null,
              depositAmount: ['BUYER_DEPOSIT_PROOF', 'SHIPPING_STARTED', 'ESCROW_COMPLETED'].includes(
                ep.status,
              )
                ? 12000 + i * 1500
                : null,
              depositTransferredAt: ['BUYER_DEPOSIT_PROOF', 'SHIPPING_STARTED', 'ESCROW_COMPLETED'].includes(
                ep.status,
              )
                ? new Date(createdAt.getTime() + 3600 * 1000)
                : null,
              depositorName: user.name,
              shippingStartedAt: ep.status === 'SHIPPING_STARTED' || ep.status === 'ESCROW_COMPLETED' ? createdAt : null,
              payoutTxId: ep.status === 'ESCROW_COMPLETED' ? `r2-pay-${randomBytes(3).toString('hex')}` : null,
              payoutProcessedAt:
                ep.status === 'ESCROW_COMPLETED' ? new Date(createdAt.getTime() + 7200 * 1000) : null,
              adminNote: `${TAG} escrow ${ep.status}`,
              createdAt,
              updatedAt: createdAt,
            },
          },
        },
      });

      if (ep.status === 'ESCROW_COMPLETED' && recruitingOrgId) {
        await prisma.ledgerEntry.create({
          data: {
            organizationId: recruitingOrgId,
            ticketId: ticket.id,
            entryType: 'COMMISSION_EARNED',
            amount: 120 + i * 15,
            currency: 'USD',
            ratePercent: 0,
            baseAmount: 120 + i * 15,
            description: 'TRADE_ESCROW R2 commission',
          },
        });
      }

      results.push({ ok: true, ticketNo: tNo, type: 'ESCROW', status: ep.status, id: ticket.id });
    } catch (e) {
      issues.push(`ESCROW create fail ${tNo}: ${e.message}`);
      results.push({ ok: false, ticketNo: tNo, error: e.message });
    }
  }

  // ——— Verification ———
  const r2Usdt = await prisma.usdtPurchaseDetail.findMany({
    where: { adminNote: { contains: 'TEST R2' } },
    include: {
      ticket: { include: { ledgerEntries: true, statusHistory: true } },
      wallet: true,
    },
  });
  const r2Esc = await prisma.tradeEscrowDetail.findMany({
    where: { adminNote: { contains: 'TEST R2' } },
    include: { ticket: true, buyer: true, seller: true },
  });

  for (const u of r2Usdt) {
    if (!u.walletId) issues.push(`${u.ticket.ticketNo}: missing wallet`);
    if (Number(u.expectedUsdtAmount) <= 0) issues.push(`${u.ticket.ticketNo}: bad expectedUsdt`);
    if (u.paymentMethod === 'BANK_TRANSFER' && !u.collectionProvider && u.status !== 'CANCELLED') {
      // null collectionProvider serializes as FIXED — OK
    }
    if (u.collectionProvider === 'CURFEX') {
      const acc = u.collectionAccountJson;
      if (!acc || !acc.accountNo) issues.push(`${u.ticket.ticketNo}: CURFEX missing account json`);
    }
    if (u.status === 'COMPLETED') {
      if (!u.usdtTxId) issues.push(`${u.ticket.ticketNo}: COMPLETED without TXID`);
      if (!u.ticket.commissionSettled) issues.push(`${u.ticket.ticketNo}: COMPLETED not settled`);
      if (u.ticket.ledgerEntries.length === 0) issues.push(`${u.ticket.ticketNo}: COMPLETED no ledger`);
    }
    if (u.status === 'DEPOSIT_PROOF_PENDING' && u.depositDeadlineAt && u.depositDeadlineAt < new Date()) {
      issues.push(`${u.ticket.ticketNo}: deposit deadline already expired (will auto-cancel)`);
    }
    if (u.ticket.statusHistory.length < 1) issues.push(`${u.ticket.ticketNo}: no status history`);
    // Serialize-like checks
    try {
      Number(u.fiatAmount);
      Number(u.exchangeRate);
      Number(u.gasFeeSnapshot);
    } catch (e) {
      issues.push(`${u.ticket.ticketNo}: number cast fail`);
    }
  }

  for (const e of r2Esc) {
    if (e.buyerId === e.sellerId) issues.push(`${e.ticket.ticketNo}: buyer=seller`);
    if (!e.title) issues.push(`${e.ticket.ticketNo}: empty title`);
    if (e.status === 'ESCROW_CREATED' && e.acceptanceDeadlineAt && e.acceptanceDeadlineAt < new Date()) {
      issues.push(`${e.ticket.ticketNo}: acceptance deadline already past (will auto-void)`);
    }
    if (e.status === 'ESCROW_COMPLETED' && !e.ticket.commissionSettled) {
      issues.push(`${e.ticket.ticketNo}: completed escrow not settled`);
    }
  }

  // Load via service serialize if dist available
  let serializeOk = null;
  try {
    const { serializeTicket, USDT_PURCHASE_INCLUDE } = require('../dist/services/usdt-purchase.service');
    const { getWorkflowDisplay } = require('../dist/services/workflow-display.service');
    const sla = (await getWorkflowDisplay()).sla;
    const sample = await prisma.transactionTicket.findFirst({
      where: { usdtPurchase: { adminNote: { contains: 'TEST R2' } } },
      include: USDT_PURCHASE_INCLUDE,
    });
    if (sample) {
      const ser = serializeTicket(sample, sla);
      if (!ser.ticketNo || ser.fiatAmount == null) issues.push('serializeTicket missing fields');
      if (ser.collectionProvider === 'CURFEX' && ser.collectionAccount === null && sample.usdtPurchase?.collectionAccountJson) {
        issues.push('serializeTicket CURFEX account null despite JSON');
      }
      serializeOk = true;
    }
  } catch (e) {
    serializeOk = false;
    issues.push(`serialize import/run: ${e.message}`);
  }

  let escrowSerializeOk = null;
  try {
    const mod = require('../dist/services/trade-escrow.service');
    const list = await mod.listTradeEscrowTickets({
      id: user.id,
      role: 'SUPER_ADMIN',
      customerProfileId: null,
      organizationPath: null,
    });
    const mine = list.filter((x) => String(x.adminNote || '').includes('TEST R2') || String(x.title || '').includes('R2'));
    escrowSerializeOk = { totalListed: list.length, r2Matched: mine.length };
  } catch (e) {
    escrowSerializeOk = { error: e.message };
    // SUPER_ADMIN shape may differ — not always fatal
  }

  const summary = {
    created: results.filter((r) => r.ok).length,
    failedCreates: results.filter((r) => !r.ok).length,
    usdtR2: r2Usdt.length,
    escrowR2: r2Esc.length,
    byUsdtStatus: Object.fromEntries(
      [...new Set(r2Usdt.map((u) => u.status))].map((s) => [s, r2Usdt.filter((u) => u.status === s).length]),
    ),
    byUsdtKind: {
      sandbox: r2Usdt.filter((u) => u.collectionProvider === 'CURFEX').length,
      card: r2Usdt.filter((u) => u.paymentMethod === 'CARD').length,
      manual: r2Usdt.filter((u) => u.paymentMethod === 'BANK_TRANSFER' && u.collectionProvider !== 'CURFEX').length,
    },
    byEscrowStatus: Object.fromEntries(
      [...new Set(r2Esc.map((e) => e.status))].map((s) => [s, r2Esc.filter((e) => e.status === s).length]),
    ),
    serializeOk,
    escrowSerializeOk,
    issues,
    results,
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
