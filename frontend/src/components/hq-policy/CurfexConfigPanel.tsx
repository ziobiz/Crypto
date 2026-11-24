'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type CurfexEnvCredentials,
  type CurfexEnvironment,
  type HqCurfexConfig,
} from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const CURFEX_CURRENCY_OPTIONS = ['JPY', 'KRW', 'THB', 'CNY'] as const;
type CurfexCurrency = (typeof CURFEX_CURRENCY_OPTIONS)[number];

const EMPTY_SANDBOX: CurfexEnvCredentials = {
  clientId: '',
  clientSecret: '',
  apiBaseUrl: 'https://fcol-dashboard-uat1.curfex.com',
  walletName: '',
  localMock: false,
};

const EMPTY_LIVE: CurfexEnvCredentials = {
  clientId: '',
  clientSecret: '',
  apiBaseUrl: 'https://api-collection.fukugu.co.jp',
  walletName: '',
  localMock: false,
};

const EMPTY: HqCurfexConfig = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  apiBaseUrl: EMPTY_SANDBOX.apiBaseUrl,
  walletName: '',
  currencies: ['JPY'],
  sandbox: false,
  activeEnvironment: 'sandbox',
  sandboxProfile: { ...EMPTY_SANDBOX },
  liveProfile: { ...EMPTY_LIVE },
  webhookSecret: '',
  webhookPublicBaseUrl: 'https://hooks.dealmai.com',
  autoApproveOnDeposit: true,
  defaultCollectionMode: 'FIXED',
  defaultCollectionModeCorporate: 'FIXED',
  defaultCollectionModeIndividual: 'DIRECT',
  directRemitCurrencies: ['USD', 'EUR'],
};

function buildWebhookUrl(base?: string) {
  const b = String(base || 'https://hooks.dealmai.com').trim().replace(/\/$/, '');
  return `${b}/api/webhooks/curfex`;
}

function withProfiles(config: HqCurfexConfig): HqCurfexConfig {
  const sandboxProfile = {
    ...EMPTY_SANDBOX,
    ...(config.sandboxProfile || {}),
    clientId: config.sandboxProfile?.clientId ?? config.clientId ?? '',
    clientSecret: config.sandboxProfile?.clientSecret ?? config.clientSecret ?? '',
    apiBaseUrl:
      config.sandboxProfile?.apiBaseUrl ||
      (config.activeEnvironment === 'live' ? EMPTY_SANDBOX.apiBaseUrl : config.apiBaseUrl) ||
      EMPTY_SANDBOX.apiBaseUrl,
    walletName:
      config.sandboxProfile?.walletName ??
      (config.activeEnvironment === 'live' ? '' : config.walletName) ??
      '',
    localMock: config.sandboxProfile?.localMock === true || config.sandbox === true,
  };
  const liveProfile = {
    ...EMPTY_LIVE,
    ...(config.liveProfile || {}),
    apiBaseUrl: config.liveProfile?.apiBaseUrl || EMPTY_LIVE.apiBaseUrl,
    localMock: false,
  };
  return {
    ...EMPTY,
    ...config,
    activeEnvironment: config.activeEnvironment === 'live' ? 'live' : 'sandbox',
    sandboxProfile,
    liveProfile,
  };
}

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
        const merged = withProfiles({ ...EMPTY, ...r.config });
        if (!merged.currencies?.length) merged.currencies = ['JPY'];
        setConfig(merged);
        setWebhookUrl(r.webhookUrl || buildWebhookUrl(merged.webhookPublicBaseUrl));
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

  function setActiveEnvironment(next: CurfexEnvironment) {
    setConfig({ ...config, activeEnvironment: next, sandbox: next === 'sandbox' ? config.sandboxProfile?.localMock === true : false });
  }

  function patchSandbox(patch: Partial<CurfexEnvCredentials>) {
    const sandboxProfile = { ...(config.sandboxProfile || EMPTY_SANDBOX), ...patch };
    setConfig({
      ...config,
      sandboxProfile,
      sandbox: sandboxProfile.localMock === true,
    });
  }

  function patchLive(patch: Partial<CurfexEnvCredentials>) {
    setConfig({
      ...config,
      liveProfile: { ...(config.liveProfile || EMPTY_LIVE), ...patch, localMock: false },
    });
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
        sandboxProfile: config.sandboxProfile || EMPTY_SANDBOX,
        liveProfile: { ...(config.liveProfile || EMPTY_LIVE), localMock: false },
        sandbox: config.activeEnvironment === 'sandbox' && config.sandboxProfile?.localMock === true,
      };
      const next = await hqPolicyApi.saveCurfex(payload);
      setConfig(withProfiles({ ...EMPTY, ...next.config }));
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
      setConfig(withProfiles({ ...EMPTY, ...next.config }));
      if (next.webhookUrl) setWebhookUrl(next.webhookUrl);
      setSecretOnce(next.webhookSecretOnce || '');
      setMsg(t('hq.curfex.webhookSecretGenerated'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function copyWebhookUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setMsg(t('hq.curfex.webhookUrlCopied'));
    } catch {
      setMsg(t('hq.curfex.webhookUrlCopyFail'));
    }
  }

  async function testConnection() {
    setSaving(true);
    setMsg('');
    try {
      const result = await hqPolicyApi.testCurfexConnection();
      setMsg(
        result.ok
          ? t('hq.curfex.testOk', { detail: result.message })
          : t('hq.curfex.testFail', { detail: result.message }),
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.curfex.testFail', { detail: '' }));
    } finally {
      setSaving(false);
    }
  }

  const selected = new Set(config.currencies?.length ? config.currencies : ['JPY']);
  const active = config.activeEnvironment === 'live' ? 'live' : 'sandbox';
  const sandboxProfile = config.sandboxProfile || EMPTY_SANDBOX;
  const liveProfile = config.liveProfile || EMPTY_LIVE;

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.curfex.title')}</div>
      <div className="pg-card-body space-y-3">
        <p className="pg-hint">{t('hq.curfex.desc')}</p>
        <div className="rounded border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-900">
          <p>{t('hq.curfex.accountsMovedHint')}</p>
          <Link
            href="/dashboard/hq-policy/accounts"
            className="mt-1 inline-block font-semibold text-sky-800 underline"
          >
            {t('hq.hub.accounts')}
          </Link>
          <p className="mt-2">{t('hq.curfex.issuanceAdminHint')}</p>
          <Link
            href="/dashboard/hq-policy/ops/curfex"
            className="mt-1 inline-block font-semibold text-sky-800 underline"
          >
            {t('hq.ops.curfexIssuance')}
          </Link>
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

        <div className="rounded border border-indigo-200 bg-indigo-50/50 px-3 py-2 space-y-2">
          <p className="text-xs font-semibold text-indigo-950">{t('hq.curfex.activeEnvironment')}</p>
          <p className="text-[11px] text-indigo-900">{t('hq.curfex.activeEnvironmentHint')}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="curfex-env"
                checked={active === 'sandbox'}
                onChange={() => setActiveEnvironment('sandbox')}
              />
              {t('hq.curfex.envSandbox')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="curfex-env"
                checked={active === 'live'}
                onChange={() => setActiveEnvironment('live')}
              />
              {t('hq.curfex.envLive')}
            </label>
          </div>
          <p className="text-[11px] font-medium text-indigo-950">
            {active === 'live' ? t('hq.curfex.envLiveActive') : t('hq.curfex.envSandboxActive')}
          </p>
        </div>

        <div className={`rounded border px-3 py-2 space-y-2 ${active === 'sandbox' ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'}`}>
          <p className="text-xs font-semibold">{t('hq.curfex.sandboxProfileTitle')}</p>
          <p className="text-[11px] text-gray-600">{t('hq.curfex.sandboxProfileHint')}</p>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.clientId')}</span>
            <input
              className="pg-input mt-1 w-full"
              value={sandboxProfile.clientId}
              onChange={(e) => patchSandbox({ clientId: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.clientSecret')}</span>
            <input
              type="password"
              className="pg-input mt-1 w-full"
              value={sandboxProfile.clientSecret}
              onChange={(e) => patchSandbox({ clientSecret: e.target.value })}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.apiBaseUrl')}</span>
            <input
              className="pg-input mt-1 w-full"
              value={sandboxProfile.apiBaseUrl}
              onChange={(e) => patchSandbox({ apiBaseUrl: e.target.value })}
              placeholder="https://fcol-dashboard-uat1.curfex.com"
            />
          </label>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.walletName')}</span>
            <input
              className="pg-input mt-1 w-full"
              value={sandboxProfile.walletName}
              onChange={(e) => patchSandbox({ walletName: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sandboxProfile.localMock === true}
              onChange={(e) => patchSandbox({ localMock: e.target.checked })}
            />
            {t('hq.curfex.sandbox')}
          </label>
          <p className="text-[11px] text-gray-500">{t('hq.curfex.sandboxHint')}</p>
          <p className="text-[11px] text-amber-800">{t('hq.curfex.uatHint')}</p>
        </div>

        <div className={`rounded border px-3 py-2 space-y-2 ${active === 'live' ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200'}`}>
          <p className="text-xs font-semibold">{t('hq.curfex.liveProfileTitle')}</p>
          <p className="text-[11px] text-gray-600">{t('hq.curfex.liveProfileHint')}</p>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.clientId')}</span>
            <input
              className="pg-input mt-1 w-full"
              value={liveProfile.clientId}
              onChange={(e) => patchLive({ clientId: e.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.clientSecret')}</span>
            <input
              type="password"
              className="pg-input mt-1 w-full"
              value={liveProfile.clientSecret}
              onChange={(e) => patchLive({ clientSecret: e.target.value })}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.apiBaseUrl')}</span>
            <input
              className="pg-input mt-1 w-full"
              value={liveProfile.apiBaseUrl}
              onChange={(e) => patchLive({ apiBaseUrl: e.target.value })}
              placeholder="https://api-collection.fukugu.co.jp"
            />
          </label>
          <label className="block max-w-md">
            <span className="pg-label">{t('hq.curfex.walletName')}</span>
            <input
              className="pg-input mt-1 w-full"
              value={liveProfile.walletName}
              onChange={(e) => patchLive({ walletName: e.target.value })}
              placeholder="OnTheLine-JPY"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={testConnection}
          disabled={saving}
          className="pg-btn pg-btn-secondary text-xs"
        >
          {t('hq.curfex.testConnection')}
        </button>
        <p className="text-[11px] text-gray-500">{t('hq.curfex.testConnectionHint')}</p>

        <div className="rounded border border-emerald-200 bg-emerald-50/60 px-3 py-2 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-900">{t('hq.curfex.webhookSettingsTitle')}</p>
            <Link
              href="/dashboard/hq-policy/ops/curfex"
              className="text-[11px] font-medium text-emerald-800 underline"
            >
              {t('hq.curfex.openIssuanceAdmin')}
            </Link>
          </div>
          <p className="text-[11px] text-emerald-800">{t('hq.curfex.autoDetectTitle')}</p>
          <p className="text-[11px] text-emerald-800">{t('hq.curfex.autoDetectDesc')}</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.autoApproveOnDeposit !== false}
              onChange={(e) => setConfig({ ...config, autoApproveOnDeposit: e.target.checked })}
            />
            {t('hq.curfex.autoApprove')}
          </label>
          <label className="block max-w-xl">
            <span className="pg-label">{t('hq.curfex.webhookPublicBaseUrl')}</span>
            <input
              className="pg-input mt-1 w-full font-mono text-[11px]"
              value={config.webhookPublicBaseUrl ?? ''}
              onChange={(e) => {
                const nextBase = e.target.value;
                setConfig({ ...config, webhookPublicBaseUrl: nextBase });
                setWebhookUrl(buildWebhookUrl(nextBase));
              }}
              placeholder="https://hooks.dealmai.com"
            />
          </label>
          <p className="text-[11px] text-gray-600">{t('hq.curfex.webhookPublicBaseUrlHint')}</p>
          <label className="block">
            <span className="pg-label">{t('hq.curfex.webhookUrl')}</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <input className="pg-input min-w-0 flex-1 font-mono text-[11px]" readOnly value={webhookUrl} />
              <button type="button" onClick={copyWebhookUrl} className="pg-btn pg-btn-secondary text-xs shrink-0">
                {t('hq.curfex.copyWebhookUrl')}
              </button>
            </div>
          </label>
          <p className="text-[11px] text-gray-600">{t('hq.curfex.webhookUrlHint')}</p>
          <div className="rounded border border-amber-200 bg-amber-50/70 px-2 py-1.5 text-[11px] text-amber-950 space-y-1">
            <p className="font-semibold">{t('hq.curfex.webhookRegisterTitle')}</p>
            <p>{t('hq.curfex.webhookRegisterDesc')}</p>
            <p className="font-mono break-all">{webhookUrl}</p>
          </div>
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
