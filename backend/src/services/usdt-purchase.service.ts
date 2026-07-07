import { Prisma, TicketType, UsdtPurchaseStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { AuthUser } from '../types/auth';
import {
  calculateExpectedUsdtRange,
  fetchUsdtFiatRate,
  type FiatCurrency,
} from './exchange-rate.service';
import { settleCommission } from './commission.service';
import { sendTradeReceiptEmail } from './trade-email.service';
import { hqPolicyService } from './hq-policy.service';
import {
  resolveFeesForAmount,
  commissionPoolFromSnapshots,
  getFeeDiagramDisplay,
} from './transaction-fee.service';
import {
  applyLocalPremiumToBaseFees,
  breakdownFromFiat,
  breakdownFromTarget,
  getLocalPremiumContext,
  resolveFeesForPurchase,
  type ResolvedTransactionFees,
} from './usdt-fee-breakdown.service';
import {
  isLocalPremiumCurrency,
  type LocalMarketPremiumAnalysis,
  type LocalPremiumCurrency,
} from './local-market-premium.service';
import {
  getCustomerTransactionLimitSummary,
  validateCustomerTransactionAmount,
} from './transaction-limit.service';

const DEPOSIT_WINDOW_MS = 2 * 60 * 60 * 1000;

const USDT_PURCHASE_INCLUDE = {
  usdtPurchase: { include: { wallet: true } },
  customer: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          bankAccounts: {
            where: { isActive: true, isDefault: true },
            take: 1,
          },
        },
      },
      recruitingOrg: { select: { id: true, name: true, code: true, path: true } },
    },
  },
  attachments: true,
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: { changedBy: { select: { id: true, name: true, role: true } } },
  },
} satisfies Prisma.TransactionTicketInclude;

/** 운영자 전용 상태 전환 */
const ADMIN_TRANSITIONS: Record<UsdtPurchaseStatus, UsdtPurchaseStatus[]> = {
  [UsdtPurchaseStatus.APPLICATION_COMPLETED]: [
    UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING]: [
    UsdtPurchaseStatus.ADMIN_REVIEWING,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.ADMIN_REVIEWING]: [
    UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
    UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.TRANSFER_IN_PROGRESS]: [
    UsdtPurchaseStatus.COMPLETED,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.COMPLETED]: [],
  [UsdtPurchaseStatus.CANCELLED]: [],
};

/** 고객: 입금 증빙 제출 시 전환 */
const CUSTOMER_TRANSITIONS: Record<UsdtPurchaseStatus, UsdtPurchaseStatus[]> = {
  [UsdtPurchaseStatus.APPLICATION_COMPLETED]: [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING],
  [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING]: [UsdtPurchaseStatus.ADMIN_REVIEWING],
  [UsdtPurchaseStatus.ADMIN_REVIEWING]: [],
  [UsdtPurchaseStatus.TRANSFER_IN_PROGRESS]: [],
  [UsdtPurchaseStatus.COMPLETED]: [],
  [UsdtPurchaseStatus.CANCELLED]: [],
};

function generateTicketNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `USDT-${date}-${rand}`;
}

function normalizeName(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase();
}

function checkBankMatch(
  depositorName: string | undefined,
  registeredHolder: string | undefined,
): boolean {
  if (!depositorName?.trim() || !registeredHolder?.trim()) return true;
  return normalizeName(depositorName) === normalizeName(registeredHolder);
}

async function expireDepositWindowIfNeeded(
  ticketId: string,
  detail: { status: UsdtPurchaseStatus; depositDeadlineAt: Date | null },
  systemUserId: string,
): Promise<boolean> {
  if (detail.status !== UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING) return false;
  if (!detail.depositDeadlineAt || detail.depositDeadlineAt > new Date()) return false;

  await prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: UsdtPurchaseStatus.CANCELLED,
        cancelReason: '입금 기한(2시간) 초과',
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
        toStatus: UsdtPurchaseStatus.CANCELLED,
        changedById: systemUserId,
        note: '입금 기한(2시간) 초과 — 자동 취소',
      },
    });
  });
  return true;
}

function toLocalPremiumInfo(premium: LocalMarketPremiumAnalysis) {
  return {
    currency: premium.currency,
    premiumPercent: premium.premiumPercent,
    fairRate: premium.fairRate,
    domesticRate: premium.domesticRate,
    domesticSource: premium.domesticSource,
    domesticLabel: premium.domesticLabel,
    usdFiatRate: premium.usdFiatRate,
    usdtUsdRate: premium.usdtUsdRate,
    detailRates: premium.detailRates,
    upbitRate: premium.detailRates.upbit ?? null,
    bithumbRate: premium.detailRates.bithumb ?? null,
  };
}

async function quoteFromTarget(
  wallet: { id: string } & Parameters<typeof resolveFeesForAmount>[0],
  currency: FiatCurrency,
  targetUsdt: number,
  rate: number,
): Promise<{
  fees: ResolvedTransactionFees;
  fiatAmount: number;
  breakdown: ReturnType<typeof breakdownFromTarget>;
  localPremium?: ReturnType<typeof toLocalPremiumInfo>;
}> {
  const hasLocalPremium = isLocalPremiumCurrency(currency);
  let localPremium = hasLocalPremium
    ? await getLocalPremiumContext(currency as LocalPremiumCurrency)
    : null;
  let baseFees = await resolveFeesForAmount(wallet, currency, 0);
  let fees: ResolvedTransactionFees =
    localPremium != null ? applyLocalPremiumToBaseFees(baseFees, localPremium, 0) : baseFees;
  let breakdown = breakdownFromTarget(targetUsdt, rate, fees);

  baseFees = await resolveFeesForAmount(wallet, currency, breakdown.requiredFiat);
  if (hasLocalPremium) {
    localPremium = await getLocalPremiumContext(currency as LocalPremiumCurrency);
    fees = applyLocalPremiumToBaseFees(baseFees, localPremium, breakdown.grossUsdt);
  } else {
    fees = baseFees;
  }
  breakdown = breakdownFromTarget(targetUsdt, rate, fees);

  return {
    fees,
    fiatAmount: breakdown.requiredFiat,
    breakdown,
    localPremium: localPremium ? toLocalPremiumInfo(localPremium) : undefined,
  };
}

export async function previewUsdtTransactionFees(
  user: AuthUser,
  input: {
    walletId: string;
    fiatCurrency?: FiatCurrency;
    fiatAmount?: number;
    targetUsdtAmount?: number;
  },
) {
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: input.walletId,
      userId: user.id,
      isActive: true,
    },
  });

  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  const feeDiagramDisplay = await getFeeDiagramDisplay();
  const { rate } = await fetchUsdtFiatRate(currency);

  if (input.targetUsdtAmount != null && input.targetUsdtAmount > 0) {
    const quoted = await quoteFromTarget(wallet, currency, input.targetUsdtAmount, rate);
    let transactionLimits;
    if (user.customerProfileId && quoted.fiatAmount > 0) {
      const profile = await prisma.customerProfile.findUnique({
        where: { id: user.customerProfileId },
        select: { customerType: true },
      });
      if (profile) {
        await validateCustomerTransactionAmount({
          customerId: user.customerProfileId,
          customerType: profile.customerType,
          currency,
          fiatAmount: quoted.fiatAmount,
        });
        transactionLimits = await getCustomerTransactionLimitSummary(
          user.customerProfileId,
          profile.customerType,
          currency,
        );
      }
    }
    return {
      fees: quoted.fees,
      fiatAmount: quoted.fiatAmount,
      exchangeRate: rate,
      breakdown: quoted.breakdown,
      localPremium: quoted.localPremium,
      kimchiPremium: quoted.localPremium?.currency === 'KRW' ? quoted.localPremium : undefined,
      transactionLimits,
      feeDiagramDisplay,
    };
  }

  const fiatAmount = input.fiatAmount ?? 0;
  const fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate);
  const breakdown =
    fiatAmount > 0 ? breakdownFromFiat(fiatAmount, rate, fees) : undefined;
  const localPremium =
    isLocalPremiumCurrency(currency) && fiatAmount > 0
      ? await getLocalPremiumContext(currency)
      : null;
  const localPremiumInfo = localPremium ? toLocalPremiumInfo(localPremium) : undefined;

  let transactionLimits;
  if (user.customerProfileId && fiatAmount > 0) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: user.customerProfileId },
      select: { customerType: true },
    });
    if (profile) {
      await validateCustomerTransactionAmount({
        customerId: user.customerProfileId,
        customerType: profile.customerType,
        currency,
        fiatAmount,
      });
      transactionLimits = await getCustomerTransactionLimitSummary(
        user.customerProfileId,
        profile.customerType,
        currency,
      );
    }
  }

  return {
    fees,
    fiatAmount,
    exchangeRate: rate,
    breakdown,
    localPremium: localPremiumInfo,
    kimchiPremium: localPremiumInfo?.currency === 'KRW' ? localPremiumInfo : undefined,
    transactionLimits,
    feeDiagramDisplay,
  };
}

export async function createUsdtPurchaseTicket(
  user: AuthUser,
  input: {
    fiatAmount?: number;
    targetUsdtAmount?: number;
    fiatCurrency?: FiatCurrency;
    walletId: string;
  },
) {
  if (user.role !== UserRole.CUSTOMER || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create purchase tickets', 'FORBIDDEN');
  }

  if (!input.fiatAmount && !input.targetUsdtAmount) {
    throw new AppError(400, 'fiatAmount or targetUsdtAmount is required', 'VALIDATION');
  }

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: input.walletId,
      userId: user.id,
      isActive: true,
    },
  });

  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  const { rate, source, fetchedAt } = await fetchUsdtFiatRate(currency);

  let fiatAmount: number;
  let expected: number;
  let min: number;
  let max: number;
  let targetUsdt: number | null = null;
  let fees: ResolvedTransactionFees;
  let feeBreakdown: ReturnType<typeof breakdownFromFiat> | undefined;
  let localPremiumSnapshot: LocalMarketPremiumAnalysis | null = null;

  if (input.targetUsdtAmount != null && input.targetUsdtAmount > 0) {
    const quoted = await quoteFromTarget(wallet, currency, input.targetUsdtAmount, rate);
    fees = quoted.fees;
    fiatAmount = quoted.fiatAmount;
    feeBreakdown = quoted.breakdown;
    expected = quoted.breakdown.netUsdt;
    targetUsdt = quoted.breakdown.netUsdt;
    if (quoted.localPremium && isLocalPremiumCurrency(currency)) {
      localPremiumSnapshot = await getLocalPremiumContext(currency);
    }
    const range = calculateExpectedUsdtRange(fiatAmount, rate, fees);
    min = range.min;
    max = range.max;
  } else {
    fiatAmount = input.fiatAmount!;
    fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate);
    feeBreakdown = breakdownFromFiat(fiatAmount, rate, fees);
    expected = feeBreakdown.netUsdt;
    if (isLocalPremiumCurrency(currency)) {
      localPremiumSnapshot = await getLocalPremiumContext(currency);
    }
    const range = calculateExpectedUsdtRange(fiatAmount, rate, fees);
    min = range.min;
    max = range.max;
  }

  const customerProfile = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { customerType: true },
  });
  if (!customerProfile) {
    throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');
  }

  await validateCustomerTransactionAmount({
    customerId: user.customerProfileId,
    customerType: customerProfile.customerType,
    currency,
    fiatAmount,
  });

  const depositDeadlineAt = new Date(Date.now() + DEPOSIT_WINDOW_MS);

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTicket.create({
      data: {
        ticketNo: generateTicketNo(),
        type: TicketType.USDT_PURCHASE,
        customerId: user.customerProfileId!,
        usdtPurchase: {
          create: {
            status: UsdtPurchaseStatus.APPLICATION_COMPLETED,
            fiatAmount,
            fiatCurrency: currency,
            exchangeRate: rate,
            exchangeRateAt: fetchedAt,
            exchangeSource: source,
            fairExchangeRateSnapshot: localPremiumSnapshot?.fairRate ?? null,
            kimchiPremiumPercentSnapshot: localPremiumSnapshot?.premiumPercent ?? null,
            kimchiPremiumFeeSnapshot: fees.localPremiumFeeUsdt ?? fees.kimchiPremiumFeeUsdt ?? null,
            expectedUsdtAmount: expected,
            expectedUsdtMin: min,
            expectedUsdtMax: max,
            targetUsdtAmount: targetUsdt,
            depositDeadlineAt,
            fxFeePercentSnapshot: fees.fxFeePercent,
            gasFeeSnapshot: fees.gasFeeUsdt,
            transferFeeSnapshot: fees.transferFeeUsdt,
            otherFeeSnapshot: fees.otherFeeUsdt,
            platformFeeSnapshot: 0,
            walletId: wallet.id,
          },
        },
      },
      include: USDT_PURCHASE_INCLUDE,
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: null,
        toStatus: UsdtPurchaseStatus.APPLICATION_COMPLETED,
        changedById: user.id,
        note: 'USDT 매입 신청',
      },
    });

    await tx.usdtPurchaseDetail.update({
      where: { ticketId: created.id },
      data: { status: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: UsdtPurchaseStatus.APPLICATION_COMPLETED,
        toStatus: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
        changedById: user.id,
        note: `입금 증빙 대기 (기한: ${depositDeadlineAt.toISOString()})`,
      },
    });

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: created.id },
      include: USDT_PURCHASE_INCLUDE,
    });
  });

  return serializeTicket(ticket);
}

export async function listUsdtPurchaseTickets(user: AuthUser) {
  const { buildTicketListFilter } = await import('./ticket-access.service');
  const where = buildTicketListFilter(user, TicketType.USDT_PURCHASE);

  const tickets = await prisma.transactionTicket.findMany({
    where,
    include: USDT_PURCHASE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  for (const t of tickets) {
    if (t.usdtPurchase) {
      await expireDepositWindowIfNeeded(t.id, t.usdtPurchase, user.id);
    }
  }

  const refreshed = await prisma.transactionTicket.findMany({
    where,
    include: USDT_PURCHASE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return refreshed.map(serializeTicket);
}

export async function getUsdtPurchaseTicket(user: AuthUser, ticketId: string) {
  const { assertTicketAccess } = await import('./ticket-access.service');
  await assertTicketAccess(user, ticketId);

  let ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId, type: TicketType.USDT_PURCHASE },
    include: USDT_PURCHASE_INCLUDE,
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  if (ticket.usdtPurchase) {
    const expired = await expireDepositWindowIfNeeded(
      ticketId,
      ticket.usdtPurchase,
      user.id,
    );
    if (expired) {
      ticket = await prisma.transactionTicket.findUniqueOrThrow({
        where: { id: ticketId },
        include: USDT_PURCHASE_INCLUDE,
      });
    }
  }

  return serializeTicket(ticket);
}

export async function saveDepositProofMetadata(
  user: AuthUser,
  ticketId: string,
  input: {
    depositAmount?: number;
    depositorName?: string;
    depositTransferredAt?: string;
  },
) {
  const { assertTicketAccess } = await import('./ticket-access.service');
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: {
      usdtPurchase: true,
      customer: {
        include: {
          user: {
            include: {
              bankAccounts: { where: { isActive: true, isDefault: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!ticket?.usdtPurchase) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  if (ticket.usdtPurchase.status !== UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING) {
    throw new AppError(400, 'Deposit proof not expected at this stage', 'INVALID_STATE');
  }

  if (
    ticket.usdtPurchase.depositDeadlineAt &&
    ticket.usdtPurchase.depositDeadlineAt < new Date()
  ) {
    throw new AppError(400, 'Deposit window expired (2 hours)', 'DEPOSIT_EXPIRED');
  }

  const registeredBank = ticket.customer?.user.bankAccounts[0];
  const bankMismatch = !checkBankMatch(
    input.depositorName,
    registeredBank?.accountHolder,
  );

  await prisma.usdtPurchaseDetail.update({
    where: { ticketId },
    data: {
      ...(input.depositAmount != null && { depositAmount: input.depositAmount }),
      ...(input.depositorName && { depositorName: input.depositorName }),
      ...(input.depositTransferredAt && {
        depositTransferredAt: new Date(input.depositTransferredAt),
      }),
      bankMismatch,
    },
  });

  return { bankMismatch, registeredBank };
}

export async function transitionUsdtPurchaseStatus(
  user: AuthUser,
  ticketId: string,
  toStatus: UsdtPurchaseStatus,
  extra?: { usdtTxId?: string; actualUsdtAmount?: number; adminNote?: string; cancelReason?: string },
) {
  const { assertTicketAccess, canChangeTicketStatus } = await import(
    './ticket-access.service'
  );
  await assertTicketAccess(user, ticketId);

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: {
      usdtPurchase: true,
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!ticket?.usdtPurchase) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  const fromStatus = ticket.usdtPurchase.status;
  const isAdmin = canChangeTicketStatus(user);
  const allowed = isAdmin
    ? ADMIN_TRANSITIONS[fromStatus]
    : CUSTOMER_TRANSITIONS[fromStatus];

  if (!allowed.includes(toStatus)) {
    throw new AppError(
      400,
      `Cannot transition from ${fromStatus} to ${toStatus}`,
      'INVALID_TRANSITION',
    );
  }

  if (toStatus === UsdtPurchaseStatus.COMPLETED) {
    if (!extra?.usdtTxId) {
      throw new AppError(400, 'usdtTxId is required for completion', 'VALIDATION_ERROR');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: toStatus,
        ...(extra?.usdtTxId && { usdtTxId: extra.usdtTxId }),
        ...(extra?.actualUsdtAmount != null && {
          actualUsdtAmount: extra.actualUsdtAmount,
        }),
        ...(extra?.adminNote && { adminNote: extra.adminNote }),
        ...(toStatus === UsdtPurchaseStatus.CANCELLED && {
          cancelReason: extra?.cancelReason ?? extra?.adminNote ?? '관리자 취소',
        }),
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus,
        toStatus,
        changedById: user.id,
        note: extra?.cancelReason ?? extra?.adminNote,
      },
    });

    if (toStatus === UsdtPurchaseStatus.COMPLETED && !ticket.commissionSettled) {
      const detail = await tx.usdtPurchaseDetail.findUniqueOrThrow({
        where: { ticketId },
      });
      const commissionPool = commissionPoolFromSnapshots(detail);
      await settleCommission(tx, {
        ticketId,
        ticketType: TicketType.USDT_PURCHASE,
        commissionPool,
        currency: detail.fiatCurrency,
      });
    }

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: USDT_PURCHASE_INCLUDE,
    });
  });

  if (toStatus === UsdtPurchaseStatus.COMPLETED && ticket.customer?.user) {
    const detail = updated.usdtPurchase!;
    void sendTradeReceiptEmail({
      to: ticket.customer.user.email,
      userName: ticket.customer.user.name,
      ticketNo: updated.ticketNo,
      fiatAmount: Number(detail.fiatAmount),
      fiatCurrency: detail.fiatCurrency,
      expectedUsdt: Number(detail.expectedUsdtAmount),
      actualUsdt: detail.actualUsdtAmount ? Number(detail.actualUsdtAmount) : null,
      usdtTxId: detail.usdtTxId,
    }).catch((err) => console.error('[trade-email]', err));
  }

  return serializeTicket(updated);
}

export async function getUsdtDepositContext(user: AuthUser) {
  const [receivingAccounts, registeredBank] = await Promise.all([
    hqPolicyService.getDepositReceivingAccounts(),
    user.role === UserRole.CUSTOMER
      ? prisma.bankAccount.findFirst({
          where: { userId: user.id, isActive: true, isDefault: true },
        })
      : Promise.resolve(null),
  ]);
  return {
    receivingAccounts,
    registeredBank: registeredBank
      ? {
          bankName: registeredBank.bankName,
          accountNumber: registeredBank.accountNumber,
          accountHolder: registeredBank.accountHolder,
        }
      : null,
    depositWindowHours: 2,
  };
}

function serializeTicket(ticket: Prisma.TransactionTicketGetPayload<{
  include: typeof USDT_PURCHASE_INCLUDE;
}>) {
  const detail = ticket.usdtPurchase!;
  const registeredBank = ticket.customer?.user.bankAccounts?.[0] ?? null;
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    type: ticket.type,
    commissionSettled: ticket.commissionSettled,
    commissionSettledAt: ticket.commissionSettledAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    customer: ticket.customer
      ? {
          ...ticket.customer,
          user: {
            id: ticket.customer.user.id,
            name: ticket.customer.user.name,
            email: ticket.customer.user.email,
          },
        }
      : undefined,
    status: detail.status,
    fiatAmount: Number(detail.fiatAmount),
    fiatCurrency: detail.fiatCurrency,
    exchangeRate: Number(detail.exchangeRate),
    exchangeRateAt: detail.exchangeRateAt,
    exchangeSource: detail.exchangeSource,
    fairExchangeRate: detail.fairExchangeRateSnapshot
      ? Number(detail.fairExchangeRateSnapshot)
      : null,
    kimchiPremiumPercent: detail.kimchiPremiumPercentSnapshot
      ? Number(detail.kimchiPremiumPercentSnapshot)
      : null,
    kimchiPremiumFeeUsdt: detail.kimchiPremiumFeeSnapshot
      ? Number(detail.kimchiPremiumFeeSnapshot)
      : null,
    expectedUsdtAmount: Number(detail.expectedUsdtAmount),
    expectedUsdtMin: detail.expectedUsdtMin ? Number(detail.expectedUsdtMin) : null,
    expectedUsdtMax: detail.expectedUsdtMax ? Number(detail.expectedUsdtMax) : null,
    targetUsdtAmount: detail.targetUsdtAmount ? Number(detail.targetUsdtAmount) : null,
    depositDeadlineAt: detail.depositDeadlineAt,
    bankMismatch: detail.bankMismatch,
    cancelReason: detail.cancelReason,
    depositAmount: detail.depositAmount ? Number(detail.depositAmount) : null,
    depositorName: detail.depositorName,
    depositTransferredAt: detail.depositTransferredAt,
    gasFeeSnapshot: Number(detail.gasFeeSnapshot),
    fxFeePercentSnapshot: Number(detail.fxFeePercentSnapshot),
    transferFeeSnapshot: Number(detail.transferFeeSnapshot),
    otherFeeSnapshot: Number(detail.otherFeeSnapshot),
    platformFeeSnapshot: Number(detail.platformFeeSnapshot),
    usdtTxId: detail.usdtTxId,
    actualUsdtAmount: detail.actualUsdtAmount
      ? Number(detail.actualUsdtAmount)
      : null,
    adminNote: detail.adminNote,
    wallet: detail.wallet,
    registeredBank: registeredBank
      ? {
          bankName: registeredBank.bankName,
          accountNumber: registeredBank.accountNumber,
          accountHolder: registeredBank.accountHolder,
        }
      : null,
    attachments: ticket.attachments,
    statusHistory: ticket.statusHistory,
  };
}

export { USDT_PURCHASE_INCLUDE };
