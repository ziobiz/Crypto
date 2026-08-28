'use client';

import { useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import type { HqCommissionRiskConfig, HqGasNetworkPolicy, SymbolFeeCurrency, SymbolFeeTierRow } from '@/lib/api';
import { formatAmountInput } from '@/lib/format';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import {
  formatSandboxFeeCell,
  formatSandboxGasCell,
  sandboxBasicDeltas,
} from '@/lib/sandbox-fee-merge';
import { FEE_CURRENCIES, sortedTierIds } from '@/components/hq-policy/symbol-fee-tier-utils';
import type { MessageKey } from '@/i18n/messages';

type SimulatorSandboxFeePreviewProps = {
  liveTiers: SymbolFeeTierRow[];
  sandboxRisk: HqCommissionRiskConfig;
  gasNetworks: HqGasNetworkPolicy | null;
};

export function SimulatorSandboxFeePreview({
  liveTiers,
  sandboxRisk,
  gasNetworks,
}: SimulatorSandboxFeePreviewProps) {
  const t = useT();
  const [feeCurrency, setFeeCurrency] = useState<SymbolFeeCurrency>('KRW');
  const deltas = useMemo(() => sandboxBasicDeltas(sandboxRisk), [sandboxRisk]);

  const currencyTiers = useMemo(() => {
    const order = sortedTierIds(feeCurrency, liveTiers);
    const byId = new Map(
      liveTiers.filter((row) => row.currency === feeCurrency).map((row) => [row.id, row]),
    );
    return order
      .map((id) => byId.get(id))
      .filter((row): row is SymbolFeeTierRow => row != null);
  }, [liveTiers, feeCurrency]);

  const activeGasGroup = gasNetworks?.activeGroup ?? 'DEFAULT';
  const gasRows = gasNetworks?.networks ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="pg-label">{t('hq.commission.simulatorTierSection')}</p>
        <p className="pg-hint">{t('hq.commission.simulatorTierPreviewDesc')}</p>
        <p className="pg-callout pg-callout-muted">{t('hq.commission.simulatorTierPreviewHint')}</p>

        <div className="pg-segment-bar">
          {FEE_CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFeeCurrency(c)}
              className={`pg-subtab ${feeCurrency === c ? 'pg-subtab-active' : 'pg-subtab-idle'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="pg-card pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('hq.commission.tierCurrency')}</th>
                <th>{t('hq.commission.tierMaxAmount')}</th>
                <th>{t('hq.commission.fxFee')}</th>
                <th>{t('hq.commission.transferFee')}</th>
                <th>{t('hq.commission.otherFee')}</th>
              </tr>
            </thead>
            <tbody>
              {currencyTiers.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono">{row.currency}</td>
                  <td>
                    <PolicyCellValue>{formatAmountInput(row.maxAmount)}</PolicyCellValue>
                  </td>
                  <td>
                    <PolicyCellValue>{formatSandboxFeeCell(row, deltas, 'fx')}</PolicyCellValue>
                  </td>
                  <td>
                    <PolicyCellValue>{formatSandboxFeeCell(row, deltas, 'transfer')}</PolicyCellValue>
                  </td>
                  <td>
                    <PolicyCellValue>{formatSandboxFeeCell(row, deltas, 'other')}</PolicyCellValue>
                  </td>
                </tr>
              ))}
              {currencyTiers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center pg-hint">
                    {t('hq.commission.tierEmpty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {gasRows.length > 0 && (
        <div className="space-y-3">
          <p className="pg-label">{t('hq.commission.simulatorGasSection')}</p>
          <p className="pg-hint">{t('hq.commission.simulatorGasPreviewDesc')}</p>
          <div className="pg-card pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('wallets.col.network')}</th>
                  <th>{t('hq.commission.gasFee')}</th>
                </tr>
              </thead>
              <tbody>
                {gasRows.map((row) => {
                  const networkGas = Number(row.fees[activeGasGroup]) || 0;
                  return (
                    <tr key={row.code}>
                      <td>{t(`network.${row.code}` as MessageKey)}</td>
                      <td>
                        <PolicyCellValue>
                          {formatSandboxGasCell(networkGas, deltas.gasUsdt)}
                        </PolicyCellValue>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
