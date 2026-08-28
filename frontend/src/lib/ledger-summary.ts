import type { EscrowTicket, UsdtTicket } from '@/lib/api';

/** PG-style list aggregate (string parts inside brackets) */
export type ListAggregateSummary = {
  count: number;
  totalTrade: string[];
  failed: string[];
  fees: string[];
  settlement: string[];
};

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function pushAmt(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function mapToParts(map: Map<string, number>, withCount?: Map<string, number>): string[] {
  return [...map.entries()]
    .filter(([, v]) => v !== 0)
    .map(([cur, total]) => {
      if (withCount) {
        const c = withCount.get(cur) ?? 0;
        return `${cur} [${c}] ${fmtNum(total)}`;
      }
      return `${cur} ${fmtNum(total)}`;
    });
}

function usdtFeeUsdt(row: UsdtTicket): number {
  return (
    (row.gasFeeSnapshot ?? 0) +
    (row.transferFeeSnapshot ?? 0) +
    (row.otherFeeSnapshot ?? 0) +
    (row.kimchiPremiumFeeUsdt ?? 0) +
    (row.platformFeeSnapshot ?? 0)
  );
}

const USDT_FAIL = new Set(['CANCELLED']);
const ESCROW_FAIL = new Set(['CANCELLED', 'VOIDED']);

export function summarizeUsdtTickets(rows: UsdtTicket[]): ListAggregateSummary {
  const total = new Map<string, number>();
  const failAmt = new Map<string, number>();
  const failCnt = new Map<string, number>();
  const feeFiat = new Map<string, number>();
  const feeUsdt = new Map<string, number>();
  const doneFiat = new Map<string, number>();

  for (const row of rows) {
    const cur = row.fiatCurrency || '—';
    pushAmt(total, cur, row.fiatAmount ?? 0);
    if (USDT_FAIL.has(row.status)) {
      pushAmt(failAmt, cur, row.fiatAmount ?? 0);
      failCnt.set(cur, (failCnt.get(cur) ?? 0) + 1);
    }
    if (row.cardFeeFiatSnapshot) pushAmt(feeFiat, cur, row.cardFeeFiatSnapshot);
    const fu = usdtFeeUsdt(row);
    if (fu) pushAmt(feeUsdt, 'USDT', fu);
    if (row.status === 'COMPLETED') pushAmt(doneFiat, cur, row.fiatAmount ?? 0);
  }

  const settlement = new Map<string, number>();
  for (const [cur, v] of doneFiat) settlement.set(cur, v - (feeFiat.get(cur) ?? 0));
  for (const [cur, v] of feeFiat) {
    if (!settlement.has(cur) && !doneFiat.has(cur)) settlement.set(cur, -v);
  }
  const usdtFeeTotal = feeUsdt.get('USDT') ?? 0;
  if (usdtFeeTotal) settlement.set('USDT', (settlement.get('USDT') ?? 0) - usdtFeeTotal);

  const fees = [...mapToParts(feeFiat), ...mapToParts(feeUsdt)];
  return {
    count: rows.length,
    totalTrade: mapToParts(total),
    failed: mapToParts(failAmt, failCnt),
    fees: fees.length ? fees : [],
    settlement: mapToParts(settlement),
  };
}

export function summarizeEscrowTickets(rows: EscrowTicket[]): ListAggregateSummary {
  const total = new Map<string, number>();
  const failAmt = new Map<string, number>();
  const failCnt = new Map<string, number>();
  const fee = new Map<string, number>();
  const done = new Map<string, number>();

  for (const row of rows) {
    const cur = row.currency || '—';
    pushAmt(total, cur, row.amount ?? 0);
    if (ESCROW_FAIL.has(row.status)) {
      pushAmt(failAmt, cur, row.amount ?? 0);
      failCnt.set(cur, (failCnt.get(cur) ?? 0) + 1);
    }
    if (row.totalCommissionPool) pushAmt(fee, cur, row.totalCommissionPool);
    if (row.status === 'ESCROW_COMPLETED') pushAmt(done, cur, row.amount ?? 0);
  }

  const settlement = new Map<string, number>();
  for (const [cur, v] of done) settlement.set(cur, v - (fee.get(cur) ?? 0));
  for (const [cur, v] of fee) {
    if (!settlement.has(cur) && !done.has(cur)) settlement.set(cur, -v);
  }

  return {
    count: rows.length,
    totalTrade: mapToParts(total),
    failed: mapToParts(failAmt, failCnt),
    fees: mapToParts(fee),
    settlement: mapToParts(settlement),
  };
}
