import { OrgType, Prisma, UserRole, UsdtPurchaseStatus } from '@prisma/client';
import type { AuthUser } from '../types/auth';
import { prisma } from '../lib/prisma';
import { CHART_FIAT_CURRENCIES, type ChartFiatCurrency } from './exchange-market-stats.service';
import {
  ensureMarketSnapshots,
  getLatestMarketSnapshots,
  getRateSeries,
} from './market-snapshot.service';

export type ChartRange = '7d' | '30d' | '12m';

const FLOW_STATUSES: UsdtPurchaseStatus[] = [
  UsdtPurchaseStatus.APPLICATION_COMPLETED,
  UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
  UsdtPurchaseStatus.ADMIN_REVIEWING,
  UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
  UsdtPurchaseStatus.COMPLETED,
  UsdtPurchaseStatus.CANCELLED,
];

const ORG_BREAKDOWN_TYPES = new Set<OrgType>([
  OrgType.HEAD_OFFICE,
  OrgType.MASTER_DISTRIBUTOR,
]);

function rangeToFrom(range: ChartRange): Date {
  const now = new Date();
  const from = new Date(now);
  if (range === '7d') {
    from.setDate(from.getDate() - 7);
    return from;
  }
  if (range === '30d') {
    from.setDate(from.getDate() - 30);
    return from;
  }
  from.setMonth(from.getMonth() - 12);
  return from;
}

function usdtScopeFilter(actor: AuthUser): Prisma.UsdtPurchaseDetailWhereInput {
  if (actor.role === UserRole.CUSTOMER) {
    return { ticket: { customer: { userId: actor.id } } };
  }
  if (actor.role === UserRole.SUPER_ADMIN) {
    return {};
  }
  if (actor.organizationPath) {
    return {
      ticket: {
        customer: {
          recruitingOrg: { path: { startsWith: actor.organizationPath } },
        },
      },
    };
  }
  return { ticketId: { in: [] } };
}

function canShowOurPerformance(actor: AuthUser): boolean {
  if (actor.role === UserRole.CUSTOMER) return false;
  return actor.role === UserRole.SUPER_ADMIN || Boolean(actor.organizationPath);
}

function canShowOrgBreakdown(actor: AuthUser): boolean {
  if (actor.role === UserRole.SUPER_ADMIN) return true;
  if (actor.role !== UserRole.ORG_STAFF || !actor.organizationType) return false;
  return ORG_BREAKDOWN_TYPES.has(actor.organizationType as OrgType);
}

function bucketKey(date: Date, range: ChartRange): string {
  if (range === '12m') return date.toISOString().slice(0, 7);
  return date.toISOString().slice(0, 10);
}

export async function getDashboardCharts(actor: AuthUser, range: ChartRange = '30d') {
  await ensureMarketSnapshots();
  const from = rangeToFrom(range);
  const scope = usdtScopeFilter(actor);

  const [stageRows, purchases] = await Promise.all([
    prisma.usdtPurchaseDetail.groupBy({
      by: ['status'],
      where: scope,
      _count: { _all: true },
    }),
    prisma.usdtPurchaseDetail.findMany({
      where: {
        ...scope,
        createdAt: { gte: from },
        status: { not: UsdtPurchaseStatus.CANCELLED },
      },
      select: {
        fiatAmount: true,
        fiatCurrency: true,
        expectedUsdtAmount: true,
        actualUsdtAmount: true,
        createdAt: true,
        ticket: {
          select: {
            customer: {
              select: {
                recruitingOrg: { select: { id: true, name: true, type: true, path: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const stageCounts = new Map<string, number>();
  for (const status of FLOW_STATUSES) {
    stageCounts.set(status, 0);
  }
  for (const row of stageRows) {
    stageCounts.set(row.status, row._count._all);
  }

  const timelineBuckets = new Map<
    string,
    { count: number; fiatAmount: number; usdtAmount: number }
  >();
  const currencyTotals = new Map<
    ChartFiatCurrency,
    { count: number; fiatAmount: number; usdtAmount: number }
  >();
  const orgTotals = new Map<
    string,
    { orgId: string; orgName: string; orgType: string; count: number; fiatAmount: number; usdtAmount: number }
  >();

  for (const p of purchases) {
    const key = bucketKey(p.createdAt, range);
    const bucket = timelineBuckets.get(key) ?? { count: 0, fiatAmount: 0, usdtAmount: 0 };
    const usdt = Number(p.actualUsdtAmount ?? p.expectedUsdtAmount);
    const fiat = Number(p.fiatAmount);
    bucket.count += 1;
    bucket.fiatAmount += fiat;
    bucket.usdtAmount += usdt;
    timelineBuckets.set(key, bucket);

    const cur = p.fiatCurrency as ChartFiatCurrency;
    if (CHART_FIAT_CURRENCIES.includes(cur)) {
      const ct = currencyTotals.get(cur) ?? { count: 0, fiatAmount: 0, usdtAmount: 0 };
      ct.count += 1;
      ct.fiatAmount += fiat;
      ct.usdtAmount += usdt;
      currencyTotals.set(cur, ct);
    }

    const org = p.ticket.customer.recruitingOrg;
    if (org && canShowOrgBreakdown(actor)) {
      const ot = orgTotals.get(org.id) ?? {
        orgId: org.id,
        orgName: org.name,
        orgType: org.type,
        count: 0,
        fiatAmount: 0,
        usdtAmount: 0,
      };
      ot.count += 1;
      ot.fiatAmount += fiat;
      ot.usdtAmount += usdt;
      orgTotals.set(org.id, ot);
    }
  }

  const marketRates: Record<
    ChartFiatCurrency,
    { current: Awaited<ReturnType<typeof getLatestMarketSnapshots>>[ChartFiatCurrency]; series: Array<{ date: string; rate: number }> }
  > = {} as never;

  const latest = await getLatestMarketSnapshots();
  for (const currency of CHART_FIAT_CURRENCIES) {
    marketRates[currency] = {
      current: latest[currency],
      series: await getRateSeries(currency, from),
    };
  }

  const showOur = canShowOurPerformance(actor);
  const totalCount = purchases.length;
  const totalFiat = purchases.reduce((s, p) => s + Number(p.fiatAmount), 0);
  const totalUsdt = purchases.reduce(
    (s, p) => s + Number(p.actualUsdtAmount ?? p.expectedUsdtAmount),
    0,
  );

  return {
    range,
    scope: actor.role === UserRole.CUSTOMER ? 'self' : actor.role === UserRole.SUPER_ADMIN ? 'all' : 'org_subtree',
    usdtFlow: {
      stages: FLOW_STATUSES.map((status) => ({
        status,
        count: stageCounts.get(status) ?? 0,
      })),
      timeline: [...timelineBuckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
    },
    marketRates,
    exchangeStats: latest,
    ourPerformance: showOur
      ? {
          showOrgBreakdown: canShowOrgBreakdown(actor),
          totals: { count: totalCount, fiatAmount: totalFiat, usdtAmount: totalUsdt },
          byCurrency: CHART_FIAT_CURRENCIES.map((currency) => ({
            currency,
            ...(currencyTotals.get(currency) ?? { count: 0, fiatAmount: 0, usdtAmount: 0 }),
          })),
          byOrg: canShowOrgBreakdown(actor)
            ? [...orgTotals.values()].sort((a, b) => b.fiatAmount - a.fiatAmount)
            : undefined,
          timeline: [...timelineBuckets.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({ date, ...v })),
        }
      : null,
  };
}
