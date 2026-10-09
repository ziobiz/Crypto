import {
  LIMIT_PAYMENT_METHODS,
  SYMBOL_FEE_CURRENCIES,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type LimitPaymentMethod,
  type MethodTransactionLimitsPolicy,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';

export function defaultCurrencyLimits(
  overrides?: Partial<CurrencyTransactionLimits>,
): CurrencyTransactionLimits {
  const { enabled: enabledOverride, ...rest } = overrides ?? {};
  return {
    perTransactionMin: 0,
    perTransactionMax: 0,
    dailyMin: 0,
    dailyMax: 0,
    monthlyMin: 0,
    monthlyMax: 0,
    ...rest,
    enabled: enabledOverride !== false,
  };
}

/** 개인고객 기본 1회 한도 — 가입 안내·국가 한도와 정합 (대부분 ≤ 약 10,000 USD) */
const INDIVIDUAL_PER_TX_MAX: Record<SymbolFeeCurrency, number> = {
  KRW: 10_000_000,
  JPY: 1_000_000,
  THB: 330_000,
  CNY: 65_000,
  USD: 10_000,
  EUR: 9_000,
};

export function defaultTransactionLimitsPolicy(
  maxTicketKrw = 100_000_000,
): CustomerTransactionLimitsPolicy {
  const buildCorporate = (): Record<SymbolFeeCurrency, CurrencyTransactionLimits> => {
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
      const base = Math.round(maxTicketKrw * scale) * 5;
      row[currency] = defaultCurrencyLimits({
        perTransactionMax: base,
        dailyMax: base * 5,
        monthlyMax: base * 20,
      });
    }
    return row as Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
  };

  const individual = {} as Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
  for (const currency of SYMBOL_FEE_CURRENCIES) {
    const max = INDIVIDUAL_PER_TX_MAX[currency] ?? 0;
    individual[currency] = defaultCurrencyLimits({
      perTransactionMax: max,
      dailyMax: max * 5,
      monthlyMax: max * 20,
    });
  }

  return {
    INDIVIDUAL: individual,
    CORPORATE: buildCorporate(),
  };
}

function clonePolicy(policy: CustomerTransactionLimitsPolicy): CustomerTransactionLimitsPolicy {
  return {
    INDIVIDUAL: { ...policy.INDIVIDUAL },
    CORPORATE: { ...policy.CORPORATE },
  };
}

function normalizeCurrencyLimits(raw?: Partial<CurrencyTransactionLimits>): CurrencyTransactionLimits {
  const n = (v: unknown) => {
    const num = Number(v);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };
  return {
    enabled: raw?.enabled !== false,
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
  const result = {
    INDIVIDUAL: { ...defaults.INDIVIDUAL },
    CORPORATE: { ...defaults.CORPORATE },
  };

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

/** 카드 결제관리 한도(min/max) → 리스크 CARD 정책 시드 */
export function policyFromCardChargeLimits(
  cardLimits: Partial<Record<SymbolFeeCurrency, { min?: number; max?: number }>> | undefined,
  maxTicketKrw: number,
): CustomerTransactionLimitsPolicy {
  const base = defaultTransactionLimitsPolicy(maxTicketKrw);
  const out: CustomerTransactionLimitsPolicy = {
    INDIVIDUAL: { ...base.INDIVIDUAL },
    CORPORATE: { ...base.CORPORATE },
  };
  for (const customerType of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const currency of SYMBOL_FEE_CURRENCIES) {
      const band = cardLimits?.[currency];
      const min = Math.max(0, Number(band?.min) || 0);
      const max = Math.max(0, Number(band?.max) || 0);
      out[customerType][currency] = defaultCurrencyLimits({
        perTransactionMin: min,
        perTransactionMax: max,
      });
    }
  }
  return out;
}

/** CARD 정책 → 카드 결제관리 limits 동기화용 */
export function cardChargeLimitsFromPolicy(
  policy: CustomerTransactionLimitsPolicy,
): Record<SymbolFeeCurrency, { min: number; max: number }> {
  const out = {} as Record<SymbolFeeCurrency, { min: number; max: number }>;
  for (const currency of SYMBOL_FEE_CURRENCIES) {
    const band = policy.INDIVIDUAL[currency];
    out[currency] = {
      min: band.perTransactionMin,
      max: band.perTransactionMax,
    };
  }
  return out;
}

export function defaultMethodTransactionLimitsPolicy(
  maxTicketKrw = 100_000_000,
): MethodTransactionLimitsPolicy {
  const bank = defaultTransactionLimitsPolicy(maxTicketKrw);
  return {
    BANK_TRANSFER: clonePolicy(bank),
    REMITTANCE: clonePolicy(bank),
    CARD: clonePolicy(bank),
  };
}

export function normalizeMethodTransactionLimits(
  raw: Partial<MethodTransactionLimitsPolicy> | undefined,
  legacyTransactionLimits: Partial<CustomerTransactionLimitsPolicy> | undefined,
  maxTicketKrw: number,
  cardSeedLimits?: Partial<Record<SymbolFeeCurrency, { min?: number; max?: number }>>,
): MethodTransactionLimitsPolicy {
  const hasMethodRaw = Boolean(
    raw &&
      LIMIT_PAYMENT_METHODS.some(
        (m) => raw[m] && typeof raw[m] === 'object' && Object.keys(raw[m] as object).length > 0,
      ),
  );

  const bank = normalizeTransactionLimits(
    hasMethodRaw ? raw?.BANK_TRANSFER : (raw?.BANK_TRANSFER ?? legacyTransactionLimits),
    maxTicketKrw,
  );

  const remit = normalizeTransactionLimits(
    hasMethodRaw
      ? raw?.REMITTANCE ?? raw?.BANK_TRANSFER
      : (raw?.REMITTANCE ?? raw?.BANK_TRANSFER ?? legacyTransactionLimits),
    maxTicketKrw,
  );

  let card: CustomerTransactionLimitsPolicy;
  if (hasMethodRaw && raw?.CARD) {
    card = normalizeTransactionLimits(raw.CARD, maxTicketKrw);
  } else if (cardSeedLimits) {
    card = policyFromCardChargeLimits(cardSeedLimits, maxTicketKrw);
  } else {
    card = normalizeTransactionLimits(raw?.CARD, maxTicketKrw);
  }

  return {
    BANK_TRANSFER: bank,
    REMITTANCE: remit,
    CARD: card,
  };
}

export function resolveLimitPaymentMethod(
  method?: string | null,
): LimitPaymentMethod {
  if (method === 'CARD') return 'CARD';
  if (method === 'REMITTANCE') return 'REMITTANCE';
  return 'BANK_TRANSFER';
}
