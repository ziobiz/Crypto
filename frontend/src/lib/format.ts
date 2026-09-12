export type CurrencyAmountMode = 'ROUND' | 'CEIL' | 'FLOOR';

export type HqCurrencyAmountRule = {
  decimals: number;
  mode: CurrencyAmountMode;
};

export type HqCurrencyAmountDisplayPolicy = {
  default: HqCurrencyAmountRule;
  KRW?: HqCurrencyAmountRule;
  JPY?: HqCurrencyAmountRule;
  THB?: HqCurrencyAmountRule;
  CNY?: HqCurrencyAmountRule;
  HKD?: HqCurrencyAmountRule;
  USD?: HqCurrencyAmountRule;
};

const DEFAULT_POLICY: HqCurrencyAmountDisplayPolicy = {
  default: { decimals: 2, mode: 'ROUND' },
  KRW: { decimals: 0, mode: 'FLOOR' },
  JPY: { decimals: 0, mode: 'FLOOR' },
  THB: { decimals: 2, mode: 'ROUND' },
  CNY: { decimals: 2, mode: 'ROUND' },
  HKD: { decimals: 2, mode: 'ROUND' },
  USD: { decimals: 2, mode: 'ROUND' },
};

let cachedPolicy: HqCurrencyAmountDisplayPolicy = DEFAULT_POLICY;

function mergeRule(src?: HqCurrencyAmountRule, fallback?: HqCurrencyAmountRule): HqCurrencyAmountRule {
  return {
    decimals: Math.max(0, Math.min(8, Number(src?.decimals ?? fallback?.decimals ?? 0) || 0)),
    mode: src?.mode === 'CEIL' || src?.mode === 'FLOOR' || src?.mode === 'ROUND' ? src.mode : (fallback?.mode ?? 'ROUND'),
  };
}

export function normalizeCurrencyAmountDisplayPolicy(
  raw: Partial<HqCurrencyAmountDisplayPolicy> | null | undefined,
): HqCurrencyAmountDisplayPolicy {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_POLICY };
  return {
    default: mergeRule(raw.default, DEFAULT_POLICY.default),
    KRW: mergeRule(raw.KRW, DEFAULT_POLICY.KRW),
    JPY: mergeRule(raw.JPY, DEFAULT_POLICY.JPY),
    THB: mergeRule(raw.THB, DEFAULT_POLICY.THB),
    CNY: mergeRule(raw.CNY, DEFAULT_POLICY.CNY),
    HKD: mergeRule(raw.HKD, DEFAULT_POLICY.HKD),
    USD: mergeRule(raw.USD, DEFAULT_POLICY.USD),
  };
}

export function setCurrencyAmountDisplayPolicy(policy: unknown) {
  cachedPolicy = normalizeCurrencyAmountDisplayPolicy(
    policy as Partial<HqCurrencyAmountDisplayPolicy> | null | undefined,
  );
}

export function getCurrencyAmountDisplayPolicy(): HqCurrencyAmountDisplayPolicy {
  return cachedPolicy;
}

export function resolveCurrencyAmountRule(
  currency: string,
  policy: HqCurrencyAmountDisplayPolicy = cachedPolicy,
): HqCurrencyAmountRule {
  const key = currency.toUpperCase() as keyof HqCurrencyAmountDisplayPolicy;
  const rule = policy[key];
  if (rule && typeof rule === 'object' && 'decimals' in rule) return rule as HqCurrencyAmountRule;
  return policy.default;
}

/** 통화별 소수점·반올림 규칙으로 표시용 법정화폐 포맷 */
export function formatFiatAmount(
  amount: number,
  currency: string,
  policy: HqCurrencyAmountDisplayPolicy = cachedPolicy,
): string {
  if (!Number.isFinite(amount)) return '—';
  const rule = resolveCurrencyAmountRule(currency, policy);
  const decimals = rule.decimals;
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`;
}

export function formatCurrency(amount: number, currency = 'USDT') {
  if (currency === 'USDT') {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} USDT`;
  }
  return formatFiatAmount(amount, currency);
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
