import {
  type HqCommissionRiskConfig,
  type FeeDiagramDisplayConfig,
  type HqCurrencyAmountDisplayPolicy,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type MethodTransactionLimitsPolicy,
  type LimitPaymentMethod,
  type UsdtRiskLimitTier,
  type HqUsdtRiskLimitTiers,
  type SymbolFeeCurrency,
  type CustomerTypeLimitKey,
  type RiskEnabledByCustomerType,
  type UsdtRiskLimitTiersByCustomerType,
  hqPolicyApi,
} from '@/lib/api';

export const LIMIT_PAYMENT_METHODS: LimitPaymentMethod[] = [
  'BANK_TRANSFER',
  'REMITTANCE',
  'CARD',
];

// Fee diagram defaults and utilities
export const DEFAULT_FEE_DIAGRAM: FeeDiagramDisplayConfig = {
  gross: true,
  fxFee: true,
  gasFee: true,
  transferFee: true,
  otherFee: true,
  localPremium: true,
  operatingFee: true,
  expressFee: true,
  net: true,
  requiredFiat: true,
  showRates: true,
  showTotalFee: true,
  defaultFeeBillingMethod: 'ITEMIZED',
};

export const DEFAULT_CURRENCY_AMOUNT: HqCurrencyAmountDisplayPolicy = {
  default: { decimals: 2, mode: 'ROUND' },
  KRW: { decimals: 0, mode: 'FLOOR' },
  JPY: { decimals: 0, mode: 'FLOOR' },
  THB: { decimals: 2, mode: 'ROUND' },
  CNY: { decimals: 2, mode: 'ROUND' },
  HKD: { decimals: 2, mode: 'ROUND' },
  USD: { decimals: 2, mode: 'ROUND' },
  EUR: { decimals: 2, mode: 'ROUND' },
};

export const DEFAULT_USDT_RISK_LIMIT_TIERS: HqUsdtRiskLimitTiers = {
  LR: { minUsdt: 100, maxUsdt: 3_000 },
  MR: { minUsdt: 100, maxUsdt: 10_000 },
  HR: { minUsdt: 100, maxUsdt: 30_000 },
  XR: { minUsdt: 100, maxUsdt: 100_000 },
  SR: { minUsdt: 100, maxUsdt: 500_000 },
};

export const DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS: HqUsdtRiskLimitTiers = {
  LR: { minUsdt: 10, maxUsdt: 1_000 },
  MR: { minUsdt: 10, maxUsdt: 3_000 },
  HR: { minUsdt: 10, maxUsdt: 10_000 },
  XR: { minUsdt: 10, maxUsdt: 30_000 },
  SR: { minUsdt: 10, maxUsdt: 100_000 },
};

export const USDT_RISK_LIMIT_TIERS: UsdtRiskLimitTier[] = ['LR', 'MR', 'HR', 'XR', 'SR'];

export const FEE_CURRENCIES: SymbolFeeCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'];

export const AMOUNT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;

export const RISK_CUSTOMER_TYPES: CustomerTypeLimitKey[] = ['CORPORATE', 'INDIVIDUAL'];

// Helper functions
export function withFeeDiagramDefaults(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  const showTotalFee = risk.showTotalFee !== false;
  const live = {
    ...DEFAULT_FEE_DIAGRAM,
    ...risk.feeDiagramDisplay,
    showTotalFee,
  };
  const sandbox = {
    ...DEFAULT_FEE_DIAGRAM,
    ...live,
    ...risk.sandboxFeeDiagramDisplay,
    showTotalFee,
  };
  const hqLive = {
    ...DEFAULT_FEE_DIAGRAM,
    ...risk.hqFeeDiagramDisplay,
    showTotalFee: true,
    showRates: risk.hqFeeDiagramDisplay?.showRates ?? true,
  };
  const hqSandbox = {
    ...DEFAULT_FEE_DIAGRAM,
    ...hqLive,
    ...risk.hqSandboxFeeDiagramDisplay,
    showTotalFee: true,
    showRates:
      risk.hqSandboxFeeDiagramDisplay?.showRates ??
      risk.hqFeeDiagramDisplay?.showRates ??
      true,
  };
  return {
    ...risk,
    showTotalFee,
    feeDiagramDisplay: live,
    sandboxFeeDiagramDisplay: sandbox,
    hqFeeDiagramDisplay: hqLive,
    hqSandboxFeeDiagramDisplay: hqSandbox,
  };
}

export function emptyCurrencyLimits(): CurrencyTransactionLimits {
  return {
    enabled: true,
    perTransactionMin: 0,
    perTransactionMax: 0,
    dailyMin: 0,
    dailyMax: 0,
    monthlyMin: 0,
    monthlyMax: 0,
  };
}

function cloneCustomerPolicy(
  policy: CustomerTransactionLimitsPolicy,
): CustomerTransactionLimitsPolicy {
  return {
    INDIVIDUAL: { ...policy.INDIVIDUAL },
    CORPORATE: { ...policy.CORPORATE },
  };
}

function withEnabledDefault(row: CurrencyTransactionLimits): CurrencyTransactionLimits {
  return { ...row, enabled: row.enabled !== false };
}

export function ensureTransactionLimits(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  let transactionLimits = risk.transactionLimits;
  if (!transactionLimits) {
    const policy = {
      INDIVIDUAL: {} as CustomerTransactionLimitsPolicy['INDIVIDUAL'],
      CORPORATE: {} as CustomerTransactionLimitsPolicy['CORPORATE'],
    };
    for (const currency of FEE_CURRENCIES) {
      const row = emptyCurrencyLimits();
      if (currency === 'KRW' && risk.maxTicketAmountKrw > 0) {
        row.perTransactionMax = risk.maxTicketAmountKrw;
        row.dailyMax = risk.maxTicketAmountKrw * 5;
        row.monthlyMax = risk.maxTicketAmountKrw * 20;
      }
      policy.INDIVIDUAL[currency] = { ...row };
      policy.CORPORATE[currency] = {
        ...row,
        perTransactionMax: row.perTransactionMax * 5,
        dailyMax: row.dailyMax * 5,
        monthlyMax: row.monthlyMax * 5,
      };
    }
    transactionLimits = policy;
  }

  const existing = risk.methodTransactionLimits;
  const methodTransactionLimits: MethodTransactionLimitsPolicy = {
    BANK_TRANSFER:
      existing?.BANK_TRANSFER ?? cloneCustomerPolicy(transactionLimits),
    REMITTANCE:
      existing?.REMITTANCE ??
      cloneCustomerPolicy(existing?.BANK_TRANSFER ?? transactionLimits),
    CARD: existing?.CARD ?? cloneCustomerPolicy(transactionLimits),
  };

  for (const method of LIMIT_PAYMENT_METHODS) {
    for (const type of RISK_CUSTOMER_TYPES) {
      for (const currency of FEE_CURRENCIES) {
        const row = methodTransactionLimits[method][type][currency];
        methodTransactionLimits[method][type][currency] = withEnabledDefault(
          row ?? emptyCurrencyLimits(),
        );
      }
    }
  }

  return {
    ...risk,
    transactionLimits: methodTransactionLimits.BANK_TRANSFER,
    methodTransactionLimits,
  };
}

function normalizeTierBand(
  band: { minUsdt?: number; maxUsdt?: number } | undefined,
  fallback: { minUsdt: number; maxUsdt: number },
): { minUsdt: number; maxUsdt: number } {
  return {
    minUsdt: Math.max(0, Number(band?.minUsdt ?? fallback.minUsdt) || 0),
    maxUsdt: Math.max(0, Number(band?.maxUsdt ?? fallback.maxUsdt) || 0),
  };
}

function buildTiersForType(
  raw: Partial<HqUsdtRiskLimitTiers> | null | undefined,
  customerType: CustomerTypeLimitKey,
): HqUsdtRiskLimitTiers {
  const fallback =
    customerType === 'INDIVIDUAL'
      ? DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS
      : DEFAULT_USDT_RISK_LIMIT_TIERS;
  const tiers = {} as HqUsdtRiskLimitTiers;
  for (const tier of USDT_RISK_LIMIT_TIERS) {
    tiers[tier] = normalizeTierBand(raw?.[tier], fallback[tier]);
  }
  return tiers;
}

export function ensureUsdtRiskLimitTiers(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  const byType: UsdtRiskLimitTiersByCustomerType = {
    CORPORATE: buildTiersForType(
      risk.usdtRiskLimitTiersByCustomerType?.CORPORATE ?? risk.usdtRiskLimitTiers,
      'CORPORATE',
    ),
    INDIVIDUAL: buildTiersForType(
      risk.usdtRiskLimitTiersByCustomerType?.INDIVIDUAL ?? null,
      'INDIVIDUAL',
    ),
  };
  return {
    ...risk,
    usdtRiskLimitTiers: byType.CORPORATE,
    usdtRiskLimitTiersByCustomerType: byType,
  };
}

export function ensureRiskEnabledByCustomerType(
  risk: HqCommissionRiskConfig,
): HqCommissionRiskConfig {
  const legacy = risk.riskEnabled !== false;
  const byType: RiskEnabledByCustomerType = {
    INDIVIDUAL:
      risk.riskEnabledByCustomerType?.INDIVIDUAL !== undefined
        ? Boolean(risk.riskEnabledByCustomerType.INDIVIDUAL)
        : legacy,
    CORPORATE:
      risk.riskEnabledByCustomerType?.CORPORATE !== undefined
        ? Boolean(risk.riskEnabledByCustomerType.CORPORATE)
        : legacy,
  };
  return {
    ...risk,
    riskEnabled: byType.CORPORATE,
    riskEnabledByCustomerType: byType,
  };
}

export function withRiskDefaults(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  return ensureRiskEnabledByCustomerType(
    ensureUsdtRiskLimitTiers(ensureTransactionLimits(withFeeDiagramDefaults(risk))),
  );
}

/** 한도 설정만 저장 (통화 행 활성·금액) */
export async function saveLimits(risk: HqCommissionRiskConfig) {
  const latest = await hqPolicyApi.getCommission();
  const withMethods = ensureTransactionLimits(risk);
  const payload = withRiskDefaults({
    ...latest.risk,
    transactionLimits: withMethods.methodTransactionLimits!.BANK_TRANSFER,
    methodTransactionLimits: withMethods.methodTransactionLimits,
    maxTicketAmountKrw: withMethods.maxTicketAmountKrw,
  });
  return await hqPolicyApi.saveCommissionRisk(payload);
}

// Safe saveRisk function that merges only risk-owned fields
export async function saveRisk(risk: HqCommissionRiskConfig) {
  const latest = await hqPolicyApi.getCommission();
  const normalized = withRiskDefaults(risk);
  const riskOwnedFields: Partial<HqCommissionRiskConfig> = {
    riskEnabled: normalized.riskEnabledByCustomerType!.CORPORATE,
    riskEnabledByCustomerType: normalized.riskEnabledByCustomerType,
    transactionLimits: normalized.methodTransactionLimits!.BANK_TRANSFER,
    methodTransactionLimits: normalized.methodTransactionLimits,
    usdtRiskLimitTiers: normalized.usdtRiskLimitTiersByCustomerType!.CORPORATE,
    usdtRiskLimitTiersByCustomerType: normalized.usdtRiskLimitTiersByCustomerType,
    maxDailyTicketsPerCustomer: normalized.maxDailyTicketsPerCustomer,
    maxTicketAmountKrw: normalized.maxTicketAmountKrw,
    notes: normalized.notes,
  };

  const payload = withRiskDefaults({
    ...latest.risk,
    ...riskOwnedFields,
  });

  return await hqPolicyApi.saveCommissionRisk(payload);
}

// Safe saveFeeConfig function that merges only fee-owned fields
export async function saveFeeConfig(risk: HqCommissionRiskConfig) {
  const latest = await hqPolicyApi.getCommission();

  const feeOwnedFields: Partial<HqCommissionRiskConfig> = {
    showTotalFee: risk.showTotalFee,
    feeDiagramDisplay: risk.feeDiagramDisplay,
    sandboxFeeDiagramDisplay: risk.sandboxFeeDiagramDisplay,
    hqFeeDiagramDisplay: risk.hqFeeDiagramDisplay,
    hqSandboxFeeDiagramDisplay: risk.hqSandboxFeeDiagramDisplay,
  };

  const payload = withRiskDefaults({
    ...latest.risk,
    ...feeOwnedFields,
  });

  return await hqPolicyApi.saveCommissionRisk(payload);
}
