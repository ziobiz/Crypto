import type {
  CustomerTypeLimitKey,
  FeeDiagramDisplayConfig,
  HqCommissionRiskConfig,
  SymbolFeeCurrency,
  SymbolFeeTierPolicy,
  SymbolFeeTierRow,
  SymbolFeeTiersByCustomerType,
  TransactionFees,
} from '../constants/hq-policy';
import {
  DEFAULT_FEE_DIAGRAM_DISPLAY,
  HQ_CONFIG_KEYS,
  SYMBOL_FEE_CURRENCIES,
  defaultGasNetworksByAsset,
  gasFeeUsdtForNetwork,
  gasNetworkPolicyForAsset,
  normalizeFeeBillingPresentation,
  normalizeGasNetworksByAsset,
  normalizeHqUsdtRiskLimitTiers,
} from '../constants/hq-policy';
import { mergeLiveFeesWithSandboxBasic, sandboxBasicDeltas, applySandboxGasDelta } from '../lib/sandbox-fee-merge';
import { computeFeeAmounts, normalizeTransactionFees } from '../lib/fee-component';
import { prisma } from '../lib/prisma';
import {
  cardChargeLimitsFromPolicy,
  normalizeMethodTransactionLimits,
} from '../lib/transaction-limit-policy';
import { CustomerType } from '@prisma/client';
import type { SymbolFeeCurrency as FeeCur } from '../constants/hq-policy';

export function defaultTransactionFees(): TransactionFees {
  return normalizeTransactionFees();
}

const DEFAULT_THRESHOLDS: Record<SymbolFeeCurrency, number[]> = {
  KRW: [1_000_000, 10_000_000, 999_999_999_999],
  JPY: [100_000, 1_000_000, 99_999_999_999],
  THB: [50_000, 500_000, 99_999_999_999],
  CNY: [10_000, 100_000, 99_999_999_999],
  USD: [1_000, 10_000, 99_999_999_999],
  EUR: [1_000, 10_000, 99_999_999_999],
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

function cloneFeeTiersWithPrefix(tiers: SymbolFeeTierPolicy, prefix: string): SymbolFeeTierPolicy {
  return tiers.map((row, index) => ({
    ...row,
    id: `${prefix}-${row.currency}-${row.maxAmount}-${index}`,
  }));
}

/** 레거시 단일 배열 → 법인 유지 + 개인 복제. 객체면 개인/법인 각각 정규화 */
export function normalizeSymbolFeeTiersByCustomerType(raw: unknown): SymbolFeeTiersByCustomerType {
  if (Array.isArray(raw)) {
    const corporate = normalizeSymbolFeeTiers(raw);
    return {
      CORPORATE: corporate,
      INDIVIDUAL: cloneFeeTiersWithPrefix(corporate, 'indiv'),
    };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const corporate = normalizeSymbolFeeTiers(obj.CORPORATE ?? obj.corporate);
    const individualRaw = obj.INDIVIDUAL ?? obj.individual;
    const individual =
      Array.isArray(individualRaw) && individualRaw.length > 0
        ? normalizeSymbolFeeTiers(individualRaw)
        : cloneFeeTiersWithPrefix(corporate, 'indiv');
    return { CORPORATE: corporate, INDIVIDUAL: individual };
  }
  const defaults = defaultSymbolFeeTiers();
  return {
    CORPORATE: defaults,
    INDIVIDUAL: cloneFeeTiersWithPrefix(defaults, 'indiv'),
  };
}

export function feeTiersForCustomerType(
  byType: SymbolFeeTiersByCustomerType,
  customerType: CustomerTypeLimitKey = 'CORPORATE',
): SymbolFeeTierPolicy {
  const rows = byType[customerType];
  return rows?.length ? rows : byType.CORPORATE;
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
  showTotalFeeFallback = true,
): FeeDiagramDisplayConfig {
  const showTotalFee =
    typeof raw?.showTotalFee === 'boolean' ? raw.showTotalFee : showTotalFeeFallback;
  return {
    ...DEFAULT_FEE_DIAGRAM_DISPLAY,
    ...raw,
    showTotalFee,
    defaultFeeBillingMethod: normalizeFeeBillingPresentation(
      raw?.defaultFeeBillingMethod ?? DEFAULT_FEE_DIAGRAM_DISPLAY.defaultFeeBillingMethod,
    ),
  };
}

function buildNormalizedRisk(
  raw: Partial<HqCommissionRiskConfig>,
  cardSeed?: Partial<Record<FeeCur, { min?: number; max?: number }>>,
): HqCommissionRiskConfig {
  const maxTicket = raw.maxTicketAmountKrw ?? 100_000_000;
  const methodLimits = normalizeMethodTransactionLimits(
    raw.methodTransactionLimits,
    raw.transactionLimits,
    maxTicket,
    cardSeed,
  );
  return normalizeCommissionRiskCore(raw, methodLimits);
}

/** 동기 정규화 — CARD 시드 없이 legacy/method raw만 사용 */
export function normalizeCommissionRisk(
  raw: Partial<HqCommissionRiskConfig>,
): HqCommissionRiskConfig {
  return buildNormalizedRisk(raw);
}

function normalizeCommissionRiskCore(
  raw: Partial<HqCommissionRiskConfig>,
  methodLimits: ReturnType<typeof normalizeMethodTransactionLimits>,
): HqCommissionRiskConfig {
  const defaults = defaultTransactionFees();
  const transfer = raw.defaultTransferFeeUsdt ?? raw.defaultPlatformFeeUsdt ?? defaults.transferFeeUsdt;
  const showTotalFee = raw.showTotalFee !== false;
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
    showTotalFee,
    feeDiagramDisplay: normalizeFeeDiagramDisplay(raw.feeDiagramDisplay, showTotalFee),
    sandboxFeeDiagramDisplay: normalizeFeeDiagramDisplay(
      raw.sandboxFeeDiagramDisplay ?? raw.feeDiagramDisplay,
      showTotalFee,
    ),
    hqFeeDiagramDisplay: normalizeFeeDiagramDisplay(
      raw.hqFeeDiagramDisplay ?? DEFAULT_FEE_DIAGRAM_DISPLAY,
      true,
    ),
    hqSandboxFeeDiagramDisplay: normalizeFeeDiagramDisplay(
      raw.hqSandboxFeeDiagramDisplay ?? raw.hqFeeDiagramDisplay ?? DEFAULT_FEE_DIAGRAM_DISPLAY,
      true,
    ),
    maxTicketAmountKrw: raw.maxTicketAmountKrw ?? 100_000_000,
    riskEnabled: raw.riskEnabled ?? true,
    maxDailyTicketsPerCustomer: raw.maxDailyTicketsPerCustomer ?? 10,
    transactionLimits: methodLimits.BANK_TRANSFER,
    methodTransactionLimits: methodLimits,
    usdtRiskLimitTiers: normalizeHqUsdtRiskLimitTiers(raw.usdtRiskLimitTiers),
    notes: raw.notes ?? '',
  };
}

export async function getCommissionRiskConfig(): Promise<HqCommissionRiskConfig> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.commissionRisk },
  });
  /** HQ 리스크 화면과 동일 정규화. 구 결제관리 card.limits 시드는 쓰지 않음. */
  return normalizeCommissionRisk((row?.value ?? {}) as Partial<HqCommissionRiskConfig>);
}

export async function getSymbolFeeTiersByCustomerType(): Promise<SymbolFeeTiersByCustomerType> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.feeTiers },
  });
  return normalizeSymbolFeeTiersByCustomerType(row?.value);
}

/** @deprecated 법인 구간. 신규 코드는 getSymbolFeeTiersByCustomerType / feeTiersForCustomerType 사용 */
export async function getSymbolFeeTiers(
  customerType: CustomerTypeLimitKey = 'CORPORATE',
): Promise<SymbolFeeTierPolicy> {
  const byType = await getSymbolFeeTiersByCustomerType();
  return feeTiersForCustomerType(byType, customerType);
}

export async function resolveFeeCustomerTypeKey(
  customerProfileId?: string | null,
  fallback: CustomerTypeLimitKey = 'CORPORATE',
): Promise<CustomerTypeLimitKey> {
  if (!customerProfileId) return fallback;
  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: { customerType: true },
  });
  if (!profile) return fallback;
  return profile.customerType === CustomerType.CORPORATE ? 'CORPORATE' : 'INDIVIDUAL';
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
export type FeeDiagramAudience = 'customer' | 'hq';

export async function getFeeDiagramDisplay(
  scope: FeePolicyScope = 'live',
  audience: FeeDiagramAudience = 'customer',
): Promise<FeeDiagramDisplayConfig> {
  const risk = await getCommissionRiskConfig();
  if (audience === 'hq') {
    const diagram =
      scope === 'sandbox'
        ? risk.hqSandboxFeeDiagramDisplay ?? risk.hqFeeDiagramDisplay
        : risk.hqFeeDiagramDisplay;
    return normalizeFeeDiagramDisplay(diagram ?? DEFAULT_FEE_DIAGRAM_DISPLAY, true);
  }
  const showTotalFee = risk.showTotalFee !== false;
  const diagram =
    scope === 'sandbox'
      ? risk.sandboxFeeDiagramDisplay ?? risk.feeDiagramDisplay
      : risk.feeDiagramDisplay;
  return normalizeFeeDiagramDisplay(diagram, showTotalFee);
}

/** 고객·본사 기본을 반영한 도식 표시 설정 (billingMethod·showTotalFee 해석 포함) */
export async function getFeeDiagramDisplayForCustomer(
  customerProfileId?: string | null,
  scope: FeePolicyScope = 'live',
  audience: FeeDiagramAudience = 'customer',
): Promise<FeeDiagramDisplayConfig> {
  const base = await getFeeDiagramDisplay(scope, audience);
  if (audience === 'hq') {
    return {
      ...base,
      billingMethod: normalizeFeeBillingPresentation(base.defaultFeeBillingMethod),
      showTotalFee: base.showTotalFee !== false,
    };
  }
  const hqBilling = normalizeFeeBillingPresentation(base.defaultFeeBillingMethod);
  let showTotalFee = base.showTotalFee !== false;
  let billingMethod = hqBilling;

  if (customerProfileId) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: customerProfileId },
      select: { feeBillingMethod: true, totalFeeVisibility: true },
    });
    if (scope !== 'sandbox') {
      const method = profile?.feeBillingMethod;
      billingMethod =
        !method || method === 'FOLLOW_HQ'
          ? hqBilling
          : normalizeFeeBillingPresentation(method);
    }
    const vis = profile?.totalFeeVisibility;
    if (vis === 'SHOW') showTotalFee = true;
    else if (vis === 'HIDE') showTotalFee = false;
  }

  return { ...base, billingMethod, showTotalFee };
}

export async function getGasNetworksByAsset() {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.gasNetworks },
  });
  return normalizeGasNetworksByAsset(row?.value ?? defaultGasNetworksByAsset());
}

/** @param asset settlement / wallet asset — USDC uses USDC network table (no TRC20) */
export async function getGasNetworkPolicy(asset?: string | null) {
  const full = await getGasNetworksByAsset();
  return gasNetworkPolicyForAsset(full, asset === 'USDC' ? 'USDC' : 'USDT');
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
  assetType?: unknown;
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

export type ResolveFeesForAmountOptions = {
  feePolicy?: FeePolicyScope;
  customerType?: CustomerTypeLimitKey;
  customerProfileId?: string | null;
};

/** 통화·금액 구간 수수료 → 지갑 오버라이드 적용 (고객유형별 구간) */
export async function resolveFeesForAmount(
  wallet: WalletFeeSource,
  currency: string,
  fiatAmount: number,
  options?: ResolveFeesForAmountOptions,
): Promise<TransactionFees> {
  const sandbox = options?.feePolicy === 'sandbox';
  const customerType =
    options?.customerType ??
    (await resolveFeeCustomerTypeKey(options?.customerProfileId, 'CORPORATE'));
  const walletAsset = String(wallet.assetType ?? '') === 'USDC' ? 'USDC' : 'USDT';
  const [liveTiers, gasPolicy] = await Promise.all([
    getSymbolFeeTiers(customerType),
    getGasNetworkPolicy(walletAsset),
  ]);
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

export async function gasFeeUsdtForWalletNetwork(
  network: string | null | undefined,
  asset?: string | null,
): Promise<number> {
  const [policy, hq] = await Promise.all([
    getGasNetworkPolicy(asset),
    getHqTransactionFees(),
  ]);
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
