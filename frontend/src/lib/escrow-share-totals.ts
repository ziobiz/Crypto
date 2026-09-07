import type { HqOrgLevel, HqOrgShareByType, HqOrgSharePolicy, CustomerFeeShare } from '@/lib/api';
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

export type OperatingShareCheck = {
  ok: boolean;
  expectedPct: number;
  actualPct: number;
  expectedUsdt: number;
  actualUsdt: number;
  exceeds: boolean;
};

export function escrowShareTotalsMatch(
  share: Pick<HqOrgSharePolicy, 'escrowFeePercent' | 'escrowPerTicketUsdt' | 'TRADE_ESCROW'>,
): OperatingShareCheck {
  const expectedPct = roundShareTotal(Number(share.escrowFeePercent) || 0);
  const expectedUsdt = roundShareTotal(Number(share.escrowPerTicketUsdt) || 0);
  const actual = sumOrgShareTable(share.TRADE_ESCROW);
  return {
    ok: actual.poolPercent === expectedPct && actual.perTicketUsdt === expectedUsdt,
    expectedPct,
    actualPct: actual.poolPercent,
    expectedUsdt,
    actualUsdt: actual.perTicketUsdt,
    exceeds: actual.poolPercent > expectedPct + 1e-9 || actual.perTicketUsdt > expectedUsdt + 1e-9,
  };
}

export function usdtShareTotalsMatch(
  share: Pick<HqOrgSharePolicy, 'usdtOperatingFeePercent' | 'usdtOperatingFeeUsdt' | 'USDT_PURCHASE'>,
): OperatingShareCheck {
  const expectedPct = roundShareTotal(Number(share.usdtOperatingFeePercent) || 0);
  const expectedUsdt = roundShareTotal(Number(share.usdtOperatingFeeUsdt) || 0);
  const actual = sumOrgShareTable(share.USDT_PURCHASE);
  return {
    ok: actual.poolPercent === expectedPct && actual.perTicketUsdt === expectedUsdt,
    expectedPct,
    actualPct: actual.poolPercent,
    expectedUsdt,
    actualUsdt: actual.perTicketUsdt,
    exceeds: actual.poolPercent > expectedPct + 1e-9 || actual.perTicketUsdt > expectedUsdt + 1e-9,
  };
}

export function operatingSharePolicyMatch(share: CustomerFeeShare | HqOrgSharePolicy): {
  usdt: OperatingShareCheck;
  escrow: OperatingShareCheck;
  ok: boolean;
} {
  const usdt = usdtShareTotalsMatch(share);
  const escrow = escrowShareTotalsMatch(share);
  return { usdt, escrow, ok: usdt.ok && escrow.ok };
}

export function parseEscrowShareMismatch(message: string): OperatingShareCheck | null {
  if (!message.startsWith('ESCROW_SHARE_MISMATCH:') && !message.startsWith('USDT_SHARE_MISMATCH:')) {
    return null;
  }
  const parts = message.split(':');
  if (parts.length < 5) {
    return { ok: false, expectedPct: 0, actualPct: 0, expectedUsdt: 0, actualUsdt: 0, exceeds: true };
  }
  const expectedPct = Number(parts[1]) || 0;
  const actualPct = Number(parts[2]) || 0;
  const expectedUsdt = Number(parts[3]) || 0;
  const actualUsdt = Number(parts[4]) || 0;
  return {
    ok: false,
    expectedPct,
    actualPct,
    expectedUsdt,
    actualUsdt,
    exceeds: actualPct > expectedPct + 1e-9 || actualUsdt > expectedUsdt + 1e-9,
  };
}

export function formatEscrowShareMismatch(
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
  check: OperatingShareCheck,
): string {
  return t('hq.commission.escrowShareMismatch', {
    expectedPct: check.expectedPct,
    actualPct: check.actualPct,
    expectedUsdt: check.expectedUsdt,
    actualUsdt: check.actualUsdt,
  });
}

export function formatUsdtShareMismatch(
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
  check: OperatingShareCheck,
): string {
  return t('hq.commission.usdtShareMismatch', {
    expectedPct: check.expectedPct,
    actualPct: check.actualPct,
    expectedUsdt: check.expectedUsdt,
    actualUsdt: check.actualUsdt,
  });
}
