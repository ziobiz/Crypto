/** 법정화폐 표시·정산 금액의 소수 자릿수 및 절상/절사/반올림 */

export type CurrencyRoundingMode = 'CEIL' | 'FLOOR' | 'ROUND';

export type CurrencyAmountRule = {
  /** 소수 자릿수 (0 = 정수) */
  decimals: number;
  rounding: CurrencyRoundingMode;
};

export type HqCurrencyAmountDisplayPolicy = {
  /** 표에 없는 통화 */
  default: CurrencyAmountRule;
  byCurrency: Record<string, CurrencyAmountRule>;
};

export const CURRENCY_AMOUNT_DISPLAY_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'HKD', 'USD'] as const;
export type CurrencyAmountDisplayCurrency = (typeof CURRENCY_AMOUNT_DISPLAY_CURRENCIES)[number];

export function defaultCurrencyAmountDisplayPolicy(): HqCurrencyAmountDisplayPolicy {
  return {
    default: { decimals: 2, rounding: 'ROUND' },
    byCurrency: {
      KRW: { decimals: 0, rounding: 'CEIL' },
      JPY: { decimals: 0, rounding: 'CEIL' },
      THB: { decimals: 2, rounding: 'ROUND' },
      CNY: { decimals: 2, rounding: 'ROUND' },
      HKD: { decimals: 2, rounding: 'ROUND' },
      USD: { decimals: 2, rounding: 'ROUND' },
    },
  };
}

function clampDecimals(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 2;
  return Math.max(0, Math.min(8, Math.floor(v)));
}

function normalizeRounding(v: unknown): CurrencyRoundingMode {
  const s = String(v ?? '').toUpperCase();
  if (s === 'CEIL' || s === 'FLOOR' || s === 'ROUND') return s;
  // legacy / UI aliases
  if (s === 'UP' || s === '절상') return 'CEIL';
  if (s === 'DOWN' || s === 'FLOOR' || s === 'TRUNC' || s === '절사' || s === '버림') return 'FLOOR';
  if (s === 'HALF_UP' || s === '반올림') return 'ROUND';
  return 'ROUND';
}

function normalizeRule(raw: Partial<CurrencyAmountRule> | undefined, fallback: CurrencyAmountRule): CurrencyAmountRule {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  return {
    decimals: clampDecimals(raw.decimals ?? fallback.decimals),
    rounding: normalizeRounding(raw.rounding ?? fallback.rounding),
  };
}

export function normalizeCurrencyAmountDisplayPolicy(
  raw: Partial<HqCurrencyAmountDisplayPolicy> | null | undefined,
): HqCurrencyAmountDisplayPolicy {
  const base = defaultCurrencyAmountDisplayPolicy();
  const def = normalizeRule(raw?.default, base.default);
  const byCurrency: Record<string, CurrencyAmountRule> = { ...base.byCurrency };
  const incoming = raw?.byCurrency;
  if (incoming && typeof incoming === 'object') {
    for (const [code, rule] of Object.entries(incoming)) {
      const key = String(code).toUpperCase();
      if (!key) continue;
      byCurrency[key] = normalizeRule(rule, byCurrency[key] ?? def);
    }
  }
  return { default: def, byCurrency };
}

export function resolveCurrencyAmountRule(
  policy: HqCurrencyAmountDisplayPolicy,
  currency: string,
): CurrencyAmountRule {
  const key = String(currency || '').toUpperCase();
  return policy.byCurrency[key] ?? policy.default;
}

export const DEFAULT_CURRENCY_AMOUNT_DISPLAY = defaultCurrencyAmountDisplayPolicy();

/**
 * 금액에 통화 규칙 적용.
 * decimals=0 + CEIL 예: 120.38 → 121
 */
export function applyCurrencyAmount(
  amount: number,
  currency: string,
  policy: HqCurrencyAmountDisplayPolicy = DEFAULT_CURRENCY_AMOUNT_DISPLAY,
): number {
  if (!Number.isFinite(amount)) return 0;
  const rule = resolveCurrencyAmountRule(policy, currency);
  const decimals = rule.decimals;
  const factor = 10 ** decimals;
  const scaled = amount * factor;
  let rounded: number;
  switch (rule.rounding) {
    case 'CEIL':
      rounded = Math.ceil(scaled - Number.EPSILON * Math.abs(scaled || 1));
      break;
    case 'FLOOR':
      rounded = Math.floor(scaled + Number.EPSILON * Math.abs(scaled || 1));
      break;
    case 'ROUND':
    default:
      rounded = Math.round(scaled);
      break;
  }
  const out = rounded / factor;
  return Number(out.toFixed(decimals));
}
