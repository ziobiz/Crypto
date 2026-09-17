import type {
  FeeDiagramDisplayConfig,
  HqCommissionRiskConfig,
  SymbolFeeCurrency,
  SymbolFeeTierPolicy,
  SymbolFeeTierRow,
  TransactionFees,
} from '../constants/hq-policy';
import {
  DEFAULT_FEE_DIAGRAM_DISPLAY,
  HQ_CONFIG_KEYS,
  SYMBOL_FEE_CURRENCIES,
  defaultGasNetworkPolicy,
  gasFeeUsdtForNetwork,
  normalizeFeeBillingPresentation,
  normalizeGasNetworkPolicy,
} from '../constants/hq-policy';
import { mergeLiveFeesWithSandboxBasic, sandboxBasicDeltas, applySandboxGasDelta } from '../lib/sandbox-fee-merge';
import { computeFeeAmounts, normalizeTransactionFees } from '../lib/fee-component';
import { prisma } from '../lib/prisma';
import { normalizeTransactionLimits } from '../lib/transaction-limit-policy';

export function defaultTransactionFees(): TransactionFees {
  return normalizeTransactionFees();
}

const DEFAULT_THRESHOLDS: Record<SymbolFeeCurrency, number[]> = {
  KRW: [1_000_000, 10_000_000, 999_999_999_999],
  JPY: [100_000, 1_000_000, 99_999_999_999],
  THB: [50_000, 500_000, 99_999_999_999],
  CNY: [10_000, 100_000, 99_999_999_999],
  USD: [1_000, 10_000, 99_999_999_999],
};

export function defaultSymbolFeeTiers(): SymbolFeeTierPolicy {
  const base = defaultTransactionFees();
  const rows: SymbolFeeTierRow[] = [];
  let seq = 0;
  for (const currency of SYMBOL_FEE_CURRENCIES) {
    for (const [i, maxAmount] of DEFAULT_THRESHOLDS[currency].entries()) {
      rows.push({
        id: `default-${currency}-${i}`,
        currency,
        maxAmount,
        ...base,
        fxFeePercent: Math.max(0, Number((base.fxFeePercent - i * 0.05).toFixed(4))),
      });
      seq += 1;
      void seq;
    }
  }
  return rows;
}

function isSymbolFeeCurrency(value: string): value is SymbolFeeCurrency {
  return (SYMBOL_FEE_CURRENCIES as readonly string[]).includes(value);
}

export function normalizeSymbolFeeTiers(raw: unknown): SymbolFeeTierPolicy {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultSymbolFeeTiers();
  }

  const rows: SymbolFeeTierRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Partial<SymbolFeeTierRow>;
    const currency = String(row.currency ?? '');
    if (!isSymbolFeeCurrency(currency)) continue;
    const maxAmount = Number(row.maxAmount);
    if (!Number.isFinite(maxAmount) || maxAmount <= 0) continue;
    rows.push({
      id: String(row.id ?? `tier-${currency}-${maxAmount}`),
      currency,
      maxAmount,
      ...normalizeTransactionFees(row),
    });
  }

  if (!rows.length) return defaultSymbolFeeTiers();

  return rows.sort((a, b) => {
    if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
    return a.maxAmount - b.maxAmount;
  });
}

export function pickFeeTier(
  tiers: SymbolFeeTierPolicy,
  currency: string,
  fiatAmount: number,
): SymbolFeeTierRow | null {
  const forCurrency = tiers
    .filter((t) => t.currency === currency)
    .sort((a, b) => a.maxAmount - b.maxAmount);
  if (!forCurrency.length) return null;
  const amount = fiatAmount > 0 ? fiatAmount : 0;
  return forCurrency.find((t) => amount <= t.maxAmount) ?? forCurrency[forCurrency.length - 1]!;
}

export function tierToTransactionFees(tier: SymbolFeeTierRow): TransactionFees {
  return normalizeTransactionFees(tier);
}

export function normalizeFeeDiagramDisplay(
  raw?: Partial<FeeDiagramDisplayConfig>,
): FeeDiagramDisplayConfig {
  return {
    ...DEFAULT_FEE_DIAGRAM_DISPLAY,
    ...raw,
    defaultFeeBillingMethod: normalizeFeeBillingPresentation(
      raw?.defaultFeeBillingMethod ?? DEFAULT_FEE_DIAGRAM_DISPLAY.defaultFeeBillingMethod,
    ),
  };
}

/** 저장된 본사정책 + 구 필드 마이그레이션 */
export function normalizeCommissionRisk(raw: Partial<HqCommissionRiskConfig>): HqCommissionRiskConfig {
  const defaults = defaultTransactionFees();
  const transfer =
    raw.defaultTransferFeeUsdt ??
    raw.defaultPlatformFeeUsdt ??
    defaults.transferFeeUsdt;

  return {
    defaultFxFeePercent: raw.defaultFxFeePercent ?? defaults.fxFeePercent,
    defaultFxFeeUsdt: raw.defaultFxFeeUsdt ?? defaults.fxFeeUsdt,
    defaultFxFeeMode: raw.defaultFxFeeMode ?? defaults.fxFeeMode,
    defaultGasFeeUsdt: raw.defaultGasFeeUsdt ?? defaults.gasFeeUsdt,
    defaultGasFeePercent: raw.defaultGasFeePercent ?? defaults.gasFeePercent,
    defaultGasFeeMode: raw.defaultGasFeeMode ?? defaults.gasFeeMode,
    defaultTransferFeeUsdt: transfer,
    defaultTransferFeePercent: raw.defaultTransferFeePercent ?? defaults.transferFeePercent,
    defaultTransferFeeMode: raw.defaultTransferFeeMode ?? defaults.transferFeeMode,
    defaultOtherFeeUsdt: raw.defaultOtherFeeUsdt ?? defaults.otherFeeUsdt,
    defaultOtherFeePercent: raw.defaultOtherFeePercent ?? defaults.otherFeePercent,
    defaultOtherFeeMode: raw.defaultOtherFeeMode ?? defaults.otherFeeMode,
    feeDiagramDisplay: normalizeFeeDiagramDisplay(raw.feeDiagramDisplay),
    sandboxFeeDiagramDisplay: normalizeFeeDiagramDisplay(
      raw.sandboxFeeDiagramDisplay ?? raw.feeDiagramDisplay,
    ),
    maxTicketAmountKrw: raw.maxTicketAmountKrw ?? 100_000_000,
    riskEnabled: raw.riskEnabled ?? true,
    maxDailyTicketsPerCustomer: raw.maxDailyTicketsPerCustomer ?? 10,
    transactionLimits: normalizeTransactionLimits(
      raw.transactionLimits,
      raw.maxTicketAmountKrw ?? 100_000_000,
    ),
    notes: raw.notes ?? '',
  };
}

export async function getCommissionRiskConfig(): Promise<HqCommissionRiskConfig> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.commissionRisk },
  });
  return normalizeCommissionRisk((row?.value ?? {}) as Partial<HqCommissionRiskConfig>);
}

export async function getSymbolFeeTiers(): Promise<SymbolFeeTierPolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.feeTiers },
  });
  return normalizeSymbolFeeTiers(row?.value);
}

export async function getSimulatorCommissionRiskConfig(): Promise<HqCommissionRiskConfig> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.simulatorCommissionRisk },
  });
  if (!row?.value || (typeof row.value === 'object' && Object.keys(row.value as object).length === 0)) {
    return normalizeCommissionRisk({
      defaultFxFeePercent: 0,
      defaultGasFeeUsdt: 0,
      defaultTransferFeeUsdt: 0,
      defaultOtherFeeUsdt: 0,
    });
  }
  return normalizeCommissionRisk(row.value as Partial<HqCommissionRiskConfig>);
}

export async function getSimulatorSymbolFeeTiers(): Promise<SymbolFeeTierPolicy> {
  return getSymbolFeeTiers();
}

export async function getSimulatorHqTransactionFees(): Promise<TransactionFees> {
  const risk = await getSimulatorCommissionRiskConfig();
  return normalizeTransactionFees({
    fxFeeMode: risk.defaultFxFeeMode,
    fxFeePercent: risk.defaultFxFeePercent,
    fxFeeUsdt: risk.defaultFxFeeUsdt,
    gasFeeMode: risk.defaultGasFeeMode,
    gasFeePercent: risk.defaultGasFeePercent,
    gasFeeUsdt: risk.defaultGasFeeUsdt,
    transferFeeMode: risk.defaultTransferFeeMode,
    transferFeePercent: risk.defaultTransferFeePercent,
    transferFeeUsdt: risk.defaultTransferFeeUsdt,
    otherFeeMode: risk.defaultOtherFeeMode,
    otherFeePercent: risk.defaultOtherFeePercent,
    otherFeeUsdt: risk.defaultOtherFeeUsdt,
  });
}

export type FeePolicyScope = 'live' | 'sandbox';

export async function getFeeDiagramDisplay(
  scope: FeePolicyScope = 'live',
): Promise<FeeDiagramDisplayConfig> {
  const risk = await getCommissionRiskConfig();
  if (scope === 'sandbox') {
    return (
      risk.sandboxFeeDiagramDisplay ??
      risk.feeDiagramDisplay ??
      normalizeFeeDiagramDisplay()
    );
  }
  return risk.feeDiagramDisplay ?? normalizeFeeDiagramDisplay();
}

/** 고객·본사 기본을 반영한 도식 표시 설정 (billingMethod 해석 포함) */
export async function getFeeDiagramDisplayForCustomer(
  customerProfileId?: string | null,
  scope: FeePolicyScope = 'live',
): Promise<FeeDiagramDisplayConfig> {
  const base = await getFeeDiagramDisplay(scope);
  const hqDefault = normalizeFeeBillingPresentation(base.defaultFeeBillingMethod);
  if (!customerProfileId || scope === 'sandbox') {
    return { ...base, billingMethod: hqDefault };
  }
  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: { feeBillingMethod: true },
  });
  const method = profile?.feeBillingMethod;
  const billingMethod =
    !method || method === 'FOLLOW_HQ'
      ? hqDefault
      : normalizeFeeBillingPresentation(method);
  return { ...base, billingMethod };
}

export async function getGasNetworkPolicy() {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.gasNetworks },
  });
  return normalizeGasNetworkPolicy(row?.value ?? defaultGasNetworkPolicy());
}

export async function getHqTransactionFees(): Promise<TransactionFees> {
  const risk = await getCommissionRiskConfig();
  return normalizeTransactionFees({
    fxFeeMode: risk.defaultFxFeeMode,
    fxFeePercent: risk.defaultFxFeePercent,
    fxFeeUsdt: risk.defaultFxFeeUsdt,
    gasFeeMode: risk.defaultGasFeeMode,
    gasFeePercent: risk.defaultGasFeePercent,
    gasFeeUsdt: risk.defaultGasFeeUsdt,
    transferFeeMode: risk.defaultTransferFeeMode,
    transferFeePercent: risk.defaultTransferFeePercent,
    transferFeeUsdt: risk.defaultTransferFeeUsdt,
    otherFeeMode: risk.defaultOtherFeeMode,
    otherFeePercent: risk.defaultOtherFeePercent,
    otherFeeUsdt: risk.defaultOtherFeeUsdt,
  });
}

type WalletFeeSource = {
  fxFeePercent?: unknown;
  gasFeeAmount: unknown;
  transferFeeAmount?: unknown;
  otherFeeAmount?: unknown;
  platformFeeAmount?: unknown;
  network?: unknown;
};

function overrideFeeComponent(
  hq: TransactionFees,
  key: 'fx' | 'gas' | 'transfer' | 'other',
  walletPercent: number,
  walletFixed: number,
): TransactionFees {
  const modeKey = `${key}FeeMode` as keyof TransactionFees;
  const percentKey = `${key}FeePercent` as keyof TransactionFees;
  const fixedKey = `${key}FeeUsdt` as keyof TransactionFees;
  if (key === 'other') {
    if (walletFixed > 0) return { ...hq, [fixedKey]: walletFixed };
    return hq;
  }
  const mode = hq[modeKey] as TransactionFees[typeof modeKey];
  if (mode === 'percent' && walletPercent > 0) {
    return { ...hq, [percentKey]: walletPercent };
  }
  if (mode === 'fixed' && walletFixed > 0) {
    return { ...hq, [fixedKey]: walletFixed };
  }
  return hq;
}

export function withNetworkGasFee(
  hq: TransactionFees,
  network: string | null | undefined,
  gasPolicy: Awaited<ReturnType<typeof getGasNetworkPolicy>>,
): TransactionFees {
  return {
    ...hq,
    gasFeeMode: 'fixed',
    gasFeePercent: 0,
    gasFeeUsdt: gasFeeUsdtForNetwork(gasPolicy, network, hq.gasFeeUsdt),
  };
}

/** 지갑 개별값 우선, 0이면 본사 기본값 */
export function resolveTransactionFees(
  wallet: WalletFeeSource,
  hq: TransactionFees,
): TransactionFees {
  const walletFx = Number(wallet.fxFeePercent);
  const walletGas = Number(wallet.gasFeeAmount);
  const walletTransfer =
    Number(wallet.transferFeeAmount) ||
    Number(wallet.platformFeeAmount) ||
    0;
  const walletOther = Number(wallet.otherFeeAmount);

  let fees = hq;
  fees = overrideFeeComponent(fees, 'fx', walletFx, walletFx);
  fees = overrideFeeComponent(fees, 'gas', walletGas, walletGas);
  fees = overrideFeeComponent(fees, 'transfer', walletTransfer, walletTransfer);
  fees = overrideFeeComponent(fees, 'other', walletOther, walletOther);
  return fees;
}

/** 통화·금액 구간 수수료 → 지갑 오버라이드 적용 */
export async function resolveFeesForAmount(
  wallet: WalletFeeSource,
  currency: string,
  fiatAmount: number,
  options?: { feePolicy?: FeePolicyScope },
): Promise<TransactionFees> {
  const sandbox = options?.feePolicy === 'sandbox';
  const [liveTiers, gasPolicy] = await Promise.all([getSymbolFeeTiers(), getGasNetworkPolicy()]);
  const tier = pickFeeTier(liveTiers, currency, fiatAmount);

  if (sandbox) {
    const sandboxRisk = await getSimulatorCommissionRiskConfig();
    const deltas = sandboxBasicDeltas(sandboxRisk);
    let hq = tier ? tierToTransactionFees(tier) : await getHqTransactionFees();
    hq = mergeLiveFeesWithSandboxBasic(hq, deltas);
    const networkGas = gasFeeUsdtForNetwork(
      gasPolicy,
      String(wallet.network ?? ''),
      hq.gasFeeUsdt,
    );
    hq = applySandboxGasDelta(hq, networkGas, deltas.gasUsdt);
    return resolveTransactionFees(wallet, hq);
  }

  const hqFlat = await getHqTransactionFees();
  let hq = tier ? tierToTransactionFees(tier) : hqFlat;
  hq = withNetworkGasFee(hq, String(wallet.network ?? ''), gasPolicy);
  return resolveTransactionFees(wallet, hq);
}

export async function gasFeeUsdtForWalletNetwork(network: string | null | undefined): Promise<number> {
  const [policy, hq] = await Promise.all([getGasNetworkPolicy(), getHqTransactionFees()]);
  return gasFeeUsdtForNetwork(policy, network, hq.gasFeeUsdt);
}

export function totalFixedFeesUsdt(grossUsdt: number, fees: TransactionFees): number {
  const amounts = computeFeeAmounts(grossUsdt, fees);
  return amounts.gasFeeUsdt + amounts.transferFeeUsdt + amounts.otherFeeUsdt;
}

/** 티켓 스냅샷 기준 총 수수료 풀 (USDT) — FX·가스·송금·기타 (운영수수료 제외) */
export function commissionPoolFromSnapshots(detail: {
  fiatAmount: unknown;
  exchangeRate: unknown;
  feePolicySnapshot?: unknown;
  fxFeePercentSnapshot?: unknown;
  gasFeeSnapshot: unknown;
  transferFeeSnapshot?: unknown;
  otherFeeSnapshot?: unknown;
  platformFeeSnapshot?: unknown;
}): number {
  const rate = Number(detail.exchangeRate);
  const gross = rate > 0 ? Number(detail.fiatAmount) / rate : 0;
  if (detail.feePolicySnapshot && typeof detail.feePolicySnapshot === 'object') {
    const amounts = computeFeeAmounts(
      gross,
      normalizeTransactionFees(detail.feePolicySnapshot as TransactionFees),
    );
    return Number(
      (amounts.fxFeeUsdt + amounts.gasFeeUsdt + amounts.transferFeeUsdt + amounts.otherFeeUsdt).toFixed(8),
    );
  }
  const fxPct = Number(detail.fxFeePercentSnapshot ?? 0);
  const fxFee = (gross * fxPct) / 100;
  const gas = Number(detail.gasFeeSnapshot) || 0;
  const transfer =
    Number(detail.transferFeeSnapshot) ||
    Number(detail.platformFeeSnapshot) ||
    0;
  const other = Number(detail.otherFeeSnapshot) || 0;
  return Number((fxFee + gas + transfer + other).toFixed(8));
}

/** USDT 매입 환산 총액(수수료 전) — 운영수수료(합계%+건당) 배분 기준 */
export function grossUsdtFromPurchaseSnapshots(detail: {
  fiatAmount: unknown;
  exchangeRate: unknown;
}): number {
  const rate = Number(detail.exchangeRate);
  if (!(rate > 0)) return 0;
  return Number((Number(detail.fiatAmount) / rate).toFixed(8));
}
