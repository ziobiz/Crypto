import type { HqCommissionRiskConfig, TransactionFees } from '../constants/hq-policy';
import { normalizeTransactionFees, readFeeComponent } from './fee-component';

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

/** LIVE tier/flat fees + Sandbox basic additive deltas */
export function mergeLiveFeesWithSandboxBasic(
  live: TransactionFees,
  deltas: SandboxBasicDeltas,
): TransactionFees {
  const out = normalizeTransactionFees({ ...live });
  const fx = readFeeComponent(live, 'fx');
  const transfer = readFeeComponent(live, 'transfer');
  const other = readFeeComponent(live, 'other');

  if (deltas.fxPercent > 0) {
    if (fx.mode === 'percent') {
      out.fxFeeMode = 'percent';
      out.fxFeePercent = fx.percent + deltas.fxPercent;
    } else {
      out.fxFeeMode = 'fixed';
      out.fxFeeUsdt = fx.fixedUsdt;
    }
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

  return normalizeTransactionFees(out);
}

export function applySandboxGasDelta(
  fees: TransactionFees,
  networkGasUsdt: number,
  gasDelta: number,
): TransactionFees {
  const base = gasDelta > 0 ? networkGasUsdt + gasDelta : networkGasUsdt;
  return normalizeTransactionFees({
    ...fees,
    gasFeeMode: 'fixed',
    gasFeePercent: 0,
    gasFeeUsdt: base,
  });
}
