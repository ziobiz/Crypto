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
} from '../constants/hq-policy';
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
  return { ...DEFAULT_FEE_DIAGRAM_DISPLAY, ...raw };
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

export async function getFeeDiagramDisplay(): Promise<FeeDiagramDisplayConfig> {
  const risk = await getCommissionRiskConfig();
  return risk.feeDiagramDisplay ?? normalizeFeeDiagramDisplay();
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
  const mode = hq[modeKey] as TransactionFees[typeof modeKey];
  if (mode === 'percent' && walletPercent > 0) {
    return { ...hq, [percentKey]: walletPercent };
  }
  if (mode === 'fixed' && walletFixed > 0) {
    return { ...hq, [fixedKey]: walletFixed };
  }
  return hq;
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
): Promise<TransactionFees> {
  const [tiers, hqFlat] = await Promise.all([getSymbolFeeTiers(), getHqTransactionFees()]);
  const tier = pickFeeTier(tiers, currency, fiatAmount);
  const hq = tier ? tierToTransactionFees(tier) : hqFlat;
  return resolveTransactionFees(wallet, hq);
}

export function totalFixedFeesUsdt(grossUsdt: number, fees: TransactionFees): number {
  const amounts = computeFeeAmounts(grossUsdt, fees);
  return amounts.gasFeeUsdt + amounts.transferFeeUsdt + amounts.otherFeeUsdt;
}

/** 티켓 스냅샷 기준 총 수수료 풀 (USDT) */
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
