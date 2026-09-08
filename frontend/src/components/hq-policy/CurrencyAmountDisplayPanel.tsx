'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  CURRENCY_AMOUNT_DISPLAY_CURRENCIES,
  defaultCurrencyAmountDisplayPolicy,
  normalizeCurrencyAmountDisplayPolicy,
  type CurrencyRoundingMode,
  type HqCurrencyAmountDisplayPolicy,
} from '@/lib/currency-amount';
import type { MessageKey } from '@/i18n/messages';

const ROUNDING_OPTIONS: CurrencyRoundingMode[] = ['CEIL', 'FLOOR', 'ROUND'];
const DECIMAL_OPTIONS = [0, 1, 2, 3, 4];

type Props = {
  value: HqCurrencyAmountDisplayPolicy | null | undefined;
  onSave: (policy: HqCurrencyAmountDisplayPolicy) => Promise<void>;
  saving?: boolean;
};

export function CurrencyAmountDisplayPanel({ value, onSave, saving }: Props) {
  const t = useT();
  const [policy, setPolicy] = useState<HqCurrencyAmountDisplayPolicy>(
    () => normalizeCurrencyAmountDisplayPolicy(value ?? defaultCurrencyAmountDisplayPolicy()),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [draftDecimals, setDraftDecimals] = useState(0);
  const [draftRounding, setDraftRounding] = useState<CurrencyRoundingMode>('CEIL');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setPolicy(normalizeCurrencyAmountDisplayPolicy(value ?? defaultCurrencyAmountDisplayPolicy()));
  }, [value]);

  const startEdit = (code: string) => {
    const rule = policy.byCurrency[code] ?? policy.default;
    setEditing(code);
    setDraftDecimals(rule.decimals);
    setDraftRounding(rule.rounding);
    setMsg('');
  };

  const saveRow = async (code: string) => {
    const next: HqCurrencyAmountDisplayPolicy = {
      ...policy,
      byCurrency: {
        ...policy.byCurrency,
        [code]: { decimals: draftDecimals, rounding: draftRounding },
      },
    };
    setPolicy(next);
    setEditing(null);
    try {
      await onSave(next);
      setMsg(t('hq.currencyAmount.saved'));
    } catch {
      setMsg(t('hq.currencyAmount.saveFailed'));
    }
  };

  const resetToDefault = async (code: string) => {
    const next: HqCurrencyAmountDisplayPolicy = {
      ...policy,
      byCurrency: {
        ...policy.byCurrency,
        [code]: { ...policy.default },
      },
    };
    setPolicy(next);
    setEditing(null);
    try {
      await onSave(next);
      setMsg(t('hq.currencyAmount.saved'));
    } catch {
      setMsg(t('hq.currencyAmount.saveFailed'));
    }
  };

  const saveGlobal = async () => {
    try {
      await onSave(policy);
      setMsg(t('hq.currencyAmount.saved'));
    } catch {
      setMsg(t('hq.currencyAmount.saveFailed'));
    }
  };

  const roundingLabel = (mode: CurrencyRoundingMode): MessageKey =>
    mode === 'CEIL'
      ? 'hq.currencyAmount.rounding.CEIL'
      : mode === 'FLOOR'
        ? 'hq.currencyAmount.rounding.FLOOR'
        : 'hq.currencyAmount.rounding.ROUND';

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.currencyAmount.title')}</div>
      <div className="pg-card-body space-y-4">
        <p className="pg-hint text-xs">{t('hq.currencyAmount.desc')}</p>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="pg-label mb-2">{t('hq.currencyAmount.globalTitle')}</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-xs">
              <span className="pg-muted">{t('hq.currencyAmount.decimals')}</span>
              <select
                className="pg-select mt-1"
                value={policy.default.decimals}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    default: { ...policy.default, decimals: Number(e.target.value) },
                  })
                }
              >
                {DECIMAL_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="pg-muted">{t('hq.currencyAmount.rounding')}</span>
              <select
                className="pg-select mt-1"
                value={policy.default.rounding}
                onChange={(e) =>
                  setPolicy({
                    ...policy,
                    default: {
                      ...policy.default,
                      rounding: e.target.value as CurrencyRoundingMode,
                    },
                  })
                }
              >
                {ROUNDING_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t(roundingLabel(m))}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="pg-btn pg-btn-primary"
              disabled={saving}
              onClick={() => void saveGlobal()}
            >
              {saving ? t('hq.saving') : t('hq.currencyAmount.saveGlobal')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="pg-table text-sm">
            <thead>
              <tr>
                <th>{t('hq.currencyAmount.col.currency')}</th>
                <th>{t('hq.currencyAmount.decimals')}</th>
                <th>{t('hq.currencyAmount.rounding')}</th>
                <th className="text-center align-middle">{t('hq.currencyAmount.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {CURRENCY_AMOUNT_DISPLAY_CURRENCIES.map((code) => {
                const rule = policy.byCurrency[code] ?? policy.default;
                const isEdit = editing === code;
                return (
                  <tr key={code}>
                    <td className="font-semibold">{code}</td>
                    <td>
                      {isEdit ? (
                        <select
                          className="pg-select"
                          value={draftDecimals}
                          onChange={(e) => setDraftDecimals(Number(e.target.value))}
                        >
                          {DECIMAL_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      ) : (
                        rule.decimals
                      )}
                    </td>
                    <td>
                      {isEdit ? (
                        <select
                          className="pg-select"
                          value={draftRounding}
                          onChange={(e) => setDraftRounding(e.target.value as CurrencyRoundingMode)}
                        >
                          {ROUNDING_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {t(roundingLabel(m))}
                            </option>
                          ))}
                        </select>
                      ) : (
                        t(roundingLabel(rule.rounding))
                      )}
                    </td>
                    <td className="align-middle text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {isEdit ? (
                          <>
                            <button
                              type="button"
                              className="pg-btn pg-btn-primary text-xs"
                              disabled={saving}
                              onClick={() => void saveRow(code)}
                            >
                              {t('hq.currencyAmount.saveRow')}
                            </button>
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary text-xs"
                              onClick={() => setEditing(null)}
                            >
                              {t('hq.currencyAmount.cancel')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="pg-btn pg-btn-secondary text-xs"
                            onClick={() => startEdit(code)}
                          >
                            {t('hq.currencyAmount.edit')}
                          </button>
                        )}
                        <button
                          type="button"
                          className="pg-btn pg-btn-secondary text-xs"
                          disabled={saving}
                          onClick={() => void resetToDefault(code)}
                        >
                          {t('hq.currencyAmount.useGlobal')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {msg && <p className="text-xs text-emerald-700">{msg}</p>}
      </div>
    </div>
  );
}
