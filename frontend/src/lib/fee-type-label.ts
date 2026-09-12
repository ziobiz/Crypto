import type { MessageKey } from '@/i18n/messages';

type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Fee type labels stored in DB (often Korean) → UI locale display. */
export function localizeFeeTypeLabel(
  code: string | null | undefined,
  name: string | null | undefined,
  t: TFn,
): string {
  const c = String(code || '').trim().toUpperCase();
  const n = String(name || '').trim();
  if (c === 'DEFAULT' || n === '기본 수수료' || n === '기본수수료') {
    return t('feeType.default');
  }
  if (c === 'MANUAL' || /^manual$/i.test(n) || n === '수동') {
    return t('customerFees.manual');
  }
  return n || (code ? String(code) : '') || '—';
}
