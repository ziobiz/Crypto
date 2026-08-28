'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import type { HqCommissionRiskConfig, SymbolFeeCurrency, SymbolFeeTierRow } from '@/lib/api';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { formatAmountInput } from '@/lib/format';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { FeeDualInput } from '@/components/policy/FeeDualInput';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import {
  defaultTierForCurrency,
  FEE_CURRENCIES,
  sortedTierIds,
} from '@/components/hq-policy/symbol-fee-tier-utils';

type SymbolFeeTierEditorProps = {
  tiers: SymbolFeeTierRow[];
  onTiersChange: (tiers: SymbolFeeTierRow[]) => void;
  risk: HqCommissionRiskConfig;
  onSaveTiers: () => void | Promise<void>;
  savingTiers?: boolean;
  tiersMsg?: string;
  saveLabelKey?: 'hq.commission.saveTiers' | 'hq.commission.saveSimulatorTiers';
};

export function SymbolFeeTierEditor({
  tiers,
  onTiersChange,
  risk,
  onSaveTiers,
  savingTiers = false,
  tiersMsg = '',
  saveLabelKey = 'hq.commission.saveTiers',
}: SymbolFeeTierEditorProps) {
  const t = useT();
  const [feeCurrency, setFeeCurrency] = useState<SymbolFeeCurrency>('KRW');
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<SymbolFeeTierRow | null>(null);
  const [tierDisplayOrder, setTierDisplayOrder] = useState<string[]>([]);
  const [localMsg, setLocalMsg] = useState('');

  const currencyTiers = useMemo(() => {
    const byId = new Map(
      tiers.filter((row) => row.currency === feeCurrency).map((row) => [row.id, row]),
    );
    return tierDisplayOrder
      .map((id) => {
        const row = byId.get(id);
        if (!row) return null;
        if (editingTierId === id && tierDraft) return tierDraft;
        return row;
      })
      .filter((row): row is SymbolFeeTierRow => row != null);
  }, [tiers, feeCurrency, tierDisplayOrder, editingTierId, tierDraft]);

  useEffect(() => {
    if (!editingTierId) {
      setTierDisplayOrder(sortedTierIds(feeCurrency, tiers));
    }
  }, [tiers, feeCurrency, editingTierId]);

  function cancelTierEdit() {
    setEditingTierId(null);
    setTierDraft(null);
    setLocalMsg('');
  }

  function startTierEdit(row: SymbolFeeTierRow) {
    if (editingTierId) return;
    setTierDisplayOrder(sortedTierIds(feeCurrency, tiers));
    setEditingTierId(row.id);
    setTierDraft({ ...row });
    setLocalMsg('');
  }

  function updateTierDraft(patch: Partial<SymbolFeeTierRow>) {
    setTierDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function saveTierEdit() {
    if (!tierDraft) return;
    if (tierDraft.maxAmount < 1) {
      setLocalMsg(t('hq.commission.tierMaxAmountInvalid'));
      return;
    }
    onTiersChange(tiers.map((row) => (row.id === tierDraft.id ? tierDraft : row)));
    cancelTierEdit();
  }

  function addTier() {
    if (editingTierId) return;
    onTiersChange([...tiers, defaultTierForCurrency(feeCurrency, risk)]);
  }

  function removeTier(id: string) {
    if (editingTierId) return;
    onTiersChange(tiers.filter((row) => row.id !== id));
  }

  const displayMsg = tiersMsg || localMsg;

  return (
    <div className="space-y-3">
      <p className="pg-label">{t('hq.commission.simulatorTierSection')}</p>
      <div className="pg-segment-bar">
        {FEE_CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              if (feeCurrency !== c) cancelTierEdit();
              setFeeCurrency(c);
            }}
            className={`pg-subtab ${feeCurrency === c ? 'pg-subtab-active' : 'pg-subtab-idle'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="pg-hint">{t('hq.commission.tierTableDesc')}</p>
      <p className="pg-callout pg-callout-muted">{t('hq.commission.feeDualHint')}</p>
      <p className="pg-callout pg-callout-muted">{t('hq.commission.tierEditHint')}</p>

      <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('hq.commission.tierCurrency')}</th>
              <th>{t('hq.commission.tierMaxAmount')}</th>
              <th>{t('hq.commission.fxFee')}</th>
              <th>{t('hq.commission.transferFee')}</th>
              <th>{t('hq.commission.otherFee')}</th>
              <th>{t('hq.commission.tierActions')}</th>
            </tr>
          </thead>
          <tbody>
            {currencyTiers.map((row) => {
              const isEditing = editingTierId === row.id;
              const rowLocked = editingTierId !== null && !isEditing;
              return (
                <tr key={row.id} className={isEditing ? 'pg-row-edit' : undefined}>
                  <td className="font-mono">{row.currency}</td>
                  <td>
                    {isEditing ? (
                      <FormattedAmountInput
                        min={1}
                        commitOnBlur
                        value={row.maxAmount}
                        onChange={(maxAmount) => updateTierDraft({ maxAmount })}
                        className="pg-input min-w-[8rem]"
                      />
                    ) : (
                      <PolicyCellValue>{formatAmountInput(row.maxAmount)}</PolicyCellValue>
                    )}
                  </td>
                  <td>
                    <FeeDualInput
                      feeKey="fx"
                      fees={row}
                      editing={isEditing}
                      onChange={(patch) => updateTierDraft(patch)}
                    />
                  </td>
                  <td>
                    <FeeDualInput
                      feeKey="transfer"
                      fees={row}
                      editing={isEditing}
                      onChange={(patch) => updateTierDraft(patch)}
                    />
                  </td>
                  <td>
                    <FeeDualInput
                      feeKey="other"
                      fees={row}
                      editing={isEditing}
                      onChange={(patch) => updateTierDraft(patch)}
                    />
                  </td>
                  <td>
                    <PolicyTableActions>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={saveTierEdit}
                            className="pg-btn pg-btn-primary text-xs"
                          >
                            {t('hq.commission.tierSaveRow')}
                          </button>
                          <button
                            type="button"
                            onClick={cancelTierEdit}
                            className="pg-btn pg-btn-secondary text-xs"
                          >
                            {t('hq.commission.tierCancelEdit')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startTierEdit(row)}
                            disabled={rowLocked}
                            className="pg-btn pg-btn-secondary text-xs disabled:opacity-40"
                          >
                            {t('hq.commission.tierEdit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTier(row.id)}
                            disabled={rowLocked}
                            className="pg-btn pg-btn-secondary text-xs text-red-600 disabled:opacity-40"
                          >
                            {t('hq.commission.tierRemove')}
                          </button>
                        </>
                      )}
                    </PolicyTableActions>
                  </td>
                </tr>
              );
            })}
            {currencyTiers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center pg-hint">
                  {t('hq.commission.tierEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addTier}
          disabled={editingTierId !== null}
          className="pg-btn pg-btn-secondary disabled:opacity-40"
        >
          {t('hq.commission.tierAdd')}
        </button>
        <button
          type="button"
          onClick={() => void onSaveTiers()}
          disabled={savingTiers || editingTierId !== null}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {savingTiers ? t('hq.saving') : t(saveLabelKey)}
        </button>
        {displayMsg && <span className="pg-hint">{displayMsg}</span>}
      </div>
    </div>
  );
}
