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
import { prisma } from '../lib/prisma';
import { normalizeTransactionLimits } from '../lib/transaction-limit-policy';

export function defaultTransactionFees(): TransactionFees {
  return {
    fxFeePercent: 0.5,
    gasFeeUsdt: 1,
    transferFeeUsdt: 3,
    otherFeeUsdt: 2,
  };
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
        fxFeePercent: Math.max(0, Number((base.fxFeePercent - i * 0.05).toFixed(4))),
        gasFeeUsdt: base.gasFeeUsdt,
        transferFeeUsdt: base.transferFeeUsdt,
        otherFeeUsdt: base.otherFeeUsdt,
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
      fxFeePercent: Math.min(100, Math.max(0, Number(row.fxFeePercent) || 0)),
      gasFeeUsdt: Math.max(0, Number(row.gasFeeUsdt) || 0),
      transferFeeUsdt: Math.max(0, Number(row.transferFeeUsdt) || 0),
      otherFeeUsdt: Math.max(0, Number(row.otherFeeUsdt) || 0),
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
  return {
    fxFeePercent: tier.fxFeePercent,
    gasFeeUsdt: tier.gasFeeUsdt,
    transferFeeUsdt: tier.transferFeeUsdt,
    otherFeeUsdt: tier.otherFeeUsdt,
  };
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
    defaultGasFeeUsdt: raw.defaultGasFeeUsdt ?? defaults.gasFeeUsdt,
    defaultTransferFeeUsdt: transfer,
    defaultOtherFeeUsdt: raw.defaultOtherFeeUsdt ?? defaults.otherFeeUsdt,
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
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.commissionRisk },
  });
  const risk = normalizeCommissionRisk((row?.value ?? {}) as Partial<HqCommissionRiskConfig>);
  return {
    fxFeePercent: risk.defaultFxFeePercent,
    gasFeeUsdt: risk.defaultGasFeeUsdt,
    transferFeeUsdt: risk.defaultTransferFeeUsdt,
    otherFeeUsdt: risk.defaultOtherFeeUsdt,
  };
}

type WalletFeeSource = {
  fxFeePercent?: unknown;
  gasFeeAmount: unknown;
  transferFeeAmount?: unknown;
  otherFeeAmount?: unknown;
  platformFeeAmount?: unknown;
};

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

  return {
    fxFeePercent: walletFx > 0 ? walletFx : hq.fxFeePercent,
    gasFeeUsdt: walletGas > 0 ? walletGas : hq.gasFeeUsdt,
    transferFeeUsdt: walletTransfer > 0 ? walletTransfer : hq.transferFeeUsdt,
    otherFeeUsdt: walletOther > 0 ? walletOther : hq.otherFeeUsdt,
  };
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

export function totalFixedFeesUsdt(fees: TransactionFees): number {
  return fees.gasFeeUsdt + fees.transferFeeUsdt + fees.otherFeeUsdt;
}

/** 티켓 스냅샷 기준 총 수수료 풀 (USDT) */
export function commissionPoolFromSnapshots(detail: {
  fiatAmount: unknown;
  exchangeRate: unknown;
  fxFeePercentSnapshot?: unknown;
  gasFeeSnapshot: unknown;
  transferFeeSnapshot?: unknown;
  otherFeeSnapshot?: unknown;
  platformFeeSnapshot?: unknown;
}): number {
  const rate = Number(detail.exchangeRate);
  const gross = rate > 0 ? Number(detail.fiatAmount) / rate : 0;
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
