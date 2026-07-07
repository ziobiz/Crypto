import {
  SYMBOL_FEE_CURRENCIES,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';

export function defaultCurrencyLimits(
  overrides?: Partial<CurrencyTransactionLimits>,
): CurrencyTransactionLimits {
  return {
    perTransactionMin: 0,
    perTransactionMax: 0,
    dailyMin: 0,
    dailyMax: 0,
    monthlyMin: 0,
    monthlyMax: 0,
    ...overrides,
  };
}

export function defaultTransactionLimitsPolicy(
  maxTicketKrw = 100_000_000,
): CustomerTransactionLimitsPolicy {
  const buildForType = (multiplier: number): Record<SymbolFeeCurrency, CurrencyTransactionLimits> => {
    const row: Partial<Record<SymbolFeeCurrency, CurrencyTransactionLimits>> = {};
    for (const currency of SYMBOL_FEE_CURRENCIES) {
      const scale =
        currency === 'KRW'
          ? 1
          : currency === 'JPY'
            ? 0.1
            : currency === 'THB'
              ? 0.03
              : currency === 'CNY'
                ? 0.005
                : 0.00075;
      const base = Math.round(maxTicketKrw * scale);
      row[currency] = defaultCurrencyLimits({
        perTransactionMax: base * multiplier,
        dailyMax: base * multiplier * 5,
        monthlyMax: base * multiplier * 20,
      });
    }
    return row as Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
  };

  return {
    INDIVIDUAL: buildForType(1),
    CORPORATE: buildForType(5),
  };
}

function normalizeCurrencyLimits(raw?: Partial<CurrencyTransactionLimits>): CurrencyTransactionLimits {
  const n = (v: unknown) => {
    const num = Number(v);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };
  return {
    perTransactionMin: n(raw?.perTransactionMin),
    perTransactionMax: n(raw?.perTransactionMax),
    dailyMin: n(raw?.dailyMin),
    dailyMax: n(raw?.dailyMax),
    monthlyMin: n(raw?.monthlyMin),
    monthlyMax: n(raw?.monthlyMax),
  };
}

export function normalizeTransactionLimits(
  raw: Partial<CustomerTransactionLimitsPolicy> | undefined,
  maxTicketKrw: number,
): CustomerTransactionLimitsPolicy {
  const defaults = defaultTransactionLimitsPolicy(maxTicketKrw);
  const result = { ...defaults };

  for (const customerType of ['INDIVIDUAL', 'CORPORATE'] as const) {
    const src = (raw?.[customerType] ?? {}) as Partial<
      Record<SymbolFeeCurrency, Partial<CurrencyTransactionLimits>>
    >;
    for (const currency of SYMBOL_FEE_CURRENCIES) {
      result[customerType][currency] = normalizeCurrencyLimits({
        ...defaults[customerType][currency],
        ...(src[currency] ?? {}),
      });
    }
  }

  if (maxTicketKrw > 0) {
    const individualKrw = result.INDIVIDUAL.KRW;
    if (individualKrw.perTransactionMax <= 0) {
      individualKrw.perTransactionMax = maxTicketKrw;
    }
  }

  return result;
}
