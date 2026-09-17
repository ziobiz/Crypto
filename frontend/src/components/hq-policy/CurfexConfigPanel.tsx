'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqCurfexConfig } from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const CURFEX_CURRENCY_OPTIONS = ['JPY', 'KRW', 'THB', 'CNY'] as const;
type CurfexCurrency = (typeof CURFEX_CURRENCY_OPTIONS)[number];

const EMPTY: HqCurfexConfig = {
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
};

export function CurfexConfigPanel() {
  const t = useT();
  const [config, setConfig] = useState<HqCurfexConfig>(EMPTY);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [secretOnce, setSecretOnce] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCurfex()
      .then((r) => {
        const merged = { ...EMPTY, ...r.config };
        if (!merged.currencies?.length) merged.currencies = ['JPY'];
        setConfig(merged);
        if (r.webhookUrl) setWebhookUrl(r.webhookUrl);
      })
      .catch(console.error);
  }, []);

  function toggleCurrency(code: CurfexCurrency) {
    const current = (config.currencies?.length ? config.currencies : ['JPY']) as CurfexCurrency[];
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    setConfig({ ...config, currencies: next });
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      if (config.enabled && !(config.currencies?.length)) {
        setMsg(t('hq.curfex.currenciesRequired'));
        return;
      }
      const payload: HqCurfexConfig = {
        ...config,
        currencies: config.currencies?.length ? config.currencies : ['JPY'],
      };
      const next = await hqPolicyApi.saveCurfex(payload);
      setConfig({ ...EMPTY, ...next.config });
      if (next.webhookUrl) setWebhookUrl(next.webhookUrl);
      setMsg(t('hq.curfex.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function regenSecret() {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.generateCurfexWebhookSecret();
      setConfig({ ...EMPTY, ...next.config });
      if (next.webhookUrl) setWebhookUrl(next.webhookUrl);
      setSecretOnce(next.webhookSecretOnce || '');
      setMsg(t('hq.curfex.webhookSecretGenerated'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const selected = new Set(config.currencies?.length ? config.currencies : ['JPY']);

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.curfex.title')}</div>
      <div className="pg-card-body space-y-3">
        <p className="pg-hint">{t('hq.curfex.desc')}</p>
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {t('hq.curfex.modeHint')}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
          {t('hq.curfex.enabled')}
        </label>
        <p className="text-[11px] text-gray-500">
          {config.enabled ? t('hq.curfex.enabledHint') : t('hq.curfex.disabledHint')}
        </p>

        <div className="rounded border border-slate-200 px-3 py-2 space-y-2">
          <p className="pg-label">{t('hq.curfex.currencies')}</p>
          <p className="text-[11px] text-gray-500">{t('hq.curfex.currenciesHint')}</p>
          <div className="flex flex-wrap gap-3">
            {CURFEX_CURRENCY_OPTIONS.map((code) => (
              <label key={code} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={selected.has(code)}
                  disabled={!config.enabled}
                  onChange={() => toggleCurrency(code)}
                />
                <span className="font-medium">{code}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-amber-800">{t('hq.curfex.currenciesException')}</p>
        </div>

        <label className="block max-w-md">
          <span className="pg-label">{t('hq.curfex.defaultCollectionMode')}</span>
          <select
            className="pg-input mt-1 w-full"
            value={config.defaultCollectionMode === 'VIRTUAL' ? 'VIRTUAL' : 'FIXED'}
            onChange={(e) =>
              setConfig({
                ...config,
                defaultCollectionMode: e.target.value === 'VIRTUAL' ? 'VIRTUAL' : 'FIXED',
              })
            }
          >
            <option value="FIXED">{t('collectionMode.FIXED')}</option>
            <option value="VIRTUAL">{t('collectionMode.VIRTUAL')}</option>
          </select>
          <span className="mt-1 block text-[11px] text-gray-500">
            {t('hq.curfex.defaultCollectionModeHint')}
          </span>
        </label>

        <label className="block max-w-md">
          <span className="pg-label">{t('hq.curfex.clientId')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.clientId}
            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.curfex.clientSecret')}</span>
          <input
            type="password"
            className="pg-input mt-1 w-full"
            value={config.clientSecret}
            onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
            placeholder="********"
            autoComplete="new-password"
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.curfex.apiBaseUrl')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.apiBaseUrl ?? ''}
            onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value || undefined })}
            placeholder="https://fcol-dashboard-uat1.curfex.com"
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.curfex.walletName')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.walletName ?? ''}
            onChange={(e) => setConfig({ ...config, walletName: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.sandbox !== false}
            onChange={(e) => setConfig({ ...config, sandbox: e.target.checked })}
          />
          {t('hq.curfex.sandbox')}
        </label>
        <p className="text-[11px] text-gray-500">{t('hq.curfex.sandboxHint')}</p>

        <div className="rounded border border-emerald-200 bg-emerald-50/60 px-3 py-2 space-y-2">
          <p className="text-xs font-semibold text-emerald-900">{t('hq.curfex.autoDetectTitle')}</p>
          <p className="text-[11px] text-emerald-800">{t('hq.curfex.autoDetectDesc')}</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.autoApproveOnDeposit !== false}
              onChange={(e) => setConfig({ ...config, autoApproveOnDeposit: e.target.checked })}
            />
            {t('hq.curfex.autoApprove')}
          </label>
          <label className="block">
            <span className="pg-label">{t('hq.curfex.webhookUrl')}</span>
            <input className="pg-input mt-1 w-full font-mono text-[11px]" readOnly value={webhookUrl} />
          </label>
          <p className="text-[11px] text-gray-600">{t('hq.curfex.webhookUrlHint')}</p>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.webhookSecret')}</span>
            <input
              type="password"
              className="pg-input mt-1 w-full"
              value={config.webhookSecret ?? ''}
              onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <button type="button" onClick={regenSecret} disabled={saving} className="pg-btn pg-btn-secondary text-xs">
            {t('hq.curfex.generateWebhookSecret')}
          </button>
          {secretOnce && (
            <div className="rounded bg-white border border-amber-200 px-2 py-1.5 text-[11px] break-all">
              <p className="font-medium text-amber-800">{t('hq.curfex.webhookSecretOnce')}</p>
              <code className="text-amber-950">{secretOnce}</code>
            </div>
          )}
        </div>

        {msg && <p className="pg-hint">{msg}</p>}
        <PolicyTableActions>
          <button type="button" onClick={save} disabled={saving} className="pg-btn pg-btn-primary">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </PolicyTableActions>
      </div>
    </div>
  );
}
