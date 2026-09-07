import { CurrencyCode, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { fetchUsdtFiatRate, type FiatCurrency } from './exchange-rate.service';

function n(value: unknown, digits: number): number {
  const x = Number(value);
  if (!Number.isFinite(x)) return 0;
  return Number(x.toFixed(digits));
}

const FIATS: FiatCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'HKD', 'USD'];

export function computeCostBreakdown(input: {
  depositFiat: number;
  receivedUsdt: number;
  exchangeRate: number;
  correctionUsdt: number;
  gasFeeUsdt: number;
}) {
  if (input.depositFiat <= 0) throw new AppError(400, 'Deposit amount is required', 'VALIDATION');
  if (input.receivedUsdt <= 0) throw new AppError(400, 'Received USDT is required', 'VALIDATION');
  if (input.exchangeRate <= 0) throw new AppError(400, 'Invalid exchange rate', 'INVALID_RATE');
  const grossUsdt = n(input.depositFiat / input.exchangeRate, 8);
  const feeUsdt = n(grossUsdt - input.receivedUsdt - n(input.gasFeeUsdt, 8) + n(input.correctionUsdt, 8), 8);
  return {
    grossUsdt,
    feeUsdt,
    correctionUsdt: n(input.correctionUsdt, 8),
    gasFeeUsdt: n(input.gasFeeUsdt, 8),
    receivedUsdt: n(input.receivedUsdt, 8),
    depositFiat: n(input.depositFiat, 2),
    exchangeRate: n(input.exchangeRate, 8),
  };
}

function serialize(row: {
  id: string;
  currency: CurrencyCode;
  depositFiat: Prisma.Decimal;
  receivedUsdt: Prisma.Decimal;
  exchangeRate: Prisma.Decimal;
  exchangeRateAt: Date;
  exchangeSource: string;
  correctionUsdt: Prisma.Decimal;
  gasFeeUsdt: Prisma.Decimal;
  feeUsdt: Prisma.Decimal;
  grossUsdt: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
  createdBy: { id: string; name: string; email: string };
}) {
  return {
    id: row.id,
    currency: row.currency,
    depositFiat: Number(row.depositFiat),
    receivedUsdt: Number(row.receivedUsdt),
    exchangeRate: Number(row.exchangeRate),
    exchangeRateAt: row.exchangeRateAt.toISOString(),
    exchangeSource: row.exchangeSource,
    correctionUsdt: Number(row.correctionUsdt),
    gasFeeUsdt: Number(row.gasFeeUsdt),
    feeUsdt: Number(row.feeUsdt),
    grossUsdt: Number(row.grossUsdt),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    createdByName: row.createdBy.name,
    createdByEmail: row.createdBy.email,
  };
}

export async function previewCostAnalysis(input: {
  currency: string;
  depositFiat: number;
  receivedUsdt: number;
  correctionUsdt: number;
  gasFeeUsdt: number;
}) {
  const currency = FIATS.includes(input.currency as FiatCurrency) ? (input.currency as FiatCurrency) : 'JPY';
  const rate = await fetchUsdtFiatRate(currency);
  const calc = computeCostBreakdown({
    depositFiat: input.depositFiat,
    receivedUsdt: input.receivedUsdt,
    exchangeRate: rate.rate,
    correctionUsdt: input.correctionUsdt,
    gasFeeUsdt: input.gasFeeUsdt,
  });
  return {
    ...calc,
    currency,
    exchangeRateAt: rate.fetchedAt.toISOString(),
    exchangeSource: rate.source,
  };
}

export async function createCostAnalysis(
  user: AuthUser,
  input: {
    currency: string;
    depositFiat: number;
    receivedUsdt: number;
    correctionUsdt: number;
    gasFeeUsdt: number;
    note?: string;
  },
) {
  const preview = await previewCostAnalysis(input);
  const currency = preview.currency as CurrencyCode;
  const row = await prisma.costAnalysis.create({
    data: {
      currency,
      depositFiat: preview.depositFiat,
      receivedUsdt: preview.receivedUsdt,
      exchangeRate: preview.exchangeRate,
      exchangeRateAt: new Date(preview.exchangeRateAt),
      exchangeSource: preview.exchangeSource,
      correctionUsdt: preview.correctionUsdt,
      gasFeeUsdt: preview.gasFeeUsdt,
      feeUsdt: preview.feeUsdt,
      grossUsdt: preview.grossUsdt,
      note: input.note?.trim() || null,
      createdById: user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  return serialize(row);
}

export async function listCostAnalyses() {
  const rows = await prisma.costAnalysis.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  return rows.map(serialize);
}
