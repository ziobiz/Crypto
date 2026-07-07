'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqIcopayConfig } from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const EMPTY: HqIcopayConfig = {
  enabled: false,
  mid: '',
  bracketSecret: '',
  sandbox: true,
};

export function IcopayConfigPanel() {
  const t = useT();
  const [config, setConfig] = useState<HqIcopayConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi.getIcopay().then((r) => setConfig({ ...EMPTY, ...r.config })).catch(console.error);
  }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveIcopay(config);
      setConfig(next.config);
      setMsg(t('hq.icopay.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.icopay.title')}</div>
      <div className="pg-card-body space-y-3">
        <p className="pg-hint">{t('hq.icopay.desc')}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
          {t('hq.icopay.enabled')}
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.mid')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.mid}
            onChange={(e) => setConfig({ ...config, mid: e.target.value })}
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.bracketSecret')}</span>
          <input
            type="password"
            className="pg-input mt-1 w-full"
            value={config.bracketSecret}
            onChange={(e) => setConfig({ ...config, bracketSecret: e.target.value })}
            placeholder="********"
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.apiBaseUrl')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.apiBaseUrl ?? ''}
            onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value || undefined })}
            placeholder="https://pg.ziobiz.com/api/v1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.sandbox === true}
            onChange={(e) => setConfig({ ...config, sandbox: e.target.checked })}
          />
          {t('hq.icopay.sandbox')}
        </label>
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
