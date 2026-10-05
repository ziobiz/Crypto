'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqIcopayConfig } from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const EMPTY: HqIcopayConfig = {
  enabled: false,
  mid: '',
  compId: '',
  bracketSecret: '',
  apiBaseUrl: 'https://api.icopay.co.kr',
  sandbox: false,
  channel: 'IN',
};

const WEBHOOK_URL = 'https://api.tinpass.com/api/webhooks/icopay';
const RESULT_URL = 'https://tinpass.com/dashboard/usdt';

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
      setConfig({ ...EMPTY, ...next.config });
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
          <span className="pg-label">{t('hq.icopay.compId')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.compId ?? ''}
            onChange={(e) => setConfig({ ...config, compId: e.target.value })}
            placeholder="6000000035"
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.mid')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.mid}
            onChange={(e) => setConfig({ ...config, mid: e.target.value })}
            placeholder="5f681081-2466-4c1c-9505-5ff960715ec3"
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
            placeholder="https://api.icopay.co.kr"
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.channel')}</span>
          <select
            className="pg-input mt-1 w-full"
            value={config.channel ?? 'IN'}
            onChange={(e) =>
              setConfig({ ...config, channel: e.target.value === 'RE' ? 'RE' : 'IN' })
            }
          >
            <option value="IN">IN — INLINE</option>
            <option value="RE">RE — REDIRECT</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.sandbox === true}
            onChange={(e) => setConfig({ ...config, sandbox: e.target.checked })}
          />
          {t('hq.icopay.sandbox')}
        </label>
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
          <p className="font-semibold">{t('hq.icopay.urlsTitle')}</p>
          <p className="mt-1 break-all">
            <span className="font-medium">Webhook (NOTI):</span> {WEBHOOK_URL}
          </p>
          <p className="mt-1 break-all">
            <span className="font-medium">Result:</span> {RESULT_URL}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t('hq.icopay.urlsHint')}</p>
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
