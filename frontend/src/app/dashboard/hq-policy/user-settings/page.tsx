'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqPlatformPayload } from '@/lib/api';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { LOCALES, type Locale } from '@/i18n/locales';
import {
  DEFAULT_INACTIVE_NOTICE_PRESETS,
  mergeInactiveNoticePresets,
  type InactiveNoticePreset,
  type InactiveNoticePresetId,
} from '@/lib/inactive-notice-presets';

const IDLE_OPTIONS = [10, 30, 60, 90, 120] as const;

const DEFAULT_INACTIVE_NOTICE: Record<Locale, string> = {
  ...DEFAULT_INACTIVE_NOTICE_PRESETS.find((p) => p.id === 'WARNING')!.bodyI18n,
};

export default function HqUserSettingsPage() {
  const t = useT();
  const { requestConfirm, dialog } = useDoubleConfirm();
  const [platform, setPlatform] = useState<HqPlatformPayload | null>(null);
  const [idleMinutes, setIdleMinutes] = useState(30);
  const [inactiveNotice, setInactiveNotice] = useState<Record<Locale, string>>({
    ...DEFAULT_INACTIVE_NOTICE,
  });
  const [presets, setPresets] = useState<InactiveNoticePreset[]>(
    DEFAULT_INACTIVE_NOTICE_PRESETS.map((p) => ({
      ...p,
      bodyI18n: { ...p.bodyI18n },
    })),
  );
  const [activePresetId, setActivePresetId] = useState<InactiveNoticePresetId>('BASIC');
  const [noticeLocale, setNoticeLocale] = useState<Locale>('KR');
  const [presetLocale, setPresetLocale] = useState<Locale>('KR');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getPlatform()
      .then((p) => {
        setPlatform(p);
        setIdleMinutes(p.config.idleTimeoutMinutes ?? 30);
        setInactiveNotice({
          ...DEFAULT_INACTIVE_NOTICE,
          ...(p.config.inactiveLoginNoticeI18n ?? {}),
        });
        setPresets(mergeInactiveNoticePresets(p.config.inactiveLoginNoticePresets));
      })
      .catch(console.error);
  }, []);

  const activePreset = presets.find((p) => p.id === activePresetId) ?? presets[0];

  async function persist(patch: {
    idleTimeoutMinutes?: number;
    inactiveLoginNoticeI18n?: Record<Locale, string>;
    inactiveLoginNoticePresets?: InactiveNoticePreset[];
  }) {
    if (!platform) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.savePlatform({
        ...platform.config,
        ...patch,
      });
      setPlatform(next);
      setIdleMinutes(next.config.idleTimeoutMinutes ?? 30);
      setInactiveNotice({
        ...DEFAULT_INACTIVE_NOTICE,
        ...(next.config.inactiveLoginNoticeI18n ?? {}),
      });
      setPresets(mergeInactiveNoticePresets(next.config.inactiveLoginNoticePresets));
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function saveIdleTimeout() {
    requestConfirm({
      title: t('hq.userSettings.saveIdleTimeout'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: () => persist({ idleTimeoutMinutes: idleMinutes }),
    });
  }

  function saveInactiveNotice() {
    requestConfirm({
      title: t('hq.userSettings.inactiveNoticeSave'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: () => persist({ inactiveLoginNoticeI18n: inactiveNotice }),
    });
  }

  function savePresets() {
    requestConfirm({
      title: t('hq.userSettings.inactivePresetsSave'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: () => persist({ inactiveLoginNoticePresets: presets }),
    });
  }

  function updatePresetBody(loc: Locale, value: string) {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === activePresetId
          ? { ...p, bodyI18n: { ...p.bodyI18n, [loc]: value } }
          : p,
      ),
    );
  }

  function applyPresetAsFallback() {
    if (!activePreset) return;
    setInactiveNotice({ ...activePreset.bodyI18n });
    setNoticeLocale(presetLocale);
  }

  return (
    <section className="pg-section">
      {dialog}
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
          </div>
        </div>

        <div className="max-w-xl pg-card">
          <div className="pg-card-body space-y-3">
            <div>
              <p className="pg-label">{t('hq.userSettings.inactivePresetsTitle')}</p>
              <p className="pg-hint text-xs">{t('hq.userSettings.inactivePresetsDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`pg-btn text-xs ${
                    activePresetId === p.id ? 'pg-btn-primary' : 'pg-btn-secondary'
                  }`}
                  onClick={() => setActivePresetId(p.id)}
                >
                  {p.title}
                </button>
              ))}
            </div>
            {activePreset && (
              <>
                <p className="text-xs font-semibold text-slate-600">
                  {t('hq.userSettings.inactivePresetEditing', { title: activePreset.title })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      className={`pg-btn text-xs ${
                        presetLocale === loc ? 'pg-btn-primary' : 'pg-btn-secondary'
                      }`}
                      onClick={() => setPresetLocale(loc)}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <textarea
                  className="pg-input min-h-[6rem] w-full"
                  value={activePreset.bodyI18n[presetLocale]}
                  onChange={(e) => updatePresetBody(presetLocale, e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={savePresets}
                    disabled={saving || !platform}
                    className="pg-btn pg-btn-primary disabled:opacity-50"
                  >
                    {saving ? t('hq.saving') : t('hq.userSettings.inactivePresetsSave')}
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetAsFallback}
                    disabled={saving}
                    className="pg-btn pg-btn-secondary disabled:opacity-50"
                  >
                    {t('hq.userSettings.inactivePresetUseAsDefault')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="max-w-xl pg-card">
          <div className="pg-card-body space-y-3">
            <div>
              <p className="pg-label">{t('hq.userSettings.inactiveNoticeTitle')}</p>
              <p className="pg-hint text-xs">{t('hq.userSettings.inactiveNoticeDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`pg-btn text-xs ${noticeLocale === loc ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
                  onClick={() => setNoticeLocale(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
            <textarea
              className="pg-input min-h-[6rem] w-full"
              value={inactiveNotice[noticeLocale]}
              onChange={(e) =>
                setInactiveNotice((prev) => ({ ...prev, [noticeLocale]: e.target.value }))
              }
              placeholder={DEFAULT_INACTIVE_NOTICE[noticeLocale]}
            />
            <button
              type="button"
              onClick={saveInactiveNotice}
              disabled={saving || !platform}
              className="pg-btn pg-btn-primary disabled:opacity-50"
            >
              {saving ? t('hq.saving') : t('hq.userSettings.inactiveNoticeSave')}
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
