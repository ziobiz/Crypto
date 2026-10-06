import type { Locale } from '@/i18n/locales';

const SUBJECT_BY_LOCALE: Record<Locale, string> = {
  KR: '거래명세',
  US: 'Trade Receipt',
  JP: '取引明細',
  CH: '交易明细',
  TH: 'ใบเสร็จธุรกรรม',
};

/** List/detail subject in UI language (body email remains multilingual). */
export function tradeReceiptSubjectForLocale(ticketNo: string, locale: Locale): string {
  return `[Crypto Workflow] ${SUBJECT_BY_LOCALE[locale] || SUBJECT_BY_LOCALE.US} — ${ticketNo}`;
}

/** Prefer localized subject; fall back to stored subject for unknown rows. */
export function displayTradeReceiptSubject(
  stored: string | null | undefined,
  ticketNo: string,
  locale: Locale,
): string {
  return tradeReceiptSubjectForLocale(ticketNo, locale) || stored || '—';
}
