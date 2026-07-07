'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqCardPaymentConfig, type SymbolFeeCurrency } from '@/lib/api';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { IcopayConfigPanel } from '@/components/hq-policy/IcopayConfigPanel';

const CURRENCIES: SymbolFeeCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'USD'];

const DEFAULT_CONFIG: HqCardPaymentConfig = {
  enabled: false,
  cardFeePercent: 3.5,
  limits: {
    KRW: { min: 10000, max: 5000000 },
    JPY: { min: 1000, max: 500000 },
    THB: { min: 500, max: 200000 },
    CNY: { min: 100, max: 50000 },
    USD: { min: 10, max: 10000 },
  },
};

export default function HqPaymentManagementPage() {
  const t = useT();
  const [config, setConfig] = useState<HqCardPaymentConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);

  useEffect(() => {
    hqPolicyApi
      .getCardPayment()
      .then((r) => setConfig({ ...DEFAULT_CONFIG, ...r.config, limits: { ...DEFAULT_CONFIG.limits, ...r.config.limits } }))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function save() {
    setSaving(true);
    setMsg('');
    setConfirmSave(false);
    try {
      const next = await hqPolicyApi.saveCardPayment(config);
      setConfig(next.config);
      setMsg(t('hq.payment.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function requestSave() {
    if (config.enabled) {
      setConfirmSave(true);
      return;
    }
    void save();
  }

  function setLimit(currency: SymbolFeeCurrency, field: 'min' | 'max', value: number) {
    setConfig((c) => ({
      ...c,
      limits: {
        ...c.limits,
        [currency]: { ...c.limits[currency], [field]: value },
      },
    }));
  }

  return (
    <div className="pg-stack">
      <p className="text-[13px] text-gray-600">{t('hq.payment.desc')}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.payment.title')}</div>
        <div className="pg-card-body space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            {t('hq.payment.enabled')}
          </label>

          <div className="max-w-xs">
            <label className="pg-label">{t('hq.payment.cardFeePercent')}</label>
            <PolicyNumberInput
              value={config.cardFeePercent}
              onChange={(v) => setConfig({ ...config, cardFeePercent: v })}
              className="pg-input mt-1 w-full"
            />
          </div>

          <div className="pg-table-wrap">
            <table className="pg-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t('usdt.col.currency')}</th>
                  <th>{t('hq.payment.min')}</th>
                  <th>{t('hq.payment.max')}</th>
                </tr>
              </thead>
              <tbody>
                {CURRENCIES.map((currency) => (
                  <tr key={currency}>
                    <td className="font-medium">{currency}</td>
                    <td>
                      <FormattedAmountInput
                        min={0}
                        commitOnBlur
                        value={config.limits[currency]?.min ?? 0}
                        onChange={(v) => setLimit(currency, 'min', v)}
                        className="pg-input w-full min-w-[8rem]"
                      />
                    </td>
                    <td>
                      <FormattedAmountInput
                        min={0}
                        commitOnBlur
                        value={config.limits[currency]?.max ?? 0}
                        onChange={(v) => setLimit(currency, 'max', v)}
                        className="pg-input w-full min-w-[8rem]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PolicyTableActions>
            <button type="button" onClick={requestSave} disabled={saving} className="pg-btn pg-btn-primary">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </PolicyTableActions>

          {confirmSave && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">{t('hq.payment.saveConfirmTitle')}</p>
              <p className="mt-2 whitespace-pre-line text-xs text-amber-900">{t('hq.payment.saveConfirmBody')}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSave(false)}
                  className="flex-1 rounded border border-gray-200 bg-white py-2 text-xs text-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="flex-1 rounded bg-amber-600 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {t('hq.payment.saveConfirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <IcopayConfigPanel />
    </div>
  );
}
