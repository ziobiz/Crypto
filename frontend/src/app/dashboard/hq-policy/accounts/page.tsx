'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type HqCurfexConfig,
  type HqPlatformConfig,
} from '@/lib/api';
import { DepositAccountsEditor } from '@/components/hq-policy/DepositAccountsEditor';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

type CollectionMode = 'FIXED' | 'VIRTUAL' | 'DIRECT';

const EMPTY_CURFEX: HqCurfexConfig = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  apiBaseUrl: 'https://fcol-dashboard-uat1.curfex.com',
  walletName: '',
  currencies: ['JPY'],
  sandbox: true,
  webhookSecret: '',
  autoApproveOnDeposit: true,
  defaultCollectionMode: 'FIXED',
  defaultCollectionModeCorporate: 'FIXED',
  defaultCollectionModeIndividual: 'DIRECT',
  directRemitCurrencies: ['USD', 'EUR'],
};

function modeOf(v: unknown, fallback: CollectionMode): CollectionMode {
  return v === 'VIRTUAL' || v === 'DIRECT' || v === 'FIXED' ? v : fallback;
}

function remitCurrenciesFromConfig(config: HqPlatformConfig): Array<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR'> {
  const all = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;
  const list = all.filter((c) => {
    const a = config.depositReceivingAccounts?.[c];
    if (!a) return false;
    if (a.remittanceEnabled === true) return true;
    if (a.remittanceEnabled === false) return false;
    return c === 'USD' || c === 'EUR';
  });
  return list.length ? [...list] : ['USD', 'EUR'];
}

export default function HqAccountsPage() {
  const t = useT();
  const [config, setConfig] = useState<HqPlatformConfig | null>(null);
  const [curfex, setCurfex] = useState<HqCurfexConfig>(EMPTY_CURFEX);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([hqPolicyApi.getPlatform(), hqPolicyApi.getCurfex()])
      .then(([platform, curfexRes]) => {
        setConfig(platform.config);
        const merged = { ...EMPTY_CURFEX, ...curfexRes.config };
        setCurfex({
          ...merged,
          defaultCollectionModeCorporate: modeOf(
            merged.defaultCollectionModeCorporate ?? merged.defaultCollectionMode,
            'FIXED',
          ),
          defaultCollectionModeIndividual: modeOf(
            merged.defaultCollectionModeIndividual,
            'DIRECT',
          ),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function saveAll() {
    if (!config) return;
    setSaving(true);
    setMsg('');
    try {
      const corporate = modeOf(curfex.defaultCollectionModeCorporate, 'FIXED');
      const individual = modeOf(curfex.defaultCollectionModeIndividual, 'DIRECT');
      const remit = remitCurrenciesFromConfig(config);
      const nextPlatform = await hqPolicyApi.savePlatform(config);
      setConfig(nextPlatform.config);
      const nextCurfex = await hqPolicyApi.saveCurfex({
        ...curfex,
        defaultCollectionMode: corporate,
        defaultCollectionModeCorporate: corporate,
        defaultCollectionModeIndividual: individual,
        directRemitCurrencies: remit,
      });
      setCurfex({ ...EMPTY_CURFEX, ...nextCurfex.config });
      setMsg(t('hq.accounts.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="pg-hint text-red-600">{error}</p>;
  }
  if (!config) {
    return <p className="pg-hint">{t('common.loading')}</p>;
  }

  const corporate = modeOf(curfex.defaultCollectionModeCorporate ?? curfex.defaultCollectionMode, 'FIXED');
  const individual = modeOf(curfex.defaultCollectionModeIndividual, 'DIRECT');

  return (
    <div className="space-y-6">
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.accounts.modeDefaults')}</div>
        <div className="pg-section-pad space-y-3">
          <p className="pg-hint">{t('hq.accounts.modeDefaultsHint')}</p>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 space-y-1">
            <p>{t('hq.accounts.modeLegendFixed')}</p>
            <p>{t('hq.accounts.modeLegendVirtual')}</p>
            <p>{t('hq.accounts.modeLegendRemit')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
            <label className="block">
              <span className="pg-label">{t('hq.accounts.defaultCorporate')}</span>
              <select
                className="pg-input mt-1 w-full"
                value={corporate}
                onChange={(e) =>
                  setCurfex({
                    ...curfex,
                    defaultCollectionModeCorporate: modeOf(e.target.value, 'FIXED'),
                    defaultCollectionMode: modeOf(e.target.value, 'FIXED'),
                  })
                }
              >
                <option value="FIXED">{t('collectionMode.FIXED')}</option>
                <option value="DIRECT">{t('collectionMode.DIRECT')}</option>
                <option value="VIRTUAL">{t('collectionMode.VIRTUAL')}</option>
              </select>
            </label>
            <label className="block">
              <span className="pg-label">{t('hq.accounts.defaultIndividual')}</span>
              <select
                className="pg-input mt-1 w-full"
                value={individual}
                onChange={(e) =>
                  setCurfex({
                    ...curfex,
                    defaultCollectionModeIndividual: modeOf(e.target.value, 'DIRECT'),
                  })
                }
              >
                <option value="FIXED">{t('collectionMode.FIXED')}</option>
                <option value="DIRECT">{t('collectionMode.DIRECT')}</option>
                <option value="VIRTUAL">{t('collectionMode.VIRTUAL')}</option>
              </select>
              <span className="mt-1 block text-[11px] text-gray-500">
                {t('hq.accounts.defaultIndividualHint')}
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.platform.depositAccounts')}</div>
        <div className="pg-section-pad space-y-4">
          <DepositAccountsEditor config={config} setConfig={setConfig} />
          <p className="text-[11px] text-amber-900">{t('hq.accounts.remittanceLimitHint')}</p>
          <PolicyTableActions>
            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="pg-btn pg-btn-primary disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </PolicyTableActions>
          {msg && <p className="pg-hint">{msg}</p>}
        </div>
      </section>
    </div>
  );
}
