import type { HqCommissionRiskConfig, TransactionFees } from '@/lib/api';
import {
  formatFeeComponentLabel,
  readFeeComponent,
} from '@/lib/fee-component';

export type SandboxBasicDeltas = {
  fxPercent: number;
  gasUsdt: number;
  transferUsdt: number;
  otherUsdt: number;
};

export function sandboxBasicDeltas(risk: Partial<HqCommissionRiskConfig>): SandboxBasicDeltas {
  return {
    fxPercent: Math.max(0, Number(risk.defaultFxFeePercent) || 0),
    gasUsdt: Math.max(0, Number(risk.defaultGasFeeUsdt) || 0),
    transferUsdt: Math.max(0, Number(risk.defaultTransferFeeUsdt) || 0),
    otherUsdt: Math.max(0, Number(risk.defaultOtherFeeUsdt) || 0),
  };
}

export function mergeLiveFeesWithSandboxBasic(
  live: Partial<TransactionFees>,
  deltas: SandboxBasicDeltas,
): Partial<TransactionFees> {
  const fx = readFeeComponent(live, 'fx');
  const transfer = readFeeComponent(live, 'transfer');
  const other = readFeeComponent(live, 'other');
  const out: Partial<TransactionFees> = { ...live };

  if (deltas.fxPercent > 0 && fx.mode === 'percent') {
    out.fxFeeMode = 'percent';
    out.fxFeePercent = fx.percent + deltas.fxPercent;
  }

  if (deltas.transferUsdt > 0) {
    out.transferFeeMode = transfer.mode;
    if (transfer.mode === 'fixed') {
      out.transferFeeUsdt = transfer.fixedUsdt + deltas.transferUsdt;
    } else {
      out.transferFeePercent = transfer.percent;
      out.transferFeeUsdt = transfer.fixedUsdt + deltas.transferUsdt;
    }
  }

  if (deltas.otherUsdt > 0) {
    out.otherFeeMode = other.mode;
    out.otherFeePercent = other.percent;
    out.otherFeeUsdt = other.fixedUsdt + deltas.otherUsdt;
  }

  return out;
}

export function formatSandboxFeeCell(
  live: Partial<TransactionFees>,
  deltas: SandboxBasicDeltas,
  key: 'fx' | 'transfer' | 'other',
): string {
  const liveLabel = formatFeeComponentLabel(live, key);
  const combined = mergeLiveFeesWithSandboxBasic(live, deltas);
  const combinedLabel = formatFeeComponentLabel(combined, key);
  if (combinedLabel === liveLabel) return liveLabel;
  return `${combinedLabel} (${liveLabel})`;
}

export function formatSandboxGasCell(networkGasUsdt: number, gasDelta: number): string {
  const live = `${networkGasUsdt} USDT`;
  if (gasDelta <= 0) return live;
  return `${networkGasUsdt + gasDelta} USDT (${networkGasUsdt} USDT)`;
}
