'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqIcopayConfig, type IcopayBrokerEnv } from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const LIVE = {
  merchant: 'DEALMAI SERVICE (TINPASS)',
  compId: '6000000064',
  mid: '5f681081-2466-4c1c-9505-5ff960715ec3',
  apiBaseUrl: 'https://api.icopay.co.kr',
  channel: 'IN' as const,
  baseCurrency: 'THB',
  docsUrl:
    'https://api.icopay.co.kr/merchant-api-samples/docs/unified-checkout-api-parameters.html',
};

const EMPTY: HqIcopayConfig = {
  enabled: false,
  mid: LIVE.mid,
  compId: LIVE.compId,
  bracketSecret: '',
  brokerSecretLive: '',
  brokerSecretSandbox: '',
  activeBrokerEnv: 'LIVE',
  apiBaseUrl: LIVE.apiBaseUrl,
  sandbox: false,
  channel: LIVE.channel,
};

const WEBHOOK_URL = 'https://api.tinpass.com/api/webhooks/icopay';
const RESULT_URL = 'https://tinpass.com/dashboard/usdt/card-result';
const MASK = '********';

function envBadgeClass(env: IcopayBrokerEnv): string {
  if (env === 'LIVE') return 'border-emerald-300 bg-emerald-50 text-emerald-900';
  if (env === 'SANDBOX') return 'border-amber-300 bg-amber-50 text-amber-950';
  return 'border-slate-300 bg-slate-100 text-slate-800';
}

export function IcopayConfigPanel() {
  const t = useT();
  const [config, setConfig] = useState<HqIcopayConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getIcopay()
      .then((r) => setConfig({ ...EMPTY, ...r.config }))
      .catch(console.error);
  }, []);

  const activeEnv: IcopayBrokerEnv = config.activeBrokerEnv ?? 'LIVE';
  const base = (config.apiBaseUrl || LIVE.apiBaseUrl).replace(/\/$/, '');
  const compId = (config.compId || LIVE.compId).trim() || LIVE.compId;
  const endpoints = useMemo(
    () => ({
      prepare: `${base}/api/middleware/v1/merchant/checkout/prepare`,
      session: `${base}/api/middleware/v1/merchant/checkout/session?token={sessionToken}`,
      status: `${base}/api/middleware/v1/merchant/checkout/status?compId=${compId}&orderNo={orderNo}`,
      embed: `${base}/v1/embed-checkout/${compId}`,
    }),
    [base, compId],
  );

  function setActiveEnv(env: IcopayBrokerEnv) {
    setConfig((c) => {
      let bracketSecret = c.bracketSecret;
      if (env === 'LOCAL_MOCK') bracketSecret = 'SANDBOX';
      else if (env === 'SANDBOX') {
        const s = (c.brokerSecretSandbox || '').trim();
        if (s && s !== MASK) bracketSecret = s;
      } else {
        const s = (c.brokerSecretLive || '').trim();
        if (s && s !== MASK) bracketSecret = s;
      }
      return { ...c, activeBrokerEnv: env, bracketSecret };
    });
  }

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

  function applyLiveDefaults() {
    setConfig((c) => ({
      ...c,
      mid: LIVE.mid,
      compId: LIVE.compId,
      apiBaseUrl: LIVE.apiBaseUrl,
      channel: LIVE.channel,
      sandbox: false,
      activeBrokerEnv: 'LIVE',
    }));
  }

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.icopay.title')}</div>
      <div className="pg-card-body space-y-3">
        <p className="pg-hint">{t('hq.icopay.desc')}</p>
        <p className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] text-sky-950">
          <span className="font-medium">{LIVE.merchant}</span>
          <span className="mx-1 text-sky-700">·</span>
          <span>compId {LIVE.compId}</span>
          <span className="mx-1 text-sky-700">·</span>
          <span>
            {t('hq.icopay.baseCurrency')}: {LIVE.baseCurrency}
          </span>
          <span className="mx-1 text-sky-700">·</span>
          <span>IN (INLINE)</span>
        </p>
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
            placeholder={LIVE.compId}
          />
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.mid')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.mid}
            onChange={(e) => setConfig({ ...config, mid: e.target.value })}
            placeholder={LIVE.mid}
          />
        </label>

        <div className="max-w-md space-y-2 rounded border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pg-label mb-0">{t('hq.icopay.activeEnv')}</span>
            <span
              className={`rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${envBadgeClass(activeEnv)}`}
            >
              {activeEnv === 'LIVE'
                ? t('hq.icopay.envLive')
                : activeEnv === 'SANDBOX'
                  ? t('hq.icopay.envSandbox')
                  : t('hq.icopay.envLocalMock')}
            </span>
          </div>
          <select
            className="pg-input w-full"
            value={activeEnv}
            onChange={(e) => setActiveEnv(e.target.value as IcopayBrokerEnv)}
          >
            <option value="LIVE">{t('hq.icopay.envLive')}</option>
            <option value="SANDBOX">{t('hq.icopay.envSandbox')}</option>
            <option value="LOCAL_MOCK">{t('hq.icopay.envLocalMock')}</option>
          </select>
          <p className="pg-hint text-[11px]">{t('hq.icopay.activeEnvHint')}</p>
        </div>

        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.brokerSecretLive')}</span>
          <input
            type="password"
            className="pg-input mt-1 w-full"
            value={config.brokerSecretLive ?? ''}
            onChange={(e) =>
              setConfig({
                ...config,
                brokerSecretLive: e.target.value,
                brokerSecretLiveTail: undefined,
              })
            }
            placeholder="********"
            autoComplete="new-password"
          />
          {config.brokerSecretLiveTail ? (
            <p className="mt-1 font-mono text-xs text-emerald-800">
              {t('hq.icopay.secretTail', { env: 'LIVE', tail: config.brokerSecretLiveTail })}
            </p>
          ) : (
            <p className="pg-hint mt-1 text-[11px]">{t('hq.icopay.secretTailEmpty', { env: 'LIVE' })}</p>
          )}
        </label>
        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.brokerSecretSandbox')}</span>
          <input
            type="password"
            className="pg-input mt-1 w-full"
            value={config.brokerSecretSandbox ?? ''}
            onChange={(e) =>
              setConfig({
                ...config,
                brokerSecretSandbox: e.target.value,
                brokerSecretSandboxTail: undefined,
              })
            }
            placeholder="ic_…"
            autoComplete="new-password"
          />
          {config.brokerSecretSandboxTail ? (
            <p className="mt-1 font-mono text-xs text-amber-900">
              {t('hq.icopay.secretTail', { env: 'SANDBOX', tail: config.brokerSecretSandboxTail })}
            </p>
          ) : (
            <p className="pg-hint mt-1 text-[11px]">{t('hq.icopay.secretTailEmpty', { env: 'SANDBOX' })}</p>
          )}
          <p className="pg-hint mt-1 text-[11px]">{t('hq.icopay.brokerSecretSlotsHint')}</p>
        </label>

        <label className="block max-w-md">
          <span className="pg-label">{t('hq.icopay.apiBaseUrl')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={config.apiBaseUrl ?? ''}
            onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value || undefined })}
            placeholder={LIVE.apiBaseUrl}
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
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.sandbox === true}
              onChange={(e) => setConfig({ ...config, sandbox: e.target.checked })}
            />
            {t('hq.icopay.sandbox')}
          </label>
          <p className="pg-hint text-[11px] max-w-xl">{t('hq.icopay.sandboxHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="pg-btn pg-btn-secondary text-xs" onClick={applyLiveDefaults}>
            {t('hq.icopay.applyLiveDefaults')}
          </button>
          <a
            className="pg-btn pg-btn-secondary text-xs"
            href={LIVE.docsUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t('hq.icopay.docsLink')}
          </a>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700 space-y-1">
          <p className="font-semibold">{t('hq.icopay.urlsTitle')}</p>
          <p className="break-all">
            <span className="font-medium">Webhook (merchantNotifyUrls):</span> {WEBHOOK_URL}
          </p>
          <p className="break-all">
            <span className="font-medium">Result:</span> {RESULT_URL}
          </p>
          <p className="break-all">
            <span className="font-medium">Prepare:</span> {endpoints.prepare}
          </p>
          <p className="break-all">
            <span className="font-medium">Session:</span> {endpoints.session}
          </p>
          <p className="break-all">
            <span className="font-medium">Status:</span> {endpoints.status}
          </p>
          <p className="break-all">
            <span className="font-medium">Embed:</span> {endpoints.embed}
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
