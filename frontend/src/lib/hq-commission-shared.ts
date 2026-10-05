import {
  type HqCommissionRiskConfig,
  type FeeDiagramDisplayConfig,
  type HqCurrencyAmountDisplayPolicy,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type UsdtRiskLimitTier,
  type HqUsdtRiskLimitTiers,
  type SymbolFeeCurrency,
  hqPolicyApi,
} from '@/lib/api';

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

export const USDT_RISK_LIMIT_TIERS: UsdtRiskLimitTier[] = ['LR', 'MR', 'HR', 'XR', 'SR'];

export const FEE_CURRENCIES: SymbolFeeCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'];

export const AMOUNT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;

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
    showRates: risk.hqSandboxFeeDiagramDisplay?.showRates ?? risk.hqFeeDiagramDisplay?.showRates ?? true,
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
    perTransactionMin: 0,
    perTransactionMax: 0,
    dailyMin: 0,
    dailyMax: 0,
    monthlyMin: 0,
    monthlyMax: 0,
  };
}

export function ensureTransactionLimits(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  if (risk.transactionLimits) return risk;
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
  return { ...risk, transactionLimits: policy };
}

export function ensureUsdtRiskLimitTiers(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  const raw = risk.usdtRiskLimitTiers;
  const tiers = {} as HqUsdtRiskLimitTiers;
  for (const tier of USDT_RISK_LIMIT_TIERS) {
    const band = raw?.[tier];
    const fallback = DEFAULT_USDT_RISK_LIMIT_TIERS[tier];
    tiers[tier] = {
      minUsdt: Math.max(0, Number(band?.minUsdt ?? fallback.minUsdt) || 0),
      maxUsdt: Math.max(0, Number(band?.maxUsdt ?? fallback.maxUsdt) || 0),
    };
  }
  return { ...risk, usdtRiskLimitTiers: tiers };
}

export function withRiskDefaults(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  return ensureUsdtRiskLimitTiers(ensureTransactionLimits(withFeeDiagramDefaults(risk)));
}

// Safe saveRisk function that merges only risk-owned fields
export async function saveRisk(risk: HqCommissionRiskConfig) {
  // Get latest data first
  const latest = await hqPolicyApi.getCommission();
  
  // Merge only RISK-owned fields onto latest.risk
  const riskOwnedFields: Partial<HqCommissionRiskConfig> = {
    riskEnabled: risk.riskEnabled,
    transactionLimits: risk.transactionLimits,
    usdtRiskLimitTiers: risk.usdtRiskLimitTiers,
    maxDailyTicketsPerCustomer: risk.maxDailyTicketsPerCustomer,
    maxTicketAmountKrw: risk.maxTicketAmountKrw,
    notes: risk.notes,
  };
  
  const payload = withRiskDefaults({
    ...latest.risk,
    ...riskOwnedFields,
  });
  
  return await hqPolicyApi.saveCommissionRisk(payload);
}

// Safe saveFeeConfig function that merges only fee-owned fields
export async function saveFeeConfig(risk: HqCommissionRiskConfig) {
  // Get latest data first  
  const latest = await hqPolicyApi.getCommission();
  
  // Merge only FEE-owned fields onto latest.risk
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