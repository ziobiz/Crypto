const { PrismaClient, TicketType, UsdtPurchaseStatus, UsdtPaymentMethod, TradeEscrowStatus, EscrowTradeTier, CardPaymentStatus } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';

function dayOffset(daysAgo, hour = 10, minute = 30) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

function ticketNo(prefix, i, createdAt) {
  const y = createdAt.getUTCFullYear();
  const m = String(createdAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(createdAt.getUTCDate()).padStart(2, '0');
  const seq = String(9000 + i).padStart(4, '0');
  return `${prefix}-${y}${m}${day}-${seq}`;
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL, deletedAt: null },
    include: {
      customerProfile: { include: { recruitingOrg: true } },
      wallets: { where: { isActive: true } },
    },
  });
  if (!user?.customerProfile) {
    throw new Error(`Customer not found: ${EMAIL}`);
  }
  console.log('user', user.id, user.name);
  console.log('profile', user.customerProfile.id, 'org', user.customerProfile.recruitingOrgId);
  console.log('wallets', user.wallets.length);

  let wallet = user.wallets[0];
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        label: 'TEST-TRC20',
        address: 'TTestSamsungTh' + randomBytes(8).toString('hex').slice(0, 16),
        network: 'TRC20',
        isActive: true,
      },
    });
    console.log('created wallet', wallet.id);
  }

  const existing = await prisma.transactionTicket.count({
    where: { customerId: user.customerProfile.id },
  });
  console.log('existing tickets', existing);

  // Find a second customer for escrow seller/buyer counterpart
  const peer = await prisma.user.findFirst({
    where: {
      role: 'CUSTOMER',
      email: { not: EMAIL },
      deletedAt: null,
      customerProfile: { isNot: null },
    },
    include: { customerProfile: true },
  });
  console.log('escrow peer', peer?.email || 'NONE');

  const rates = {
    JPY: 148.5,
    KRW: 1380,
    THB: 34.2,
    USD: 1.0,
    CNY: 7.2,
  };

  /** @type {Array<{kind:'sandbox'|'manual'|'card', daysAgo:number, currency:string, fiat:number, hour:number}>} */
  const plan = [];
  // 5 sandbox CURFEX (bank), spread days
  const sandboxDays = [8, 7, 5, 3, 1];
  sandboxDays.forEach((d, i) =>
    plan.push({ kind: 'sandbox', daysAgo: d, currency: 'JPY', fiat: 150000 + i * 25000, hour: 9 + i }),
  );
  // 10 manual FIXED bank transfer — 현금/이체
  const manualDays = [8, 7, 7, 6, 5, 4, 4, 3, 2, 1];
  manualDays.forEach((d, i) =>
    plan.push({
      kind: 'manual',
      daysAgo: d,
      currency: i % 2 === 0 ? 'KRW' : 'THB',
      fiat: i % 2 === 0 ? 2000000 + i * 100000 : 50000 + i * 3000,
      hour: 11 + (i % 6),
    }),
  );
  // 5 card — make total 20; with sandbox+manual bank = 15, card 5 → bank 75% / card 25%
  // User asked 50% USDT purchase vs cash — interpret as 10 bank (cash) + 10 card among non-sandbox?
  // Better: replace 5 of manual with making overall 10 bank cash + 10 card including adjusting:
  // Rebalance: keep 5 sandbox (bank), 5 more bank manual, 10 card = 20 with 50% card / 50% bank(cash+sandbox)
  // User said: sandbox 5 + manual 10 + 50% usdt/cash. I'll stick to 5 sandbox + 10 manual + 5 card (=20),
  // and note in report that card:bank is 5:15; OR change to 5 sandbox + 5 manual bank + 10 card.

  // Re-read again: "usdt 구입과현금 거래를 50% 나누어서"
  // Perhaps all are USDT purchases, and payment is 50% 현금(이체) 50% 카드.
  // With sandbox 5 + manual 10 = 15 bank, need 15 card for 50/50 of total 30... 
  // For ~20: 10 bank (5 sandbox + 5 manual) + 10 card.

  // Clear and rebuild plan:
  // 5 sandbox CURFEX + 10 manual FIXED(현금 이체) + 5 card ≈ 20건
  // 이체(현금성) 15 / 카드 5 — 사용자 요청의 sandbox5+수동10을 우선. 카드는 보충.
  plan.length = 0;
  // 5 sandbox bank CURFEX
  [8, 6, 4, 2, 1].forEach((d, i) =>
    plan.push({ kind: 'sandbox', daysAgo: d, currency: 'JPY', fiat: 180000 + i * 20000, hour: 8 + i }),
  );
  // 10 manual bank (현금 이체)
  [8, 7, 7, 6, 5, 4, 4, 3, 2, 1].forEach((d, i) =>
    plan.push({
      kind: 'manual',
      daysAgo: d,
      currency: i % 3 === 0 ? 'KRW' : i % 3 === 1 ? 'THB' : 'JPY',
      fiat:
        i % 3 === 0 ? 1500000 + i * 120000 : i % 3 === 1 ? 45000 + i * 4000 : 200000 + i * 15000,
      hour: 11 + (i % 7),
    }),
  );
  // 5 card
  [8, 5, 3, 2, 1].forEach((d, i) =>
    plan.push({
      kind: 'card',
      daysAgo: d,
      currency: i % 2 === 0 ? 'JPY' : 'KRW',
      fiat: i % 2 === 0 ? 95000 + i * 12000 : 700000 + i * 80000,
      hour: 16 + i,
    }),
  );

  console.log('plan count', plan.length, {
    sandbox: plan.filter((p) => p.kind === 'sandbox').length,
    manual: plan.filter((p) => p.kind === 'manual').length,
    card: plan.filter((p) => p.kind === 'card').length,
  });

  let created = 0;
  const results = [];

  for (let i = 0; i < plan.length; i++) {
    const row = plan[i];
    const createdAt = dayOffset(row.daysAgo, row.hour, 15 + i);
    const rate = rates[row.currency] || 1;
    const grossUsdt = row.fiat / rate;
    const fxFee = +(grossUsdt * 0.005).toFixed(8);
    const gas = 1;
    const transfer = 2;
    const other = 0.5;
    const net = +(grossUsdt - fxFee - gas - transfer - other).toFixed(8);
    const isCard = row.kind === 'card';
    const isSandbox = row.kind === 'sandbox';
    const status = UsdtPurchaseStatus.COMPLETED;
    const completedAt = new Date(createdAt.getTime() + 2 * 3600 * 1000);

    const tNo = ticketNo('USDT', i, createdAt);

    try {
      const ticket = await prisma.transactionTicket.create({
        data: {
          ticketNo: tNo,
          type: TicketType.USDT_PURCHASE,
          customerId: user.customerProfile.id,
          commissionSettled: true,
          commissionSettledAt: completedAt,
          createdAt,
          updatedAt: completedAt,
          usdtPurchase: {
            create: {
              status,
              paymentMethod: isCard ? UsdtPaymentMethod.CARD : UsdtPaymentMethod.BANK_TRANSFER,
              fiatAmount: row.fiat,
              fiatCurrency: row.currency,
              exchangeRate: rate,
              exchangeRateAt: createdAt,
              exchangeSource: 'test_seed',
              expectedUsdtAmount: net,
              expectedUsdtMin: +(net * 0.98).toFixed(8),
              expectedUsdtMax: +(net * 1.02).toFixed(8),
              targetUsdtAmount: net,
              depositDeadlineAt: isCard ? null : new Date(createdAt.getTime() + 2 * 3600 * 1000),
              depositAmount: isCard ? null : row.fiat,
              depositorName: isCard ? null : user.name,
              depositTransferredAt: isCard ? null : new Date(createdAt.getTime() + 30 * 60 * 1000),
              fxFeePercentSnapshot: 0.005,
              gasFeeSnapshot: gas,
              transferFeeSnapshot: transfer,
              otherFeeSnapshot: other,
              platformFeeSnapshot: 0,
              feePolicySnapshot: { seed: true, kind: row.kind },
              cardFeePercentSnapshot: isCard ? 0.03 : null,
              cardFeeFiatSnapshot: isCard ? +(row.fiat * 0.03).toFixed(2) : null,
              cardChargeFiat: isCard ? +(row.fiat * 1.03).toFixed(2) : null,
              cardPaymentStatus: isCard ? CardPaymentStatus.APPROVED : null,
              cardWaiverAcceptedAt: isCard ? createdAt : null,
              icopayOrderId: isCard ? `TEST-ORD-${tNo}` : null,
              icopayTransactionId: isCard ? `TEST-TX-${randomBytes(4).toString('hex')}` : null,
              cardLast4: isCard ? '4242' : null,
              collectionProvider: isSandbox ? 'CURFEX' : isCard ? null : 'FIXED',
              curfexRefNo: isSandbox ? `SBX-${randomBytes(4).toString('hex').toUpperCase()}` : null,
              curfexStatusCode: isSandbox ? 'DEPOSITED' : null,
              collectionAccountJson: isSandbox
                ? {
                    bankName: 'Sandbox Ginko',
                    branchName: 'Test',
                    accountNo: `SB${100000 + i}`,
                    accountName: user.name,
                    sandbox: true,
                  }
                : undefined,
              curfexDepositDetectedAt: isSandbox
                ? new Date(createdAt.getTime() + 45 * 60 * 1000)
                : null,
              walletId: wallet.id,
              usdtTxId: `0xtest${randomBytes(16).toString('hex')}`,
              actualUsdtAmount: net,
              brokerUsdtAmount: +(net * 0.997).toFixed(8),
              adminNote: `[TEST SEED] ${row.kind} ${row.currency}`,
              createdAt,
              updatedAt: completedAt,
            },
          },
          statusHistory: {
            create: [
              {
                fromStatus: null,
                toStatus: 'APPLICATION_COMPLETED',
                changedById: user.id,
                note: 'test seed create',
                createdAt,
              },
              {
                fromStatus: 'APPLICATION_COMPLETED',
                toStatus: isCard ? 'ADMIN_REVIEWING' : 'DEPOSIT_PROOF_PENDING',
                changedById: user.id,
                note: 'test seed',
                createdAt: new Date(createdAt.getTime() + 5 * 60 * 1000),
              },
              {
                fromStatus: isCard ? 'ADMIN_REVIEWING' : 'DEPOSIT_PROOF_PENDING',
                toStatus: isCard ? 'TRANSFER_IN_PROGRESS' : 'ADMIN_REVIEWING',
                changedById: user.id,
                note: 'test seed',
                createdAt: new Date(createdAt.getTime() + 40 * 60 * 1000),
              },
              {
                fromStatus: isCard ? 'TRANSFER_IN_PROGRESS' : 'ADMIN_REVIEWING',
                toStatus: isCard ? 'COMPLETED' : 'TRANSFER_IN_PROGRESS',
                changedById: user.id,
                note: 'test seed',
                createdAt: new Date(createdAt.getTime() + 70 * 60 * 1000),
              },
              ...(!isCard
                ? [
                    {
                      fromStatus: 'TRANSFER_IN_PROGRESS',
                      toStatus: 'COMPLETED',
                      changedById: user.id,
                      note: 'test seed complete',
                      createdAt: completedAt,
                    },
                  ]
                : []),
            ],
          },
        },
      });
      created++;
      results.push({ ok: true, ticketNo: tNo, kind: row.kind, id: ticket.id });
    } catch (e) {
      results.push({ ok: false, ticketNo: tNo, kind: row.kind, error: String(e.message || e) });
      console.error('FAIL', tNo, e.message || e);
    }
  }

  // Trade escrow tests (~4)
  const escrowPlans = [
    { daysAgo: 7, status: 'ESCROW_COMPLETED', title: 'TEST Escrow electronics JP' },
    { daysAgo: 5, status: 'BUYER_DEPOSIT_PROOF', title: 'TEST Escrow apparel TH' },
    { daysAgo: 3, status: 'ESCROW_CREATED', title: 'TEST Escrow parts KR' },
    { daysAgo: 1, status: 'CANCELLED', title: 'TEST Escrow cancelled sample' },
  ];

  if (!peer) {
    console.warn('No peer customer — skip escrow or create self-pair carefully');
  }

  for (let i = 0; i < escrowPlans.length; i++) {
    const ep = escrowPlans[i];
    if (!peer?.customerProfile) break;
    const createdAt = dayOffset(ep.daysAgo, 12, 0);
    const tNo = ticketNo('ESC', i, createdAt);
    const buyerId = user.id;
    const sellerId = peer.id;
    const status = ep.status;
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
              requiresReview: false,
              buyerId,
              sellerId,
              initiatedByUserId: buyerId,
              initiatedAsRole: 'BUYER',
              title: ep.title,
              description: 'Automated test escrow seed',
              escrowTerms: 'Test terms — seed data',
              amount: 10000 + i * 2500,
              currency: 'USD',
              totalCommissionPool: 100 + i * 10,
              buyerAcceptedAt: status === 'ESCROW_CREATED' ? null : createdAt,
              sellerAcceptedAt:
                status === 'ESCROW_CREATED' || status === 'CANCELLED' ? null : createdAt,
              buyerDisclaimerAt: createdAt,
              sellerDisclaimerAt: status === 'ESCROW_CREATED' ? null : createdAt,
              acceptanceDeadlineAt: new Date(createdAt.getTime() + 48 * 3600 * 1000),
              buyerContractConfirmedAt: ['BUYER_DEPOSIT_PROOF', 'ESCROW_COMPLETED'].includes(status)
                ? createdAt
                : null,
              sellerContractConfirmedAt: ['BUYER_DEPOSIT_PROOF', 'ESCROW_COMPLETED'].includes(status)
                ? createdAt
                : null,
              depositAmount: ['BUYER_DEPOSIT_PROOF', 'ESCROW_COMPLETED'].includes(status)
                ? 10000 + i * 2500
                : null,
              depositTransferredAt: ['BUYER_DEPOSIT_PROOF', 'ESCROW_COMPLETED'].includes(status)
                ? new Date(createdAt.getTime() + 3600 * 1000)
                : null,
              depositorName: user.name,
              payoutTxId:
                status === 'ESCROW_COMPLETED' ? `esc-pay-${randomBytes(4).toString('hex')}` : null,
              payoutProcessedAt:
                status === 'ESCROW_COMPLETED' ? new Date(createdAt.getTime() + 7200 * 1000) : null,
              voidReason: null,
              adminNote: '[TEST SEED] escrow',
              createdAt,
              updatedAt: createdAt,
            },
          },
        },
      });
      results.push({ ok: true, ticketNo: tNo, kind: 'escrow', status, id: ticket.id });
      created++;
    } catch (e) {
      results.push({ ok: false, ticketNo: tNo, kind: 'escrow', error: String(e.message || e) });
      console.error('ESCROW FAIL', tNo, e.message || e);
    }
  }

  console.log(JSON.stringify({ created, results }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
