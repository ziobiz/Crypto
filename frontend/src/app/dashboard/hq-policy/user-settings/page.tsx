'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqPlatformPayload } from '@/lib/api';

const IDLE_OPTIONS = [10, 30, 60, 90, 120] as const;

export default function HqUserSettingsPage() {
  const t = useT();
  const [platform, setPlatform] = useState<HqPlatformPayload | null>(null);
  const [idleMinutes, setIdleMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi.getPlatform().then((p) => {
      setPlatform(p);
      setIdleMinutes(p.config.idleTimeoutMinutes ?? 30);
    }).catch(console.error);
  }, []);

  async function saveIdleTimeout() {
    if (!platform) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.savePlatform({
        ...platform.config,
        idleTimeoutMinutes: idleMinutes,
      });
      setPlatform(next);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pg-section">
      <div className="pg-section-head">{t('hq.sub.access.userSettings')}</div>
      <div className="pg-section-pad space-y-4">
        <p className="pg-hint">{t('hq.userSettings.desc')}</p>

        <p className="pg-label">{t('hq.userSettings.passwordPolicy')}</p>
        <p className="pg-hint">{t('hq.userSettings.passwordPolicyDesc')}</p>

        <p className="pg-label">{t('hq.userSettings.otpPolicy')}</p>
        <p className="pg-hint">
          {platform?.email?.otpEnabled
            ? t('hq.userSettings.otpAllOn')
            : t('hq.userSettings.otpRoleBased')}
        </p>
        {platform?.email && (
          <ul className="list-disc pl-5 pg-hint">
            <li>{t('hq.userSettings.otpExpire', { min: platform.email.otpExpireMinutes ?? 5 })}</li>
            <li>{t('hq.userSettings.tradeReceipt')}</li>
          </ul>
        )}

        <div className="max-w-md pg-card">
          <div className="pg-card-body">
          <label className="block">
            <span className="pg-label">{t('hq.userSettings.idleTimeoutLabel')}</span>
            <p className="pg-hint mb-2 text-xs">{t('hq.userSettings.idleTimeoutDesc')}</p>
            <select
              value={idleMinutes}
              onChange={(e) => setIdleMinutes(Number(e.target.value))}
              className="pg-input w-full"
            >
              {IDLE_OPTIONS.map((min) => (
                <option key={min} value={min}>
                  {t('hq.userSettings.idleTimeoutOption', { min })}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={saveIdleTimeout}
            disabled={saving || !platform}
            className="pg-btn pg-btn-primary mt-3 disabled:opacity-50"
          >
            {saving ? t('hq.saving') : t('hq.userSettings.saveIdleTimeout')}
          </button>
          {msg && <p className="pg-hint mt-2">{msg}</p>}
          </div>
        </div>

        <Link href="/dashboard/hq-policy/platform" className="pg-link">
          {t('hq.userSettings.gotoPlatform')}
        </Link>
      </div>
    </section>
  );
}
