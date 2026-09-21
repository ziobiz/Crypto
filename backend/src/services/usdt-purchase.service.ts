import { Prisma, TicketType, UsdtPaymentMethod, UsdtPurchaseStatus, UserRole, WalletApprovalStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, isAppError } from '../lib/errors';
import { AuthUser } from '../types/auth';
import { isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';
import {
  calculateExpectedUsdtRange,
  fetchUsdtFiatRate,
  type FiatCurrency,
} from './exchange-rate.service';
import { settleCommission } from './commission.service';
import { sendTradeReceiptEmail } from './trade-email.service';
import {
  buildUsdtPurchaseInvoicePayload,
  detectUsdtSandboxTicket,
  notifyInvoiceTransactionCompleted,
} from './invoice-webhook.service';
import { hqPolicyService } from './hq-policy.service';
import { getWorkflowDisplay } from './workflow-display.service';
import { assertCustomerKycApproved } from './kyc.service';
import {
  collectionAccountToDisplay,
  createCurfexCollection,
  getCurfexConfig,
  resolveUsdtCollectionProvider,
} from './curfex.service';
import { computeExpectedCompleteAt, type HqSlaConfig } from '../constants/hq-policy';
import { evaluateUsdtAmountVariance } from '../lib/usdt-amount-guard';
import {
  resolveFeesForAmount,
  grossUsdtFromPurchaseSnapshots,
  getFeeDiagramDisplayForCustomer,
  getCommissionRiskConfig,
} from './transaction-fee.service';
import { buildFeeSnapshotFields } from '../lib/fee-component';
import {
  applyLocalPremiumToBaseFees,
  breakdownFromFiat,
  breakdownFromTarget,
  finalizeFiatBreakdown,
  getCurrencyAmountDisplayPolicy,
  getLocalPremiumContext,
  resolveFeesForPurchase,
  withOperatingFeeRates,
  loadOperatingFeeRatesForQuote,
  type ResolvedTransactionFees,
} from './usdt-fee-breakdown.service';
import {
  isLocalPremiumCurrency,
  type LocalMarketPremiumAnalysis,
  type LocalPremiumCurrency,
} from './local-market-premium.service';
import {
  countDailyTicketsForCustomer,
  getCustomerTransactionLimitSummary,
  QUOTE_VALIDITY_EXPIRED_REASON,
  validateCustomerTransactionAmount,
} from './transaction-limit.service';
import { validateUsdtRiskLimitAmount } from './usdt-risk-limit.service';
import {
  computeQuoteDueAt,
  getEffectiveQuotePolicyForCustomer,
  getUsdtQuoteResponsePolicy,
} from './usdt-quote-policy.service';

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
  [UsdtPurchaseStatus.QUOTE_PENDING]: [
    UsdtPurchaseStatus.QUOTE_CONFIRMED,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.QUOTE_CONFIRMED]: [
    UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.APPLICATION_COMPLETED]: [
    UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
    UsdtPurchaseStatus.CANCELLED,
  ],
  [UsdtPurchaseStatus.CARD_PAYMENT_PENDING]: [UsdtPurchaseStatus.ADMIN_REVIEWING, UsdtPurchaseStatus.CANCELLED],
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

/** 고객: 견적 확정 후 입금 증빙 / 입금 증빙 제출 시 전환 */
const CUSTOMER_TRANSITIONS: Record<UsdtPurchaseStatus, UsdtPurchaseStatus[]> = {
  [UsdtPurchaseStatus.QUOTE_PENDING]: [],
  [UsdtPurchaseStatus.QUOTE_CONFIRMED]: [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING],
  [UsdtPurchaseStatus.APPLICATION_COMPLETED]: [UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING],
  [UsdtPurchaseStatus.CARD_PAYMENT_PENDING]: [],
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
  detail: {
    status: UsdtPurchaseStatus;
    depositDeadlineAt: Date | null;
    quoteConfirmedAt?: Date | null;
  },
  systemUserId: string,
): Promise<boolean> {
  const expireStatuses: UsdtPurchaseStatus[] = [
    UsdtPurchaseStatus.QUOTE_CONFIRMED,
    UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
  ];
  if (!expireStatuses.includes(detail.status)) return false;
  if (!detail.depositDeadlineAt || detail.depositDeadlineAt > new Date()) return false;

  const fromStatus = detail.status;
  const fromQuote = !!detail.quoteConfirmedAt || fromStatus === UsdtPurchaseStatus.QUOTE_CONFIRMED;
  const cancelReason = fromQuote
    ? `${QUOTE_VALIDITY_EXPIRED_REASON}: 견적 유효시간 초과 — 일일 거래 1회 소진`
    : '입금 기한(2시간) 초과';
  const note = fromQuote
    ? '견적 유효시간 초과 — 자동 종료(일일 1회 소진)'
    : '입금 기한(2시간) 초과 — 자동 취소';

  await prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: UsdtPurchaseStatus.CANCELLED,
        cancelReason,
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus,
        toStatus: UsdtPurchaseStatus.CANCELLED,
        changedById: systemUserId,
        note,
      },
    });
  });
  return true;
}

/** 견적 확정·입금대기 티켓의 유효시간 만료 일괄 처리 */
export async function processExpiredQuoteValidity(): Promise<number> {
  const system = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, deletedAt: null },
    select: { id: true },
  });
  if (!system) return 0;
  const now = new Date();
  const rows = await prisma.usdtPurchaseDetail.findMany({
    where: {
      status: {
        in: [UsdtPurchaseStatus.QUOTE_CONFIRMED, UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING],
      },
      depositDeadlineAt: { lt: now },
    },
    select: {
      ticketId: true,
      status: true,
      depositDeadlineAt: true,
      quoteConfirmedAt: true,
    },
    take: 100,
  });
  let n = 0;
  for (const row of rows) {
    const ok = await expireDepositWindowIfNeeded(row.ticketId, row, system.id);
    if (ok) n += 1;
  }
  return n;
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
  wallet: Parameters<typeof resolveFeesForAmount>[0],
  currency: FiatCurrency,
  targetUsdt: number,
  rate: number,
  feePolicy?: Parameters<typeof resolveFeesForAmount>[3],
  customerProfileId?: string | null,
): Promise<{
  fees: ResolvedTransactionFees;
  fiatAmount: number;
  breakdown: ReturnType<typeof breakdownFromTarget>;
  localPremium?: ReturnType<typeof toLocalPremiumInfo>;
}> {
  const hasLocalPremium = isLocalPremiumCurrency(currency);
  let localPremium: LocalMarketPremiumAnalysis | null = null;
  if (hasLocalPremium) {
    try {
      localPremium = await getLocalPremiumContext(currency as LocalPremiumCurrency);
    } catch {
      localPremium = null;
    }
  }
  const opRates = await loadOperatingFeeRatesForQuote({ customerProfileId });
  let baseFees = withOperatingFeeRates(
    await resolveFeesForAmount(wallet, currency, 0, feePolicy),
    opRates,
  );
  let fees: ResolvedTransactionFees =
    localPremium != null ? applyLocalPremiumToBaseFees(baseFees, localPremium, 0) : baseFees;
  let breakdown = breakdownFromTarget(targetUsdt, rate, fees);

  baseFees = withOperatingFeeRates(
    await resolveFeesForAmount(wallet, currency, breakdown.requiredFiat, feePolicy),
    opRates,
  );
  if (hasLocalPremium && localPremium) {
    try {
      localPremium = await getLocalPremiumContext(currency as LocalPremiumCurrency);
    } catch {
      /* keep previous premium */
    }
    fees = applyLocalPremiumToBaseFees(baseFees, localPremium, breakdown.grossUsdt);
  } else {
    fees = baseFees;
  }
  breakdown = breakdownFromTarget(targetUsdt, rate, fees);
  const amountPolicy = await getCurrencyAmountDisplayPolicy();
  breakdown = finalizeFiatBreakdown(currency, breakdown, rate, fees, amountPolicy, {
    preserveTargetNet: true,
  });

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
      userId: merchantScopeUserId(user),
      isActive: true,
      approvalStatus: WalletApprovalStatus.APPROVED,
    },
  });

  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  const feeDiagramDisplay = await getFeeDiagramDisplayForCustomer(user.customerProfileId);
  const { rate } = await fetchUsdtFiatRate(currency);

  const assertUsdtRisk = async (usdtAmount: number) => {
    if (!user.customerProfileId || !(usdtAmount > 0)) return;
    await validateUsdtRiskLimitAmount({
      customerProfileId: user.customerProfileId,
      usdtAmount,
      fiatCurrency: currency,
      exchangeRate: rate,
    });
  };

  if (input.targetUsdtAmount != null && input.targetUsdtAmount > 0) {
    await assertUsdtRisk(input.targetUsdtAmount);
    const quoted = await quoteFromTarget(wallet, currency, input.targetUsdtAmount, rate, undefined, user.customerProfileId);
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
      currencyAmountDisplay: await getCurrencyAmountDisplayPolicy(),
    };
  }

  const fiatAmount = input.fiatAmount ?? 0;
  if (fiatAmount > 0 && rate > 0) {
    await assertUsdtRisk(fiatAmount / rate);
  }
  const fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate, { customerProfileId: user.customerProfileId });
  const amountPolicy = await getCurrencyAmountDisplayPolicy();
  const breakdown =
    fiatAmount > 0
      ? finalizeFiatBreakdown(
          currency,
          breakdownFromFiat(fiatAmount, rate, fees),
          rate,
          fees,
          amountPolicy,
        )
      : undefined;
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
        fiatAmount: breakdown?.requiredFiat ?? fiatAmount,
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
    fiatAmount: breakdown?.requiredFiat ?? fiatAmount,
    exchangeRate: rate,
    breakdown,
    localPremium: localPremiumInfo,
    kimchiPremium: localPremiumInfo?.currency === 'KRW' ? localPremiumInfo : undefined,
    transactionLimits,
    feeDiagramDisplay,
    currencyAmountDisplay: amountPolicy,
  };
}

const HQ_SIM_WALLET = {
  fxFeePercent: 0,
  gasFeeAmount: 0,
  transferFeeAmount: 0,
  otherFeeAmount: 0,
  platformFeeAmount: 0,
  network: 'TRC20',
};

/** 본사 수수료 정책 기준 견적 (지갑 없음) */
export async function simulateHqUsdtQuote(input: {
  fiatCurrency?: FiatCurrency;
  fiatAmount?: number;
  targetUsdtAmount?: number;
  network?: string;
  feePolicy?: 'live' | 'sandbox';
  customerProfileId?: string | null;
  /** 고객만 true — 본사/운영자는 한도·±% 참고범위 미적용 */
  enforceCustomerLimits?: boolean;
}) {
  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  const { rate, source, fetchedAt } = await fetchUsdtFiatRate(currency);
  const network = input.network?.trim();
  if (!network) {
    throw new AppError(400, 'Withdrawal network is required', 'NETWORK_REQUIRED');
  }
  const wallet = { ...HQ_SIM_WALLET, network };
  const feeOpts = input.feePolicy === 'sandbox' ? { feePolicy: 'sandbox' as const } : undefined;
  const policyBasis = input.feePolicy === 'sandbox' ? ('SANDBOX' as const) : ('HQ' as const);
  const diagramScope = input.feePolicy === 'sandbox' ? ('sandbox' as const) : ('live' as const);
  const enforceCustomerLimits = Boolean(input.enforceCustomerLimits && input.customerProfileId);
  const feeDiagramDisplay = await getFeeDiagramDisplayForCustomer(
    input.customerProfileId ?? null,
    diagramScope,
    enforceCustomerLimits ? 'customer' : 'hq',
  );
  const amountRangePct = enforceCustomerLimits ? 5 : undefined;

  try {
    if (input.targetUsdtAmount != null && Number(input.targetUsdtAmount) > 0) {
      await validateUsdtRiskLimitAmount({
        customerProfileId: input.customerProfileId ?? null,
        usdtAmount: Number(input.targetUsdtAmount),
        enforce: enforceCustomerLimits,
        fiatCurrency: currency,
        exchangeRate: rate,
      });
      const quoted = await quoteFromTarget(
        wallet,
        currency,
        Number(input.targetUsdtAmount),
        rate,
        feeOpts,
      );
      return {
        fees: quoted.fees,
        fiatAmount: quoted.fiatAmount,
        exchangeRate: rate,
        rateSource: source,
        rateFetchedAt: fetchedAt,
        breakdown: quoted.breakdown,
        localPremium: quoted.localPremium,
        kimchiPremium: quoted.localPremium?.currency === 'KRW' ? quoted.localPremium : undefined,
        feeDiagramDisplay,
        policyBasis,
        currencyAmountDisplay: await getCurrencyAmountDisplayPolicy(),
        amountRangePct,
      };
    }

    const fiatAmount = input.fiatAmount ?? 0;
    if (fiatAmount > 0 && rate > 0) {
      await validateUsdtRiskLimitAmount({
        customerProfileId: input.customerProfileId ?? null,
        usdtAmount: fiatAmount / rate,
        enforce: enforceCustomerLimits,
        fiatCurrency: currency,
        exchangeRate: rate,
      });
    }
    const fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate, feeOpts);
    const amountPolicy = await getCurrencyAmountDisplayPolicy();
    const breakdown =
      fiatAmount > 0
        ? finalizeFiatBreakdown(
            currency,
            breakdownFromFiat(fiatAmount, rate, fees),
            rate,
            fees,
            amountPolicy,
          )
        : undefined;
    let localPremiumInfo;
    if (isLocalPremiumCurrency(currency) && fiatAmount > 0) {
      try {
        const localPremium = await getLocalPremiumContext(currency);
        localPremiumInfo = toLocalPremiumInfo(localPremium);
      } catch {
        localPremiumInfo = undefined;
      }
    }

    return {
      fees,
      fiatAmount: breakdown?.requiredFiat ?? fiatAmount,
      exchangeRate: rate,
      rateSource: source,
      rateFetchedAt: fetchedAt,
      breakdown,
      localPremium: localPremiumInfo,
      kimchiPremium: localPremiumInfo?.currency === 'KRW' ? localPremiumInfo : undefined,
      feeDiagramDisplay,
      policyBasis,
      currencyAmountDisplay: amountPolicy,
      amountRangePct,
    };
  } catch (e) {
    if (isAppError(e)) throw e;
    throw new AppError(
      400,
      e instanceof Error ? e.message : 'Simulation failed',
      'SIMULATE_FAILED',
    );
  }
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
  if (!isMerchantSide(user) || !user.customerProfileId) {
    throw new AppError(403, 'Only customers can create purchase tickets', 'FORBIDDEN');
  }
  await assertCustomerKycApproved(merchantScopeUserId(user));

  if (!input.fiatAmount && !input.targetUsdtAmount) {
    throw new AppError(400, 'fiatAmount or targetUsdtAmount is required', 'VALIDATION');
  }

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: input.walletId,
      userId: merchantScopeUserId(user),
      isActive: true,
      approvalStatus: WalletApprovalStatus.APPROVED,
    },
  });

  if (!wallet) {
    throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
  }

  const sessionPolicy = await hqPolicyService.getSessionPolicy();
  const currency = input.fiatCurrency ?? sessionPolicy.defaultUsdtFiatCurrency ?? 'JPY';
  await hqPolicyService.assertUsdtFiatMethodEnabled(currency, 'TRANSFER');
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
    await validateUsdtRiskLimitAmount({
      customerProfileId: user.customerProfileId,
      usdtAmount: input.targetUsdtAmount,
      fiatCurrency: currency,
      exchangeRate: rate,
    });
    const quoted = await quoteFromTarget(wallet, currency, input.targetUsdtAmount, rate, undefined, user.customerProfileId);
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
    if (rate > 0) {
      await validateUsdtRiskLimitAmount({
        customerProfileId: user.customerProfileId,
        usdtAmount: fiatAmount / rate,
        fiatCurrency: currency,
        exchangeRate: rate,
      });
    }
    fees = await resolveFeesForPurchase(wallet, currency, fiatAmount, rate, { customerProfileId: user.customerProfileId });
    const amountPolicy = await getCurrencyAmountDisplayPolicy();
    feeBreakdown = finalizeFiatBreakdown(
      currency,
      breakdownFromFiat(fiatAmount, rate, fees),
      rate,
      fees,
      amountPolicy,
    );
    fiatAmount = feeBreakdown.requiredFiat;
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
    select: {
      customerType: true,
      usdtCollectionMode: true,
      usdtQuoteResponseMode: true,
      usdtQuoteAutoDelayMinutes: true,
      usdtQuoteManualSlaHours: true,
    },
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

  const quotePolicy = await getEffectiveQuotePolicyForCustomer({
    usdtQuoteResponseMode: customerProfile.usdtQuoteResponseMode,
    usdtQuoteAutoDelayMinutes: customerProfile.usdtQuoteAutoDelayMinutes,
    usdtQuoteManualSlaHours: customerProfile.usdtQuoteManualSlaHours,
  });
  const curfexCfg = await getCurfexConfig();
  const useVirtual =
    resolveUsdtCollectionProvider({
      customerMode: customerProfile.usdtCollectionMode,
      config: curfexCfg,
      currency,
    }) === 'CURFEX';
  /**
   * 은행이체(고정·CURFEX) + 견적 정책 ON → 견적대기/확정.
   * 고객별 견적 모드(FOLLOW_HQ/AUTO/MANUAL/OFF)가 본사 정책을 오버라이드.
   * CURFEX 가상계좌는 견적 확정 후 발급(확정 금액 기준).
   * 견적 OFF면 기존처럼 신청 직후 입금대기(+CURFEX면 즉시 계좌발급).
   * 카드는 별도 서비스로 즉시 PG 결제 유지.
   */
  const useQuoteFlow = quotePolicy.enabled;

  const feeSnapshots = buildFeeSnapshotFields(fees, {
    fxFeeUsdt: feeBreakdown?.fxFeeUsdt ?? 0,
    gasFeeUsdt: feeBreakdown?.gasFeeUsdt ?? 0,
    transferFeeUsdt: feeBreakdown?.transferFeeUsdt ?? 0,
    otherFeeUsdt: feeBreakdown?.baseOtherFeeUsdt ?? feeBreakdown?.otherFeeUsdt ?? 0,
  });

  const ticketNo = generateTicketNo();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  let collectionFields: {
    collectionProvider: string;
    curfexRefNo?: string;
    curfexStatusCode?: string;
    collectionAccountJson?: object;
  } = { collectionProvider: useVirtual ? 'CURFEX' : 'FIXED' };

  const depositDeadlineAt = useQuoteFlow ? null : new Date(Date.now() + DEPOSIT_WINDOW_MS);
  const quoteDueAt = useQuoteFlow ? computeQuoteDueAt(quotePolicy) : null;

  // 견적 OFF일 때만 신청 즉시 CURFEX 계좌 발급. 견적 ON이면 확정 후 발급.
  if (useVirtual && !useQuoteFlow) {
    const collection = await createCurfexCollection({
      sendAmount: fiatAmount,
      currency,
      merchantReference: ticketNo,
      customerName: dbUser?.name || user.email,
      customerEmail: dbUser?.email || user.email,
      customerType: customerProfile.customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL',
      description: `TINPASS USDT ${ticketNo}`,
      paymentDueDateTime: (depositDeadlineAt ?? new Date(Date.now() + DEPOSIT_WINDOW_MS)).toISOString(),
      requestExpiryDateTime: (depositDeadlineAt ?? new Date(Date.now() + DEPOSIT_WINDOW_MS)).toISOString(),
    });
    collectionFields = {
      collectionProvider: 'CURFEX',
      curfexRefNo: collection.refNo,
      curfexStatusCode: collection.statusCode,
      collectionAccountJson: collection.collectionAccount as object,
    };
  }

  const initialStatus = useQuoteFlow
    ? UsdtPurchaseStatus.QUOTE_PENDING
    : UsdtPurchaseStatus.APPLICATION_COMPLETED;

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTicket.create({
      data: {
        ticketNo,
        type: TicketType.USDT_PURCHASE,
        customerId: user.customerProfileId!,
        usdtPurchase: {
          create: {
            status: initialStatus,
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
            quoteMode: useQuoteFlow ? quotePolicy.mode : null,
            quoteDueAt,
            ...feeSnapshots,
            walletId: wallet.id,
            ...collectionFields,
          },
        },
      },
      include: USDT_PURCHASE_INCLUDE,
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: null,
        toStatus: initialStatus,
        changedById: user.id,
        note: useQuoteFlow ? 'USDT 매입 신청 (견적 대기)' : 'USDT 매입 신청',
      },
    });

    if (!useQuoteFlow) {
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
          note: `입금 증빙 대기 (기한: ${depositDeadlineAt!.toISOString()})`,
        },
      });
    }

    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: created.id },
      include: USDT_PURCHASE_INCLUDE,
    });
  });

  const { recordMerchantOperation } = await import('./merchant-operation-log.service');
  await recordMerchantOperation({
    actorId: user.id,
    merchantAdminUserId: merchantScopeUserId(user),
    action: 'USDT_CREATE',
    entityType: 'TransactionTicket',
    entityId: ticket.id,
    summary: `USDT purchase ${ticket.ticketNo}`,
    otpVerified: false,
  });

  // AUTO + 즉시(0분): 생성 직후 확정
  if (
    useQuoteFlow &&
    quotePolicy.mode === 'AUTO' &&
    quotePolicy.autoDelayMinutes === 0
  ) {
    return confirmUsdtQuote(user, ticket.id, { system: true });
  }

  return serializeTicket(ticket, (await getWorkflowDisplay()).sla);
}

/**
 * 견적 확정 — 자동 잡·즉시 AUTO·관리자 「확정하기」
 * 확정 입금액이 고객 송금 기준이 된다.
 * CURFEX 건은 확정 금액으로 가상계좌를 이때 발급한다.
 */
export async function confirmUsdtQuote(
  actor: AuthUser | { id: string },
  ticketId: string,
  opts?: {
    system?: boolean;
    confirmedFiatAmount?: number;
    confirmedUsdtAmount?: number;
    adminNote?: string;
  },
) {
  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId, type: TicketType.USDT_PURCHASE },
    include: USDT_PURCHASE_INCLUDE,
  });
  if (!ticket?.usdtPurchase) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }
  const detail = ticket.usdtPurchase;
  if (detail.status !== UsdtPurchaseStatus.QUOTE_PENDING) {
    throw new AppError(400, 'Quote is not pending', 'INVALID_STATE');
  }

  if (!opts?.system) {
    const { canChangeTicketStatus } = await import('./ticket-access.service');
    if (!canChangeTicketStatus(actor as AuthUser)) {
      throw new AppError(403, 'Operator role required', 'FORBIDDEN');
    }
  }

  const confirmedFiat =
    opts?.confirmedFiatAmount != null && opts.confirmedFiatAmount > 0
      ? opts.confirmedFiatAmount
      : Number(detail.fiatAmount);
  const confirmedUsdt =
    opts?.confirmedUsdtAmount != null && opts.confirmedUsdtAmount > 0
      ? opts.confirmedUsdtAmount
      : Number(detail.expectedUsdtAmount);
  const now = new Date();
  const actorId = actor.id;
  const quotePolicy = await getUsdtQuoteResponsePolicy();
  const quoteValidMs = Math.max(1, quotePolicy.quoteValidMinutes) * 60 * 1000;
  const depositDeadlineAt = new Date(now.getTime() + quoteValidMs);

  let curfexIssue: {
    curfexRefNo: string;
    curfexStatusCode: string;
    collectionAccountJson: object;
  } | null = null;

  const needsCurfexIssue =
    detail.collectionProvider === 'CURFEX' && !detail.curfexRefNo;
  if (needsCurfexIssue) {
    const currency = detail.fiatCurrency as FiatCurrency;
    const customerUser = ticket.customer?.user;
    const collection = await createCurfexCollection({
      sendAmount: confirmedFiat,
      currency,
      merchantReference: ticket.ticketNo,
      customerName: customerUser?.name || customerUser?.email || 'customer',
      customerEmail: customerUser?.email || 'noreply@tinpass.com',
      customerType:
        ticket.customer?.customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL',
      description: `TINPASS USDT ${ticket.ticketNo}`,
      paymentDueDateTime: depositDeadlineAt.toISOString(),
      requestExpiryDateTime: depositDeadlineAt.toISOString(),
    });
    curfexIssue = {
      curfexRefNo: collection.refNo,
      curfexStatusCode: collection.statusCode,
      collectionAccountJson: collection.collectionAccount as object,
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: UsdtPurchaseStatus.QUOTE_CONFIRMED,
        quoteConfirmedAt: now,
        confirmedFiatAmount: confirmedFiat,
        confirmedUsdtAmount: confirmedUsdt,
        fiatAmount: confirmedFiat,
        expectedUsdtAmount: confirmedUsdt,
        // 확정 후 범위는 단일 금액
        expectedUsdtMin: confirmedUsdt,
        expectedUsdtMax: confirmedUsdt,
        // 확정 시점부터 입금 기한 시작 (CURFEX 계좌 만료와 맞춤)
        depositDeadlineAt,
        ...(opts?.adminNote ? { adminNote: opts.adminNote } : {}),
        ...(curfexIssue
          ? {
              curfexRefNo: curfexIssue.curfexRefNo,
              curfexStatusCode: curfexIssue.curfexStatusCode,
              collectionAccountJson: curfexIssue.collectionAccountJson,
            }
          : {}),
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: UsdtPurchaseStatus.QUOTE_PENDING,
        toStatus: UsdtPurchaseStatus.QUOTE_CONFIRMED,
        changedById: actorId,
        note: opts?.system
          ? curfexIssue
            ? '견적 자동 확정 · CURFEX 계좌 발급'
            : '견적 자동 확정'
          : curfexIssue
            ? `견적 확정 · CURFEX 계좌 발급 (입금 ${confirmedFiat} / ${confirmedUsdt} USDT)`
            : `견적 확정 (입금 ${confirmedFiat} / ${confirmedUsdt} USDT)`,
      },
    });
    return tx.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: USDT_PURCHASE_INCLUDE,
    });
  });

  return serializeTicket(updated, (await getWorkflowDisplay()).sla);
}

/** 만료된 AUTO 견적 자동 확정 */
export async function processDueUsdtQuoteConfirmations(): Promise<number> {
  const now = new Date();
  const due = await prisma.usdtPurchaseDetail.findMany({
    where: {
      status: UsdtPurchaseStatus.QUOTE_PENDING,
      quoteMode: 'AUTO',
      quoteDueAt: { lte: now },
    },
    select: {
      ticketId: true,
      ticket: { select: { customer: { select: { userId: true } } } },
    },
  });
  let count = 0;
  for (const row of due) {
    const systemUserId = row.ticket.customer?.userId;
    if (!systemUserId) continue;
    try {
      await confirmUsdtQuote({ id: systemUserId }, row.ticketId, { system: true });
      count += 1;
    } catch (err) {
      console.error('[usdt-quote] auto-confirm failed', row.ticketId, err);
    }
  }
  return count;
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

  const sla = (await getWorkflowDisplay()).sla;
  return refreshed.map((row) => serializeTicket(row, sla));
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

  const base = serializeTicket(ticket, (await getWorkflowDisplay()).sla);
  const feeDiagramDisplay = await getFeeDiagramDisplayForCustomer(ticket.customerId);
  return { ...base, feeDiagramDisplay };
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
  extra?: {
    usdtTxId?: string;
    actualUsdtAmount?: number;
    adminNote?: string;
    cancelReason?: string;
    amountConfirmAcknowledged?: boolean;
    /** Force Invoice memo [SANDBOX] (sandbox completion page). */
    sandboxInvoice?: boolean;
  },
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
  const purchase = ticket.usdtPurchase;

  const fromStatus = purchase.status;
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

  if (toStatus === UsdtPurchaseStatus.QUOTE_CONFIRMED) {
    return confirmUsdtQuote(user, ticketId, {
      adminNote: extra?.adminNote,
    });
  }

  if (toStatus === UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING) {
    const deadline =
      ticket.usdtPurchase.depositDeadlineAt &&
      ticket.usdtPurchase.depositDeadlineAt > new Date()
        ? ticket.usdtPurchase.depositDeadlineAt
        : new Date(Date.now() + DEPOSIT_WINDOW_MS);
    await prisma.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: toStatus,
        depositDeadlineAt: deadline,
        ...(extra?.adminNote && { adminNote: extra.adminNote }),
        ...(extra?.cancelReason && { cancelReason: extra.cancelReason }),
      },
    });
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus,
        toStatus,
        changedById: user.id,
        note: extra?.adminNote || extra?.cancelReason || `입금 증빙 대기 (기한: ${deadline.toISOString()})`,
      },
    });
    const refreshed = await prisma.transactionTicket.findUniqueOrThrow({
      where: { id: ticketId },
      include: USDT_PURCHASE_INCLUDE,
    });
    return serializeTicket(refreshed, (await getWorkflowDisplay()).sla);
  }

  if (toStatus === UsdtPurchaseStatus.COMPLETED) {
    if (!extra?.usdtTxId) {
      throw new AppError(400, 'usdtTxId is required for completion', 'VALIDATION_ERROR');
    }
    if (extra.actualUsdtAmount != null) {
      const variance = evaluateUsdtAmountVariance(
        {
          expectedUsdtAmount: Number(ticket.usdtPurchase.expectedUsdtAmount),
          expectedUsdtMin: ticket.usdtPurchase.expectedUsdtMin
            ? Number(ticket.usdtPurchase.expectedUsdtMin)
            : null,
          expectedUsdtMax: ticket.usdtPurchase.expectedUsdtMax
            ? Number(ticket.usdtPurchase.expectedUsdtMax)
            : null,
          targetUsdtAmount: ticket.usdtPurchase.targetUsdtAmount
            ? Number(ticket.usdtPurchase.targetUsdtAmount)
            : null,
        },
        extra.actualUsdtAmount,
      );
      if (variance.requiresConfirm && !extra.amountConfirmAcknowledged) {
        throw new AppError(
          400,
          'Actual USDT amount is outside the expected range. Operator confirmation required.',
          'USDT_AMOUNT_CONFIRM_REQUIRED',
        );
      }
    }
  }

  const sandboxComplete =
    toStatus === UsdtPurchaseStatus.COMPLETED &&
    (extra?.sandboxInvoice === true ||
      detectUsdtSandboxTicket(purchase) ||
      (await getCurfexConfig()).sandbox === true);

  const updated = await prisma.$transaction(async (tx) => {
    const noteForUpdate = (() => {
      if (toStatus !== UsdtPurchaseStatus.COMPLETED) return extra?.adminNote;
      if (!sandboxComplete) return extra?.adminNote;
      const base = (extra?.adminNote ?? purchase.adminNote ?? '').trim();
      if (base.includes('[SANDBOX]')) return extra?.adminNote ?? base;
      return base ? `[SANDBOX] ${base}` : '[SANDBOX]';
    })();

    await tx.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        status: toStatus,
        ...(extra?.usdtTxId && { usdtTxId: extra.usdtTxId }),
        ...(extra?.actualUsdtAmount != null && {
          actualUsdtAmount: extra.actualUsdtAmount,
        }),
        ...(noteForUpdate != null && { adminNote: noteForUpdate }),
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
        note: extra?.cancelReason ?? noteForUpdate ?? extra?.adminNote,
      },
    });

    if (toStatus === UsdtPurchaseStatus.COMPLETED && !ticket.commissionSettled) {
      const detail = await tx.usdtPurchaseDetail.findUniqueOrThrow({
        where: { ticketId },
      });
      // 운영수수료 = 환산 USDT × 합계% + 합계 건당 → 조직 배분 기준은 환산 USDT
      const commissionPool = grossUsdtFromPurchaseSnapshots(detail);
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

  if (toStatus === UsdtPurchaseStatus.COMPLETED) {
    const detail = updated.usdtPurchase!;
    const sandbox =
      extra?.sandboxInvoice === true ||
      detectUsdtSandboxTicket(detail) ||
      detail.adminNote?.includes('[SANDBOX]') === true;
    const { payload, idempotencyKey } = buildUsdtPurchaseInvoicePayload({
      ticketId: updated.id,
      ticketNo: updated.ticketNo,
      fiatAmount: Number(detail.fiatAmount),
      fiatCurrency: detail.fiatCurrency,
      assetAmount: Number(detail.actualUsdtAmount ?? detail.expectedUsdtAmount),
      buyerRef: ticket.customerId || ticket.customer?.user?.email || null,
      usdtTxId: detail.usdtTxId,
      sandbox,
    });
    void notifyInvoiceTransactionCompleted(payload, idempotencyKey);
  }

  return serializeTicket(updated, (await getWorkflowDisplay()).sla);
}

export async function getUsdtDepositContext(user: AuthUser) {
  const [receivingAccounts, registeredBank, curfexCfg, currencyTrade, customerMode, hqQuote] =
    await Promise.all([
    hqPolicyService.getDepositReceivingAccounts(),
    user.role === UserRole.CUSTOMER || user.role === UserRole.CUSTOMER_OPERATOR
      ? prisma.bankAccount.findFirst({
          where: { userId: merchantScopeUserId(user), isActive: true, isDefault: true },
        })
      : Promise.resolve(null),
    getCurfexConfig(),
    hqPolicyService.getUsdtCurrencyTradePolicy(),
    user.customerProfileId
      ? prisma.customerProfile.findUnique({
          where: { id: user.customerProfileId },
          select: {
            usdtCollectionMode: true,
            usdtQuoteResponseMode: true,
            usdtQuoteAutoDelayMinutes: true,
            usdtQuoteManualSlaHours: true,
          },
        })
      : Promise.resolve(null),
    getUsdtQuoteResponsePolicy(),
  ]);
  const mode = customerMode?.usdtCollectionMode ?? 'FOLLOW_HQ';
  const currencies = (curfexCfg.currencies ?? ['JPY']) as string[];
  const virtualCurrencies = currencies.filter(
    (c) =>
      resolveUsdtCollectionProvider({
        customerMode: mode,
        config: curfexCfg,
        currency: c,
      }) === 'CURFEX',
  );
  const quoteResponse = await getEffectiveQuotePolicyForCustomer(customerMode);

  let dailyTicketCount = 0;
  let maxDailyTicketsPerCustomer = 0;
  if (user.customerProfileId) {
    const [count, risk] = await Promise.all([
      countDailyTicketsForCustomer(user.customerProfileId),
      getCommissionRiskConfig(),
    ]);
    dailyTicketCount = count;
    maxDailyTicketsPerCustomer = risk.maxDailyTicketsPerCustomer;
  }
  const dailyTicketLimitReached =
    maxDailyTicketsPerCustomer > 0 && dailyTicketCount >= maxDailyTicketsPerCustomer;

  return {
    receivingAccounts,
    currencyTrade,
    /** 이 고객에게 가상계좌가 적용되는 통화 (신청 UI용) */
    curfexEnabledCurrencies: virtualCurrencies,
    usdtCollectionMode: mode,
    hqDefaultCollectionMode: curfexCfg.defaultCollectionMode === 'VIRTUAL' ? 'VIRTUAL' : 'FIXED',
    registeredBank: registeredBank
      ? {
          bankName: registeredBank.bankName,
          accountNumber: registeredBank.accountNumber,
          accountHolder: registeredBank.accountHolder,
        }
      : null,
    depositWindowHours: 2,
    quoteValidMinutes: hqQuote.quoteValidMinutes,
    applyIdleMinutes: hqQuote.applyIdleMinutes,
    applyMaxMinutes: hqQuote.applyMaxMinutes,
    dailyTicketCount,
    maxDailyTicketsPerCustomer,
    dailyTicketLimitReached,
    quoteResponse,
    usdtQuoteResponseMode: customerMode?.usdtQuoteResponseMode ?? 'FOLLOW_HQ',
  };
}

function serializeTicket(
  ticket: Prisma.TransactionTicketGetPayload<{
  include: typeof USDT_PURCHASE_INCLUDE;
}>,
  sla: HqSlaConfig,
) {
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
    expectedCompleteAt: computeExpectedCompleteAt(ticket.createdAt, sla).toISOString(),
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
    paymentMethod: detail.paymentMethod,
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
    quoteMode: detail.quoteMode ?? null,
    quoteDueAt: detail.quoteDueAt,
    quoteConfirmedAt: detail.quoteConfirmedAt,
    confirmedFiatAmount: detail.confirmedFiatAmount != null ? Number(detail.confirmedFiatAmount) : null,
    confirmedUsdtAmount: detail.confirmedUsdtAmount != null ? Number(detail.confirmedUsdtAmount) : null,
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
    feePolicySnapshot: detail.feePolicySnapshot ?? null,
    cardFeePercentSnapshot: detail.cardFeePercentSnapshot
      ? Number(detail.cardFeePercentSnapshot)
      : null,
    cardFeeFiatSnapshot: detail.cardFeeFiatSnapshot ? Number(detail.cardFeeFiatSnapshot) : null,
    cardChargeFiat: detail.cardChargeFiat ? Number(detail.cardChargeFiat) : null,
    cardPaymentStatus: detail.cardPaymentStatus,
    cardLast4: detail.cardLast4,
    icopayOrderId: detail.icopayOrderId,
    icopayTransactionId: detail.icopayTransactionId,
    collectionProvider:
      detail.collectionProvider ??
      (detail.paymentMethod === UsdtPaymentMethod.CARD ? null : 'FIXED'),
    curfexRefNo: detail.curfexRefNo ?? null,
    curfexStatusCode: detail.curfexStatusCode ?? null,
    curfexDepositDetectedAt: detail.curfexDepositDetectedAt ?? null,
    curfexAutoDetect: detail.collectionProvider === 'CURFEX',
    collectionAccount: (() => {
      const raw = detail.collectionAccountJson as Record<string, unknown> | null;
      if (!raw || detail.collectionProvider !== 'CURFEX') return null;
      try {
        return collectionAccountToDisplay({
          bankName: String(raw.bankName ?? ''),
          branchCode: raw.branchCode != null ? String(raw.branchCode) : undefined,
          branchName: raw.branchName != null ? String(raw.branchName) : undefined,
          accountType: raw.accountType != null ? String(raw.accountType) : undefined,
          accountNo: String(raw.accountNo ?? ''),
          accountName: String(raw.accountName ?? ''),
        });
      } catch {
        return null;
      }
    })(),
    usdtTxId: detail.usdtTxId,
    actualUsdtAmount: detail.actualUsdtAmount
      ? Number(detail.actualUsdtAmount)
      : null,
    brokerUsdtAmount: detail.brokerUsdtAmount != null ? Number(detail.brokerUsdtAmount) : null,
    adminNote: detail.adminNote,
    sandboxInvoice: detectUsdtSandboxTicket(detail),
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

export { USDT_PURCHASE_INCLUDE, serializeTicket };
