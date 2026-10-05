import type { ManualLocale } from './version';

/** 5-locale string helper for manuals (KR / US / JP / CH / TH). */
export function L(
  kr: string,
  us: string,
  jp: string,
  ch = us,
  th = us,
): Record<ManualLocale, string> {
  return { KR: kr, US: us, JP: jp, CH: ch, TH: th };
}
