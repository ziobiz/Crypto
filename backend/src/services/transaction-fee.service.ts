import type { HqCommissionRiskConfig, TransactionFees } from '../constants/hq-policy';
import { HQ_CONFIG_KEYS } from '../constants/hq-policy';
import { prisma } from '../lib/prisma';

export function defaultTransactionFees(): TransactionFees {
  return {
    fxFeePercent: 0.5,
    gasFeeUsdt: 1,
    transferFeeUsdt: 3,
    otherFeeUsdt: 2,
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
    defaultGasFeeUsdt: raw.defaultGasFeeUsdt ?? defaults.gasFeeUsdt,
    defaultTransferFeeUsdt: transfer,
    defaultOtherFeeUsdt: raw.defaultOtherFeeUsdt ?? defaults.otherFeeUsdt,
    maxTicketAmountKrw: raw.maxTicketAmountKrw ?? 100_000_000,
    riskEnabled: raw.riskEnabled ?? true,
    maxDailyTicketsPerCustomer: raw.maxDailyTicketsPerCustomer ?? 10,
    notes: raw.notes ?? '',
  };
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
