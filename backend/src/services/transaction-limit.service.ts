import { CustomerType, UsdtPurchaseStatus } from '@prisma/client';
import {
  SYMBOL_FEE_CURRENCIES,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type CustomerTypeLimitKey,
  type HqCommissionRiskConfig,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';
import { HQ_CONFIG_KEYS } from '../constants/hq-policy';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  defaultCurrencyLimits,
  normalizeTransactionLimits,
} from '../lib/transaction-limit-policy';
import { normalizeCommissionRisk } from './transaction-fee.service';

const ACTIVE_STATUSES: UsdtPurchaseStatus[] = [
  UsdtPurchaseStatus.APPLICATION_COMPLETED,
  UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
  UsdtPurchaseStatus.ADMIN_REVIEWING,
  UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
  UsdtPurchaseStatus.COMPLETED,
];

async function loadRiskConfig(): Promise<HqCommissionRiskConfig> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.commissionRisk },
  });
  return normalizeCommissionRisk((row?.value ?? {}) as Partial<HqCommissionRiskConfig>);
}

export function toCustomerTypeKey(customerType: CustomerType): CustomerTypeLimitKey {
  return customerType === CustomerType.CORPORATE ? 'CORPORATE' : 'INDIVIDUAL';
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function getCustomerFiatTotals(
  customerId: string,
  currency: SymbolFeeCurrency,
  now = new Date(),
): Promise<{ dailyTotal: number; monthlyTotal: number }> {
  const dayStart = startOfUtcDay(now);
  const monthStart = startOfUtcMonth(now);

  const rows = await prisma.usdtPurchaseDetail.findMany({
    where: {
      fiatCurrency: currency,
      status: { in: ACTIVE_STATUSES },
      ticket: { customerId },
      createdAt: { gte: monthStart },
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
};

export function checkTransactionAmount(
  limits: CurrencyTransactionLimits,
  amount: number,
  dailyTotal: number,
  monthlyTotal: number,
): TransactionLimitCheck {
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
    (minAmount <= 0 || amount >= minAmount) &&
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
  risk?: HqCommissionRiskConfig;
}): Promise<TransactionLimitCheck> {
  const risk = input.risk ?? (await loadRiskConfig());
  if (!risk.riskEnabled) {
    return {
      allowed: true,
      minAmount: 0,
      maxAmount: null,
      dailyTotal: 0,
      monthlyTotal: 0,
      limits: defaultCurrencyLimits(),
    };
  }

  const typeKey = toCustomerTypeKey(input.customerType);
  const limits = risk.transactionLimits[typeKey][input.currency];
  const { dailyTotal, monthlyTotal } = await getCustomerFiatTotals(
    input.customerId,
    input.currency,
  );

  const dailyTicketCount = await prisma.usdtPurchaseDetail.count({
    where: {
      status: { in: ACTIVE_STATUSES },
      ticket: { customerId: input.customerId },
      createdAt: { gte: startOfUtcDay() },
    },
  });

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
    if (check.minAmount > 0 && input.fiatAmount < check.minAmount) {
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

  return check;
}

export async function getCustomerTransactionLimitSummary(
  customerId: string,
  customerType: CustomerType,
  currency: SymbolFeeCurrency,
) {
  const risk = await loadRiskConfig();
  const typeKey = toCustomerTypeKey(customerType);
  const limits = risk.transactionLimits[typeKey][currency];
  const totals = await getCustomerFiatTotals(customerId, currency);
  const check = checkTransactionAmount(limits, 0, totals.dailyTotal, totals.monthlyTotal);
  return {
    enabled: risk.riskEnabled,
    limits,
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
  };
}
