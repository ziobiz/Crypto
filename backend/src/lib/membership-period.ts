/** 멤버십 기간: 1–30일 = 일 단위, 그 이상 = 개월(2–12, 1개월=30일) */

export const MEMBERSHIP_DAY_MIN = 1;
export const MEMBERSHIP_DAY_MAX = 30;
export const MEMBERSHIP_MONTH_MIN = 2;
export const MEMBERSHIP_MONTH_MAX = 12;
export const MEMBERSHIP_DAYS_PER_MONTH = 30;

export type MembershipPeriodMode = 'days' | 'months';

export function monthsToPeriodDays(months: number): number {
  const m = Math.max(
    MEMBERSHIP_MONTH_MIN,
    Math.min(MEMBERSHIP_MONTH_MAX, Math.floor(months)),
  );
  return m * MEMBERSHIP_DAYS_PER_MONTH;
}

export function periodDaysToMode(periodDays: number): {
  mode: MembershipPeriodMode;
  days: number;
  months: number;
} {
  const defaultDays = monthsToPeriodDays(MEMBERSHIP_MONTH_MAX);
  const d = Math.max(1, Math.floor(periodDays || defaultDays));
  if (d <= MEMBERSHIP_DAY_MAX) {
    return {
      mode: 'days',
      days: Math.min(MEMBERSHIP_DAY_MAX, Math.max(MEMBERSHIP_DAY_MIN, d)),
      months: MEMBERSHIP_MONTH_MAX,
    };
  }
  const months = Math.max(
    MEMBERSHIP_MONTH_MIN,
    Math.min(MEMBERSHIP_MONTH_MAX, Math.round(d / MEMBERSHIP_DAYS_PER_MONTH)),
  );
  return { mode: 'months', days: MEMBERSHIP_DAY_MAX, months };
}

export function normalizeMembershipPeriodDays(raw: unknown): number {
  const defaultDays = monthsToPeriodDays(MEMBERSHIP_MONTH_MAX);
  const d = Math.floor(Number(raw) || defaultDays);
  if (d <= MEMBERSHIP_DAY_MAX) {
    return Math.max(MEMBERSHIP_DAY_MIN, Math.min(MEMBERSHIP_DAY_MAX, d));
  }
  const months = Math.max(
    MEMBERSHIP_MONTH_MIN,
    Math.min(MEMBERSHIP_MONTH_MAX, Math.round(d / MEMBERSHIP_DAYS_PER_MONTH)),
  );
  return monthsToPeriodDays(months);
}
