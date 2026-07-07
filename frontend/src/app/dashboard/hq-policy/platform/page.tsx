'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type HqEmailOtpConfig,
  type HqPlatformConfig,
  type HqPlatformPayload,
} from '@/lib/api';
import { LOCALES } from '@/i18n/locales';
import { DEFAULT_LOGIN_NOTICE_I18N } from '@/lib/login-notice';
import { BrandAssetField, type BrandAssetKey } from '@/components/hq-policy/BrandAssetField';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';

function afterAssetUpload(
  key: BrandAssetKey,
  next: HqPlatformPayload,
  setData: (d: HqPlatformPayload) => void,
  setConfig: (c: HqPlatformPayload['config']) => void,
  setAssetBust: (n: number) => void,
  setUploadOk: (fn: (o: Partial<Record<BrandAssetKey, boolean>>) => Partial<Record<BrandAssetKey, boolean>>) => void,
) {
  setData(next);
  setConfig(next.config);
  setAssetBust(Date.now());
  setUploadOk((o) => ({ ...o, [key]: true }));
}

export default function HqPlatformPage() {
  const t = useT();
  const [data, setData] = useState<HqPlatformPayload | null>(null);
  const [config, setConfig] = useState<HqPlatformConfig | null>(null);
  const [email, setEmail] = useState<HqEmailOtpConfig | null>(null);
  const [testTo, setTestTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAuthLogo, setUploadingAuthLogo] = useState(false);
  const [noticeLocale, setNoticeLocale] = useState<(typeof LOCALES)[number]>('KR');
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [assetBust, setAssetBust] = useState(() => Date.now());
  const [uploadOk, setUploadOk] = useState<Partial<Record<BrandAssetKey, boolean>>>({});
  const [msg, setMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [editingEmailNumeric, setEditingEmailNumeric] = useState(false);
  const [emailNumericDraft, setEmailNumericDraft] = useState({ otpExpireMinutes: 5, smtpPort: 587 });
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getPlatform()
      .then((d) => {
        setData(d);
        setConfig(d.config);
        setEmail(d.email);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function save() {
    if (!config) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.savePlatform(config);
      setData(next);
      setConfig(next.config);
      setEmail(next.email);
      setMsg(t('hq.platform.savedCors'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    if (!email) return;
    if (editingEmailNumeric) {
      setEmailMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    setSavingEmail(true);
    setEmailMsg('');
    try {
      const next = await hqPolicyApi.savePlatformEmail(email);
      setData(next);
      setEmail(next.email);
      setEmailMsg(t('hq.platform.emailSaved'));
    } catch (e) {
      setEmailMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingEmail(false);
    }
  }

  async function uploadAuthLogo(file: File) {
    setUploadingAuthLogo(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.uploadPlatformAuthLogo(file);
      afterAssetUpload('authLogo', next, setData, setConfig, setAssetBust, setUploadOk);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setUploadingAuthLogo(false);
    }
  }

  function updateNoticeField(field: 'title' | 'body', value: string) {
    if (!config) return;
    const i18n = { ...(config.loginNoticeI18n ?? {}) };
    const cur = i18n[noticeLocale] ?? { title: '', body: '' };
    i18n[noticeLocale] = { ...cur, [field]: value };
    setConfig({ ...config, loginNoticeI18n: i18n });
  }

  function loadDefaultNotice() {
    if (!config) return;
    const def = DEFAULT_LOGIN_NOTICE_I18N[noticeLocale];
    const i18n = { ...(config.loginNoticeI18n ?? {}) };
    i18n[noticeLocale] = { ...def };
    setConfig({ ...config, loginNoticeI18n: i18n });
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.uploadPlatformLogo(file);
      afterAssetUpload('logo', next, setData, setConfig, setAssetBust, setUploadOk);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function uploadFavicon(file: File) {
    setUploadingFavicon(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.uploadPlatformFavicon(file);
      afterAssetUpload('favicon', next, setData, setConfig, setAssetBust, setUploadOk);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setUploadingFavicon(false);
    }
  }

  async function uploadBackground(file: File) {
    setUploadingBackground(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.uploadPlatformBackground(file);
      afterAssetUpload('background', next, setData, setConfig, setAssetBust, setUploadOk);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setUploadingBackground(false);
    }
  }

  async function saveBrand() {
    if (!config) return;
    setSavingBrand(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.savePlatform(config);
      setData(next);
      setConfig(next.config);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingBrand(false);
    }
  }

  async function sendTest() {
    if (!testTo) return;
    setSendingTest(true);
    setEmailMsg('');
    try {
      await hqPolicyApi.sendPlatformEmailTest(testTo);
      setEmailMsg(t('hq.platform.testSent'));
    } catch (e) {
      setEmailMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSendingTest(false);
    }
  }

  if (error) {
    return <p className="text-red-600">{error} — {t('hq.backendHint')}</p>;
  }

  if (!data || !config || !email) return <p className="pg-hint">{t('hq.loading')}</p>;

  const ssl = data.ssl;

  return (
    <div className="space-y-6">
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.platform.brandCardTitle')}</div>
        <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.platform.brandCardDesc')}</p>

        <label className="block">
          <span className="pg-label">{t('hq.platform.siteName')}</span>
          <input
            value={config.siteName ?? ''}
            onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
            className="pg-input mt-1"
            placeholder="Crypto Workflow"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <BrandAssetField
            label={t('hq.platform.authLogo')}
            desc={t('hq.platform.authLogoDesc')}
            url={config.authLogoUrl}
            cacheBust={assetBust}
            accept="image/png,image/jpeg,image/webp,image/gif"
            uploading={uploadingAuthLogo}
            uploadLabel={t('hq.platform.uploadAuthLogo')}
            savingLabel={t('hq.saving')}
            uploadedLabel={t('hq.platform.assetUploaded')}
            showUploaded={!!uploadOk.authLogo}
            onUpload={uploadAuthLogo}
            preview={(src) => (
              <img src={src} alt="" className="mx-auto block max-h-12 w-auto object-contain" />
            )}
          />
          <BrandAssetField
            label={t('hq.platform.logoTitle')}
            desc={t('hq.platform.logoDesc')}
            url={config.logoUrl}
            cacheBust={assetBust}
            accept="image/png,image/jpeg,image/webp,image/gif"
            uploading={uploadingLogo}
            uploadLabel={t('hq.platform.uploadLogo')}
            savingLabel={t('hq.saving')}
            uploadedLabel={t('hq.platform.assetUploaded')}
            showUploaded={!!uploadOk.logo}
            onUpload={uploadLogo}
            preview={(src) => (
              <img src={src} alt="" className="mx-auto block max-h-12 w-auto object-contain" />
            )}
          />
        </div>

        <label className="block text-sm">
          <span className="text-gray-600">{t('hq.platform.authMainText')}</span>
          <textarea
            value={config.authMainText ?? ''}
            onChange={(e) => setConfig({ ...config, authMainText: e.target.value })}
            rows={2}
            className="pg-input mt-1"
            placeholder="Crypto Workflow"
          />
          <span className="mt-1 block text-xs text-gray-500">{t('hq.platform.authMainTextDesc')}</span>
        </label>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <label className="flex items-center gap-2 text-[11px] font-medium">
            <input
              type="checkbox"
              checked={config.customerRegistrationEnabled === true}
              onChange={(e) => setConfig({ ...config, customerRegistrationEnabled: e.target.checked })}
            />
            {t('hq.platform.customerRegistration')}
          </label>
          <p className="text-xs text-slate-600">{t('hq.platform.customerRegistrationDesc')}</p>
        </div>

        <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] font-medium">
              <input
                type="checkbox"
                checked={config.loginNoticeEnabled !== false}
                onChange={(e) => setConfig({ ...config, loginNoticeEnabled: e.target.checked })}
              />
              {t('hq.platform.loginNotice')}
            </label>
            <div className="flex gap-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setNoticeLocale(loc)}
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    noticeLocale === loc ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-amber-900/80">{t('hq.platform.loginNoticeDesc')}</p>
          <input
            value={config.loginNoticeI18n?.[noticeLocale]?.title ?? ''}
            onChange={(e) => updateNoticeField('title', e.target.value)}
            className="pg-input"
            placeholder={t('hq.platform.loginNoticeTitle')}
          />
          <textarea
            value={config.loginNoticeI18n?.[noticeLocale]?.body ?? ''}
            onChange={(e) => updateNoticeField('body', e.target.value)}
            rows={4}
            className="pg-input"
            placeholder={t('hq.platform.loginNoticeBody')}
          />
          <button type="button" onClick={loadDefaultNotice} className="text-xs text-blue-600 hover:underline">
            {t('hq.platform.loadDefaultNotice', { locale: noticeLocale })}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <BrandAssetField
            label={t('hq.platform.favicon')}
            url={config.faviconUrl}
            cacheBust={assetBust}
            accept="image/png,image/x-icon,image/vnd.microsoft.icon,.ico,image/webp"
            uploading={uploadingFavicon}
            uploadLabel={t('hq.platform.uploadFavicon')}
            savingLabel={t('hq.saving')}
            uploadedLabel={t('hq.platform.assetUploaded')}
            showUploaded={!!uploadOk.favicon}
            onUpload={uploadFavicon}
            preview={(src) => (
              <img src={src} alt="" className="mx-auto block h-8 w-8 object-contain" />
            )}
          />
          <BrandAssetField
            label={t('hq.platform.authBackground')}
            url={config.authBackgroundUrl}
            cacheBust={assetBust}
            accept="image/png,image/jpeg,image/webp"
            uploading={uploadingBackground}
            uploadLabel={t('hq.platform.uploadBackground')}
            savingLabel={t('hq.saving')}
            uploadedLabel={t('hq.platform.assetUploaded')}
            showUploaded={!!uploadOk.background}
            onUpload={uploadBackground}
            preview={(src) => (
              <img src={src} alt="" className="h-24 w-full rounded object-cover" />
            )}
          />
        </div>

        <label className="block text-sm">
          <span className="text-gray-600">{t('hq.platform.footerText')}</span>
          <textarea
            value={config.footerText ?? ''}
            onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
            rows={2}
            className="pg-input mt-1"
            placeholder={t('hq.platform.footerPlaceholder')}
          />
        </label>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t('hq.platform.depositAccounts')}</p>
            <p className="mt-1 text-xs text-slate-600">{t('hq.platform.depositAccountsDesc')}</p>
          </div>
          {(['KRW', 'JPY', 'THB', 'CNY'] as const).map((cur) => {
            const acct = config.depositReceivingAccounts?.[cur] ?? {
              bankName: '',
              accountNumber: '',
              accountHolder: '',
            };
            return (
              <div key={cur} className="rounded border bg-white p-3 space-y-2">
                <p className="text-xs font-bold text-gray-700">{cur}</p>
                <input
                  value={acct.bankName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      depositReceivingAccounts: {
                        ...config.depositReceivingAccounts,
                        [cur]: { ...acct, bankName: e.target.value },
                      },
                    })
                  }
                  className="pg-input"
                  placeholder={t('users.bankName')}
                />
                <input
                  value={acct.accountNumber}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      depositReceivingAccounts: {
                        ...config.depositReceivingAccounts,
                        [cur]: { ...acct, accountNumber: e.target.value },
                      },
                    })
                  }
                  className="pg-input"
                  placeholder={t('users.accountNumber')}
                />
                <input
                  value={acct.accountHolder}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      depositReceivingAccounts: {
                        ...config.depositReceivingAccounts,
                        [cur]: { ...acct, accountHolder: e.target.value },
                      },
                    })
                  }
                  className="pg-input"
                  placeholder={t('users.accountHolder')}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={saveBrand}
          disabled={savingBrand}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {savingBrand ? t('hq.saving') : t('hq.platform.saveBrand')}
        </button>
        {msg && <p className="pg-hint">{msg}</p>}
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.platform.title')}</div>
        <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.platform.desc')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="pg-label">{t('hq.platform.mainDomain')}</span>
            <input
              value={config.primaryDomain}
              onChange={(e) => setConfig({ ...config, primaryDomain: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block">
            <span className="pg-label">{t('hq.platform.apiUrl')}</span>
            <input
              value={config.apiPublicUrl}
              onChange={(e) => setConfig({ ...config, apiPublicUrl: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="pg-label">{t('hq.platform.cors')}</span>
            <input
              value={config.corsOrigins.join(', ')}
              onChange={(e) =>
                setConfig({
                  ...config,
                  corsOrigins: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="pg-input mt-1"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="pg-label">{t('hq.platform.sslPath')}</span>
            <input
              value={config.sslCertPath ?? ''}
              onChange={(e) => setConfig({ ...config, sslCertPath: e.target.value })}
              className="pg-input mt-1 font-mono"
            />
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.redirectRootToPrimary}
            onChange={(e) => setConfig({ ...config, redirectRootToPrimary: e.target.checked })}
          />
          <span className="pg-label">{t('hq.platform.redirect')}</span>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {saving ? t('hq.saving') : t('hq.platform.save')}
        </button>
        {msg && <p className="pg-hint">{msg}</p>}
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.platform.emailTitle')}</div>
        <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.platform.emailDesc')}</p>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={email.tradeReceiptEmailEnabled ?? true}
              onChange={(e) => setEmail({ ...email, tradeReceiptEmailEnabled: e.target.checked })}
            />
            {t('hq.platform.tradeReceiptEnabled')}
          </label>
        </div>
        <p className="text-xs text-gray-500">{t('hq.platform.tradeReceiptLangNote')}</p>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={email.otpEnabled}
              onChange={(e) => setEmail({ ...email, otpEnabled: e.target.checked })}
            />
            {t('hq.platform.otpEnabled')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={email.otpForSuperAdmin}
              onChange={(e) => setEmail({ ...email, otpForSuperAdmin: e.target.checked })}
            />
            {t('hq.platform.otpForSuperAdmin')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={email.otpForHeadOffice}
              onChange={(e) => setEmail({ ...email, otpForHeadOffice: e.target.checked })}
            />
            {t('hq.platform.otpForHeadOffice')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={email.otpForMasterDistributor}
              onChange={(e) => setEmail({ ...email, otpForMasterDistributor: e.target.checked })}
            />
            {t('hq.platform.otpForMaster')}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="pg-hint mb-2">{t('hq.commission.tierEditHint')}</p>
            <div className="overflow-x-auto">
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>{t('hq.platform.numericSetting')}</th>
                    <th>{t('hq.platform.numericValue')}</th>
                    <th>{t('hq.commission.tierActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={editingEmailNumeric ? 'bg-amber-50/60' : undefined}>
                    <td>{t('hq.platform.otpExpire')}</td>
                    <td>
                      {editingEmailNumeric ? (
                        <PolicyNumberInput
                          min={1}
                          max={30}
                          step="1"
                          value={emailNumericDraft.otpExpireMinutes}
                          onChange={(otpExpireMinutes) =>
                            setEmailNumericDraft((prev) => ({ ...prev, otpExpireMinutes }))
                          }
                          className="pg-input w-24"
                        />
                      ) : (
                        <PolicyCellValue>{email.otpExpireMinutes}</PolicyCellValue>
                      )}
                    </td>
                    <td rowSpan={2}>
                      <PolicyTableActions>
                        {editingEmailNumeric ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEmail({
                                  ...email,
                                  otpExpireMinutes: emailNumericDraft.otpExpireMinutes,
                                  smtpPort: emailNumericDraft.smtpPort,
                                });
                                setEditingEmailNumeric(false);
                                setEmailMsg('');
                              }}
                              className="pg-btn pg-btn-primary text-xs"
                            >
                              {t('hq.commission.tierSaveRow')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmailNumeric(false);
                                setEmailMsg('');
                              }}
                              className="pg-btn pg-btn-secondary text-xs"
                            >
                              {t('hq.commission.tierCancelEdit')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEmailNumericDraft({
                                otpExpireMinutes: email.otpExpireMinutes,
                                smtpPort: email.smtpPort,
                              });
                              setEditingEmailNumeric(true);
                              setEmailMsg('');
                            }}
                            className="pg-btn pg-btn-secondary text-xs"
                          >
                            {t('hq.commission.tierEdit')}
                          </button>
                        )}
                      </PolicyTableActions>
                    </td>
                  </tr>
                  <tr className={editingEmailNumeric ? 'bg-amber-50/60' : undefined}>
                    <td>{t('hq.platform.smtpPort')}</td>
                    <td>
                      {editingEmailNumeric ? (
                        <PolicyNumberInput
                          min={1}
                          max={65535}
                          step="1"
                          value={emailNumericDraft.smtpPort}
                          onChange={(smtpPort) =>
                            setEmailNumericDraft((prev) => ({ ...prev, smtpPort }))
                          }
                          className="pg-input w-24"
                        />
                      ) : (
                        <PolicyCellValue>{email.smtpPort}</PolicyCellValue>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <label className="block text-sm sm:col-span-2">
            <span className="text-gray-600">{t('hq.platform.otpSubject')}</span>
            <input
              value={email.otpEmailSubject}
              onChange={(e) => setEmail({ ...email, otpEmailSubject: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-gray-600">{t('hq.platform.otpBody')}</span>
            <textarea
              rows={4}
              value={email.otpEmailBody}
              onChange={(e) => setEmail({ ...email, otpEmailBody: e.target.value })}
              className="pg-input mt-1 font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.platform.smtpHost')}</span>
            <input
              value={email.smtpHost}
              onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={email.smtpSecure}
              onChange={(e) => setEmail({ ...email, smtpSecure: e.target.checked })}
            />
            {t('hq.platform.smtpSecure')}
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.platform.smtpUser')}</span>
            <input
              value={email.smtpUser}
              onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.platform.smtpPassword')}</span>
            <input
              type="password"
              value={email.smtpPassword}
              placeholder={t('hq.platform.smtpPasswordHint')}
              onChange={(e) => setEmail({ ...email, smtpPassword: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.platform.fromAddress')}</span>
            <input
              type="email"
              value={email.fromAddress}
              onChange={(e) => setEmail({ ...email, fromAddress: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.platform.fromName')}</span>
            <input
              value={email.fromName}
              onChange={(e) => setEmail({ ...email, fromName: e.target.value })}
              className="pg-input mt-1"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={saveEmail}
            disabled={savingEmail}
            className="pg-btn pg-btn-primary disabled:opacity-50"
          >
            {savingEmail ? t('hq.saving') : t('hq.platform.saveEmail')}
          </button>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.platform.testEmail')}</span>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="pg-input mt-1 w-56"
            />
          </label>
          <button
            type="button"
            onClick={sendTest}
            disabled={sendingTest || !testTo}
            className="pg-btn pg-btn-secondary disabled:opacity-50"
          >
            {sendingTest ? t('hq.saving') : t('hq.platform.sendTest')}
          </button>
        </div>
        {emailMsg && <p className="pg-hint">{emailMsg}</p>}
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.platform.sslStatus')}</div>
        <div className="pg-section-pad">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="pg-card">
              <div className="pg-card-head">{t('hq.platform.sslStatus')}</div>
              <div className="pg-card-body">
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('hq.platform.status')}</dt>
                    <dd className="font-medium">{ssl.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('hq.platform.expiry')}</dt>
                    <dd>{ssl.detail}</dd>
                  </div>
                  {ssl.daysRemaining != null && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">{t('hq.platform.daysLeft')}</dt>
                      <dd className={ssl.daysRemaining < 30 ? 'text-amber-600 font-medium' : ''}>
                        {t('hq.platform.days', { n: ssl.daysRemaining })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            <div className="pg-card">
              <div className="pg-card-head">{t('hq.platform.server')}</div>
              <div className="pg-card-body">
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('hq.platform.host')}</dt>
                    <dd>{data.server.hostname}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('hq.platform.memory')}</dt>
                    <dd>
                      {data.server.memFreeMb} / {data.server.memTotalMb} MB free
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('hq.platform.load')}</dt>
                    <dd>{data.server.loadAvg.map((n) => n.toFixed(2)).join(', ')}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.platform.leGuide')}</div>
        <div className="pg-section-pad">
        <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs">
{`apt-get install -y certbot python3-certbot-nginx
sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh`}
        </pre>
        </div>
      </section>
    </div>
  );
}
