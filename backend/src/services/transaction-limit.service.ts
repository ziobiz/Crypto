import { CustomerType, UsdtPaymentMethod, UsdtPurchaseStatus } from '@prisma/client';
import {
  type CurrencyTransactionLimits,
  type HqCommissionRiskConfig,
  type LimitPaymentMethod,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  defaultCurrencyLimits,
  resolveLimitPaymentMethod,
} from '../lib/transaction-limit-policy';

const ACTIVE_STATUSES: UsdtPurchaseStatus[] = [
  UsdtPurchaseStatus.QUOTE_PENDING,
  UsdtPurchaseStatus.QUOTE_CONFIRMED,
  UsdtPurchaseStatus.APPLICATION_COMPLETED,
  UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
  UsdtPurchaseStatus.ADMIN_REVIEWING,
  UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
  UsdtPurchaseStatus.COMPLETED,
];

/** 견적 유효시간 만료로 자동 취소된 건 — 일일 기회 1회로 집계 */
export const QUOTE_VALIDITY_EXPIRED_REASON = 'QUOTE_VALIDITY_EXPIRED';

export async function countDailyTicketsForCustomer(
  customerId: string,
  now = new Date(),
): Promise<number> {
  return prisma.usdtPurchaseDetail.count({
    where: {
      ticket: { customerId },
      createdAt: { gte: startOfUtcDay(now) },
      OR: [
        { status: { in: ACTIVE_STATUSES } },
        {
          status: UsdtPurchaseStatus.CANCELLED,
          cancelReason: { startsWith: QUOTE_VALIDITY_EXPIRED_REASON },
        },
      ],
    },
  });
}

async function loadRiskConfig(): Promise<HqCommissionRiskConfig> {
  const { getCommissionRiskConfig } = await import('./transaction-fee.service');
  return getCommissionRiskConfig();
}

export function toCustomerTypeKey(customerType: CustomerType): 'INDIVIDUAL' | 'CORPORATE' {
  return customerType === CustomerType.CORPORATE ? 'CORPORATE' : 'INDIVIDUAL';
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function toPrismaPaymentMethod(method: LimitPaymentMethod): UsdtPaymentMethod {
  if (method === 'CARD') return UsdtPaymentMethod.CARD;
  if (method === 'REMITTANCE') return UsdtPaymentMethod.REMITTANCE;
  return UsdtPaymentMethod.BANK_TRANSFER;
}

export async function getCustomerFiatTotals(
  customerId: string,
  currency: SymbolFeeCurrency,
  now = new Date(),
  paymentMethod?: LimitPaymentMethod | string | null,
): Promise<{ dailyTotal: number; monthlyTotal: number }> {
  const dayStart = startOfUtcDay(now);
  const monthStart = startOfUtcMonth(now);
  const method = paymentMethod ? resolveLimitPaymentMethod(paymentMethod) : null;

  const rows = await prisma.usdtPurchaseDetail.findMany({
    where: {
      fiatCurrency: currency,
      status: { in: ACTIVE_STATUSES },
      ticket: { customerId },
      createdAt: { gte: monthStart },
      ...(method ? { paymentMethod: toPrismaPaymentMethod(method) } : {}),
    },
    select: { fiatAmount: true, createdAt: true },
  });

  let dailyTotal = 0;
  let monthlyTotal = 0;
  for (const row of rows) {
    const amount = Number(row.fiatAmount);
    monthlyTotal += amount;
    if (row.createdAt >= dayStart) dailyTotal += amount;
  }

  return {
    dailyTotal: Number(dailyTotal.toFixed(2)),
    monthlyTotal: Number(monthlyTotal.toFixed(2)),
  };
}

export type TransactionLimitCheck = {
  allowed: boolean;
  minAmount: number;
  maxAmount: number | null;
  dailyTotal: number;
  monthlyTotal: number;
  limits: CurrencyTransactionLimits;
  paymentMethod: LimitPaymentMethod;
};

export function checkTransactionAmount(
  limits: CurrencyTransactionLimits,
  amount: number,
  dailyTotal: number,
  monthlyTotal: number,
): Omit<TransactionLimitCheck, 'paymentMethod'> {
  const minCandidates = [
    limits.perTransactionMin,
    limits.dailyMin,
    limits.monthlyMin,
  ].filter((v) => v > 0);
  const minAmount = minCandidates.length ? Math.max(...minCandidates) : 0;

  const maxCandidates = [
    limits.perTransactionMax > 0 ? limits.perTransactionMax : Infinity,
    limits.dailyMax > 0 ? limits.dailyMax - dailyTotal : Infinity,
    limits.monthlyMax > 0 ? limits.monthlyMax - monthlyTotal : Infinity,
  ].filter((v) => Number.isFinite(v) && v >= 0);

  const maxAmount =
    maxCandidates.length && Math.min(...maxCandidates) !== Infinity
      ? Math.min(...maxCandidates)
      : null;

  const allowed =
    amount > 0 &&
    (minAmount <= 0 || amount + 1e-9 >= minAmount) &&
    (maxAmount == null || amount <= maxAmount + 1e-9);

  return {
    allowed,
    minAmount,
    maxAmount,
    dailyTotal,
    monthlyTotal,
    limits,
  };
}

export async function validateCustomerTransactionAmount(input: {
  customerId: string;
  customerType: CustomerType;
  currency: SymbolFeeCurrency;
  fiatAmount: number;
  paymentMethod?: LimitPaymentMethod | string | null;
  risk?: HqCommissionRiskConfig;
}): Promise<TransactionLimitCheck> {
  const risk = input.risk ?? (await loadRiskConfig());
  const paymentMethod = resolveLimitPaymentMethod(input.paymentMethod);
  if (!risk.riskEnabled) {
    return {
      allowed: true,
      minAmount: 0,
      maxAmount: null,
      dailyTotal: 0,
      monthlyTotal: 0,
      limits: defaultCurrencyLimits(),
      paymentMethod,
    };
  }

  const typeKey = toCustomerTypeKey(input.customerType);
  const methodLimits =
    risk.methodTransactionLimits?.[paymentMethod] ?? risk.transactionLimits;
  const limits = methodLimits[typeKey][input.currency];
  const { dailyTotal, monthlyTotal } = await getCustomerFiatTotals(
    input.customerId,
    input.currency,
    new Date(),
    paymentMethod,
  );

  const dailyTicketCount = await countDailyTicketsForCustomer(input.customerId);

  if (
    risk.maxDailyTicketsPerCustomer > 0 &&
    dailyTicketCount >= risk.maxDailyTicketsPerCustomer
  ) {
    throw new AppError(
      400,
      `일일 최대 거래 건수(${risk.maxDailyTicketsPerCustomer}건)를 초과했습니다`,
      'DAILY_TICKET_LIMIT',
    );
  }

  const check = checkTransactionAmount(
    limits,
    input.fiatAmount,
    dailyTotal,
    monthlyTotal,
  );

  if (!check.allowed) {
    if (check.minAmount > 0 && input.fiatAmount + 1e-9 < check.minAmount) {
      throw new AppError(
        400,
        `최소 거래 금액은 ${check.minAmount.toLocaleString()} ${input.currency} 입니다`,
        'TRANSACTION_MIN',
      );
    }
    if (check.maxAmount != null && input.fiatAmount > check.maxAmount) {
      const isDaily =
        limits.dailyMax > 0 && dailyTotal + input.fiatAmount > limits.dailyMax;
      const isMonthly =
        limits.monthlyMax > 0 && monthlyTotal + input.fiatAmount > limits.monthlyMax;
      const reason = isMonthly
        ? '월간'
        : isDaily
          ? '일일'
          : '1회';
      throw new AppError(
        400,
        `${reason} 거래 한도를 초과했습니다 (최대 ${check.maxAmount.toLocaleString()} ${input.currency})`,
        'TRANSACTION_MAX',
      );
    }
    throw new AppError(400, '거래 금액이 한도 정책에 맞지 않습니다', 'TRANSACTION_LIMIT');
  }

  return { ...check, paymentMethod };
}

export async function getCustomerTransactionLimitSummary(
  customerId: string,
  customerType: CustomerType,
  currency: SymbolFeeCurrency,
  paymentMethod?: LimitPaymentMethod | string | null,
) {
  const risk = await loadRiskConfig();
  const method = resolveLimitPaymentMethod(paymentMethod);
  const typeKey = toCustomerTypeKey(customerType);
  const methodLimits =
    risk.methodTransactionLimits?.[method] ?? risk.transactionLimits;
  const limits = methodLimits[typeKey][currency];
  const totals = await getCustomerFiatTotals(customerId, currency, new Date(), method);
  const check = checkTransactionAmount(limits, 0, totals.dailyTotal, totals.monthlyTotal);
  const dailyTicketCount = await countDailyTicketsForCustomer(customerId);
  return {
    enabled: risk.riskEnabled,
    limits,
    paymentMethod: method,
    dailyTotal: totals.dailyTotal,
    monthlyTotal: totals.monthlyTotal,
    remainingDaily:
      limits.dailyMax > 0
        ? Math.max(0, limits.dailyMax - totals.dailyTotal)
        : null,
    remainingMonthly:
      limits.monthlyMax > 0
        ? Math.max(0, limits.monthlyMax - totals.monthlyTotal)
        : null,
    effectiveMin: check.minAmount,
    effectiveMax: check.maxAmount,
    dailyTicketCount,
    maxDailyTicketsPerCustomer: risk.maxDailyTicketsPerCustomer,
  };
}
