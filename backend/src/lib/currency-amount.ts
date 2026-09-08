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

export function defaultCurrencyAmountDisplayPolicy(): HqCurrencyAmountDisplayPolicy {
  return {
    default: { decimals: 2, mode: 'ROUND' },
    KRW: { decimals: 0, mode: 'FLOOR' },
    JPY: { decimals: 0, mode: 'FLOOR' },
    THB: { decimals: 2, mode: 'ROUND' },
    CNY: { decimals: 2, mode: 'ROUND' },
    HKD: { decimals: 2, mode: 'ROUND' },
    USD: { decimals: 2, mode: 'ROUND' },
  };
}

export function normalizeCurrencyAmountDisplayPolicy(
  raw: Partial<HqCurrencyAmountDisplayPolicy> | null | undefined,
): HqCurrencyAmountDisplayPolicy {
  const base = defaultCurrencyAmountDisplayPolicy();
  if (!raw || typeof raw !== 'object') return base;
  const mergeRule = (src?: HqCurrencyAmountRule, fallback?: HqCurrencyAmountRule): HqCurrencyAmountRule => ({
    decimals: Number(src?.decimals ?? fallback?.decimals ?? 0) || 0,
    mode: src?.mode === 'CEIL' || src?.mode === 'FLOOR' ? src.mode : 'ROUND',
  });
  return {
    default: mergeRule(raw.default, base.default),
    KRW: mergeRule(raw.KRW, base.KRW),
    JPY: mergeRule(raw.JPY, base.JPY),
    THB: mergeRule(raw.THB, base.THB),
    CNY: mergeRule(raw.CNY, base.CNY),
    HKD: mergeRule(raw.HKD, base.HKD),
    USD: mergeRule(raw.USD, base.USD),
  };
}

export function resolveCurrencyAmountRule(
  policy: HqCurrencyAmountDisplayPolicy,
  currency: string,
): HqCurrencyAmountRule {
  const key = currency.toUpperCase() as keyof HqCurrencyAmountDisplayPolicy;
  const rule = policy[key];
  if (rule && typeof rule === 'object' && 'decimals' in rule) return rule;
  return policy.default;
}

export function applyCurrencyAmount(
  amount: number,
  currency: string,
  policy: HqCurrencyAmountDisplayPolicy,
): number {
  const rule = resolveCurrencyAmountRule(policy, currency);
  const decimals = Math.max(0, Math.min(8, Number(rule.decimals) || 0));
  const factor = 10 ** decimals;
  const x = Number(amount) * factor;
  const n = rule.mode === 'CEIL' ? Math.ceil(x) : rule.mode === 'FLOOR' ? Math.floor(x) : Math.round(x);
  return Number((n / factor).toFixed(decimals));
}
