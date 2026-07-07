import { CustomerType, EscrowTradeTier } from '@prisma/client';

export function classifyEscrowTier(
  buyerType: CustomerType,
  sellerType: CustomerType,
): { tier: EscrowTradeTier; requiresReview: boolean } {
  if (buyerType === CustomerType.CORPORATE && sellerType === CustomerType.CORPORATE) {
    return { tier: EscrowTradeTier.PREMIUM, requiresReview: false };
  }
  if (sellerType === CustomerType.CORPORATE && buyerType === CustomerType.INDIVIDUAL) {
    return { tier: EscrowTradeTier.STANDARD, requiresReview: false };
  }
  return { tier: EscrowTradeTier.CAUTION, requiresReview: true };
}

/** 당일 23:59:59 KST */
export function acceptanceDeadlineKst(from: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(from);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  const d = Number(parts.find((p) => p.type === 'day')!.value);
  return new Date(Date.UTC(y, m - 1, d, 14, 59, 59, 999));
}

/** 익일 13:00 KST (일괄 USDT 송금) */
export function nextBatchPayoutTimeKst(from: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(from);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  const d = Number(parts.find((p) => p.type === 'day')!.value);
  return new Date(Date.UTC(y, m - 1, d + 1, 4, 0, 0, 0));
}

export function schedulePayoutAt(tier: EscrowTradeTier, approvedAt: Date = new Date()): Date {
  if (tier === EscrowTradeTier.PREMIUM) {
    return approvedAt;
  }
  return nextBatchPayoutTimeKst(approvedAt);
}

export function formatPayoutScheduleKst(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
