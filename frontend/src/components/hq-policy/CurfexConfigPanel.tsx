'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqCurfexConfig } from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const EMPTY: HqCurfexConfig = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  apiBaseUrl: 'https://fcol-dashboard-uat1.curfex.com',
  walletName: '',
  currencies: ['JPY'],
  sandbox: true,
};

export function CurfexConfigPanel() {
  const t = useT();
  const [config, setConfig] = useState<HqCurfexConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCurfex()
      .then((r) => setConfig({ ...EMPTY, ...r.config }))
      .catch(console.error);
  }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveCurfex(config);
      setConfig(next.config);
      setMsg(t('hq.curfex.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

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
