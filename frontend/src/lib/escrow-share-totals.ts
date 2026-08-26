import type { HqOrgLevel, HqOrgShareByType, HqOrgSharePolicy } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

const LEVELS: HqOrgLevel[] = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
];

export function roundShareTotal(n: number): number {
  return Number(n.toFixed(4));
}

export function sumOrgShareTable(byType: HqOrgShareByType): { poolPercent: number; perTicketUsdt: number } {
  let poolPercent = 0;
  let perTicketUsdt = 0;
  for (const level of LEVELS) {
    const slice = byType[level];
    poolPercent += Number(slice?.poolPercent) || 0;
    perTicketUsdt += Number(slice?.perTicketUsdt) || 0;
  }
  return { poolPercent: roundShareTotal(poolPercent), perTicketUsdt: roundShareTotal(perTicketUsdt) };
}

export function escrowShareTotalsMatch(share: Pick<HqOrgSharePolicy, 'escrowFeePercent' | 'escrowPerTicketUsdt' | 'TRADE_ESCROW'>) {
  const expectedPct = roundShareTotal(Number(share.escrowFeePercent) || 0);
  const expectedUsdt = roundShareTotal(Number(share.escrowPerTicketUsdt) || 0);
  const actual = sumOrgShareTable(share.TRADE_ESCROW);
  return {
    ok: actual.poolPercent === expectedPct && actual.perTicketUsdt === expectedUsdt,
    expectedPct,
    actualPct: actual.poolPercent,
    expectedUsdt,
    actualUsdt: actual.perTicketUsdt,
  };
}

export function parseEscrowShareMismatch(message: string): ReturnType<typeof escrowShareTotalsMatch> | null {
  if (!message.startsWith('ESCROW_SHARE_MISMATCH:')) return null;
  const parts = message.split(':');
  if (parts.length < 5) return { ok: false, expectedPct: 0, actualPct: 0, expectedUsdt: 0, actualUsdt: 0 };
  return {
    ok: false,
    expectedPct: Number(parts[1]) || 0,
    actualPct: Number(parts[2]) || 0,
    expectedUsdt: Number(parts[3]) || 0,
    actualUsdt: Number(parts[4]) || 0,
  };
}

export function formatEscrowShareMismatch(
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
  check: ReturnType<typeof escrowShareTotalsMatch>,
): string {
  return t('hq.commission.escrowShareMismatch', {
    expectedPct: check.expectedPct,
    actualPct: check.actualPct,
    expectedUsdt: check.expectedUsdt,
    actualUsdt: check.actualUsdt,
  });
}
