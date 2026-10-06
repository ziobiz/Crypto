'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqCardPaymentConfig } from '@/lib/api';
import { IcopayConfigPanel } from '@/components/hq-policy/IcopayConfigPanel';
import { CurfexConfigPanel } from '@/components/hq-policy/CurfexConfigPanel';

const DEFAULT_CONFIG: HqCardPaymentConfig = {
  enabled: false,
  cardFeePercent: 3.5,
  limits: {
    KRW: { min: 10000, max: 5000000 },
    JPY: { min: 1000, max: 500000 },
    THB: { min: 500, max: 200000 },
    CNY: { min: 100, max: 50000 },
    USD: { min: 10, max: 10000 },
    EUR: { min: 10, max: 10000 },
  },
};

export default function HqPaymentManagementPage() {
  const t = useT();
  const [config, setConfig] = useState<HqCardPaymentConfig>(DEFAULT_CONFIG);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);

  useEffect(() => {
    hqPolicyApi
      .getCardPayment()
      .then((r) =>
        setConfig({
          ...DEFAULT_CONFIG,
          ...r.config,
          limits: { ...DEFAULT_CONFIG.limits, ...r.config.limits },
        }),
      )
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function savePolicy() {
    setSavingPolicy(true);
    setMsg('');
    setConfirmSave(false);
    try {
      const next = await hqPolicyApi.saveCardPayment(config);
      setConfig({
        ...DEFAULT_CONFIG,
        ...next.config,
        limits: { ...DEFAULT_CONFIG.limits, ...next.config.limits },
      });
      setMsg(t('hq.payment.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingPolicy(false);
    }
  }

  function requestPolicySave() {
    if (config.enabled) {
      setConfirmSave(true);
      return;
    }
    void savePolicy();
  }

  return (
    <div className="pg-stack">
      <p className="text-[13px] text-gray-600">{t('hq.payment.desc')}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.payment.title')}</div>
        <div className="pg-card-body space-y-4">
          <p className="pg-hint">{t('hq.payment.policyHint')}</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            {t('hq.payment.enabled')}
          </label>
          <p className="pg-hint text-xs">{t('hq.payment.cardFeeMovedHint')}</p>
          <a href="/dashboard/hq-policy/commission" className="text-xs font-medium text-blue-600 hover:underline">
            {t('hq.cardFee.title')}
          </a>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestPolicySave}
              disabled={savingPolicy}
              className="pg-btn pg-btn-primary"
            >
              {savingPolicy ? t('common.saving') : t('hq.payment.savePolicy')}
            </button>
          </div>
          {confirmSave && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-sm font-medium text-amber-950">{t('hq.payment.saveConfirmTitle')}</p>
              <p className="whitespace-pre-line text-xs text-amber-900">{t('hq.payment.saveConfirmBody')}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSave(false)}
                  className="flex-1 rounded border border-slate-300 py-2 text-xs"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void savePolicy()}
                  disabled={savingPolicy}
                  className="flex-1 rounded bg-amber-600 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {t('hq.payment.saveConfirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.payment.limitsTitle')}</div>
        <div className="pg-card-body space-y-2">
          <p className="pg-hint">{t('hq.payment.limitsMovedToRisk')}</p>
          <p className="text-[12px] text-slate-600">{t('hq.payment.limitsIcopayNote')}</p>
          <a
            href="/dashboard/hq-policy/risk"
            className="inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            {t('hq.payment.limitsRiskLink')}
          </a>
        </div>
      </div>

      <IcopayConfigPanel />
      <CurfexConfigPanel />
    </div>
  );
}
