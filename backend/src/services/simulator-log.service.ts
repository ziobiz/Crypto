import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { HQ_CONFIG_KEYS, type HqPlatformConfig } from '../constants/hq-policy';
import type { AuthUser } from '../types/auth';

export type SimulatorMode = 'fiat' | 'target';

export type SimulatorRunInput = {
  mode: SimulatorMode;
  currency: string;
  network: string;
  inputAmount: number;
  requiredFiat: number;
  netUsdt: number;
  totalFeeUsdt: number;
  exchangeRate: number;
};

const PAGE_SIZES = [100, 300, 5000, 10000] as const;
const DEBOUNCE_MS = 8000;

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function serializeRun(row: {
  id: string;
  mode: string;
  currency: string;
  network: string;
  inputAmount: unknown;
  requiredFiat: unknown;
  netUsdt: unknown;
  totalFeeUsdt: unknown;
  exchangeRate: unknown;
  createdAt: Date;
  user?: { id: string; name: string; email: string } | null;
}) {
  return {
    id: row.id,
    mode: row.mode,
    currency: row.currency,
    network: row.network,
    inputAmount: n(row.inputAmount),
    requiredFiat: n(row.requiredFiat),
    netUsdt: n(row.netUsdt),
    totalFeeUsdt: n(row.totalFeeUsdt),
    exchangeRate: n(row.exchangeRate),
    createdAt: row.createdAt.toISOString(),
    customerName: row.user?.name ?? '',
    customerEmail: row.user?.email ?? '',
    userId: row.user?.id,
  };
}

export async function getSimulatorRetentionMonths(): Promise<number> {
  const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.platform } });
  const raw = (row?.value ?? {}) as Partial<HqPlatformConfig>;
  const months = Math.floor(Number(raw.simulatorRetentionMonths ?? 3));
  if (!Number.isFinite(months) || months < 1) return 3;
  return Math.min(36, months);
}

export async function purgeExpiredSimulatorRuns(): Promise<number> {
  const months = await getSimulatorRetentionMonths();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const result = await prisma.simulatorRun.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return result.count;
}

function isHqAccount(user: AuthUser): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.organizationType === 'HEAD_OFFICE';
}

export async function logSimulatorRun(user: AuthUser, input: SimulatorRunInput) {
  if (user.role !== UserRole.CUSTOMER) return null;
  const recent = await prisma.simulatorRun.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  const payload = {
    mode: input.mode,
    currency: input.currency,
    network: input.network,
    inputAmount: n(input.inputAmount),
    requiredFiat: n(input.requiredFiat),
    netUsdt: n(input.netUsdt),
    totalFeeUsdt: n(input.totalFeeUsdt),
    exchangeRate: n(input.exchangeRate),
  };
  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < DEBOUNCE_MS &&
    recent.mode === payload.mode &&
    recent.currency === payload.currency &&
    recent.network === payload.network
  ) {
    const updated = await prisma.simulatorRun.update({
      where: { id: recent.id },
      data: payload,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return serializeRun(updated);
  }
  const created = await prisma.simulatorRun.create({
    data: { userId: user.id, ...payload },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return serializeRun(created);
}

export async function listMyRecentRuns(user: AuthUser, limit = 2) {
  if (isHqAccount(user)) return [];
  const rows = await prisma.simulatorRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: Math.min(3, Math.max(1, limit)),
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return rows.map(serializeRun);
}

export async function listHqSimulatorRuns(user: AuthUser, page: number, pageSize: number | 'all') {
  if (!isHqAccount(user)) {
    throw new AppError(403, 'HQ only', 'FORBIDDEN');
  }
  const take = pageSize === 'all' ? 20000 : PAGE_SIZES.includes(pageSize as (typeof PAGE_SIZES)[number]) ? pageSize : 100;
  const skip = pageSize === 'all' ? 0 : Math.max(0, (Math.max(1, page) - 1) * take);
  const [total, rows] = await Promise.all([
    prisma.simulatorRun.count(),
    prisma.simulatorRun.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  return {
    total,
    page: pageSize === 'all' ? 1 : Math.max(1, page),
    pageSize: pageSize === 'all' ? 'all' : take,
    items: rows.map(serializeRun),
    retentionMonths: await getSimulatorRetentionMonths(),
  };
}

export type AnalyticsRange = 'day' | 'week' | 'month';

export async function getSimulatorAnalytics(user: AuthUser, range: AnalyticsRange) {
  if (!isHqAccount(user)) {
    throw new AppError(403, 'HQ only', 'FORBIDDEN');
  }
  const now = new Date();
  const from = new Date(now);
  if (range === 'day') from.setDate(from.getDate() - 1);
  else if (range === 'week') from.setDate(from.getDate() - 7);
  else from.setMonth(from.getMonth() - 1);

  const rows = await prisma.simulatorRun.findMany({
    where: { createdAt: { gte: from } },
    select: {
      mode: true,
      currency: true,
      network: true,
      requiredFiat: true,
      netUsdt: true,
      createdAt: true,
    },
  });

  const byHour: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  const byCurrency: Record<string, number> = {};
  const byNetwork: Record<string, number> = {};
  const byMode: Record<string, number> = {};
  const buckets = { lt1k: 0, k1to10: 0, k10to100: 0, over100k: 0 };
  let netSum = 0;

  for (const r of rows) {
    const h = String(r.createdAt.getHours()).padStart(2, '0');
    byHour[h] = (byHour[h] ?? 0) + 1;
    const d = r.createdAt.toISOString().slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
    byCurrency[r.currency] = (byCurrency[r.currency] ?? 0) + 1;
    byNetwork[r.network] = (byNetwork[r.network] ?? 0) + 1;
    byMode[r.mode] = (byMode[r.mode] ?? 0) + 1;
    const fiat = n(r.requiredFiat);
    if (fiat < 1000) buckets.lt1k += 1;
    else if (fiat < 10000) buckets.k1to10 += 1;
    else if (fiat < 100000) buckets.k10to100 += 1;
    else buckets.over100k += 1;
    netSum += n(r.netUsdt);
  }

  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topCurrency = Object.entries(byCurrency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topNetwork = Object.entries(byNetwork).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    range,
    total: rows.length,
    avgNetUsdt: rows.length ? Number((netSum / rows.length).toFixed(4)) : 0,
    peakHour,
    topCurrency,
    topNetwork,
    byHour: Object.keys(byHour)
      .sort()
      .map((hour) => ({ hour, count: byHour[hour] })),
    byDay: Object.keys(byDay)
      .sort()
      .map((date) => ({ date, count: byDay[date] })),
    byCurrency: Object.entries(byCurrency).map(([currency, count]) => ({ currency, count })),
    byNetwork: Object.entries(byNetwork).map(([network, count]) => ({ network, count })),
    byMode: Object.entries(byMode).map(([mode, count]) => ({ mode, count })),
    amountBuckets: buckets,
    retentionMonths: await getSimulatorRetentionMonths(),
  };
}
