import {
  applyCurrencyAmount,
  DEFAULT_CURRENCY_AMOUNT_DISPLAY,
  resolveCurrencyAmountRule,
  type HqCurrencyAmountDisplayPolicy,
} from './currency-amount';

let displayPolicy: HqCurrencyAmountDisplayPolicy = DEFAULT_CURRENCY_AMOUNT_DISPLAY;

export function setCurrencyAmountDisplayPolicy(policy: HqCurrencyAmountDisplayPolicy | null | undefined) {
  displayPolicy = policy ?? DEFAULT_CURRENCY_AMOUNT_DISPLAY;
}

export function getCurrencyAmountDisplayPolicy(): HqCurrencyAmountDisplayPolicy {
  return displayPolicy;
}

export function formatCurrency(
  amount: number,
  currency = 'USDT',
  policy: HqCurrencyAmountDisplayPolicy = displayPolicy,
) {
  if (!Number.isFinite(amount)) return `— ${currency}`;
  if (currency === 'USDT') {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} USDT`;
  }
  const rounded = applyCurrencyAmount(amount, currency, policy);
  const rule = resolveCurrencyAmountRule(policy, currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: rule.decimals,
      maximumFractionDigits: rule.decimals,
    }).format(rounded);
  } catch {
    return `${rounded.toLocaleString(undefined, {
      minimumFractionDigits: rule.decimals,
      maximumFractionDigits: rule.decimals,
    })} ${currency}`;
  }
}

/** 입력 필드용 천 단위 콤마 */
export function formatAmountInput(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString('en-US');
}

/** 콤마 포함 문자열 → 숫자 */
export function parseAmountInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/** 소수 허용 (USDT 등) */
export function parseDecimalAmountInput(value: string): number {
  const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!cleaned || cleaned === '.') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function dateLocaleTag(): string {
  if (typeof document === 'undefined') return 'ko-KR';
  const lang = document.documentElement.lang || 'ko';
  const map: Record<string, string> = {
    ko: 'ko-KR',
    ja: 'ja-JP',
    zh: 'zh-CN',
    th: 'th-TH',
    en: 'en-US',
  };
  return map[lang] ?? 'ko-KR';
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(dateLocaleTag(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
