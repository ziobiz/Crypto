'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError, type ReferrerSearchHit } from '@/lib/api';
import { useLocale, useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { AuthConfirmDialog } from '@/components/AuthConfirmDialog';
import { useBranding } from '@/hooks/useBranding';
import { resolveIndividualRegisterNotice } from '@/lib/individual-register-notice';
import { ReferenceClocks } from '@/components/ReferenceClocks';
import {
  CustomerBankAccountsForm,
  emptyBankAccounts,
  filledBankAccounts,
} from '@/components/CustomerBankAccountsForm';
import { PHONE_COUNTRY_CODES } from '@/constants/phone-country-codes';
import { LIMIT_COUNTRIES, limitCountryFromPhone, type LimitCountryCode } from '@/constants/limit-countries';
import { defaultPhoneCountryCode } from '@/constants/locale-phone';
import { REMITTANCE_PROVIDERS } from '@/constants/remittance-providers';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';

export default function RegisterPage() {
  const t = useT();
  const branding = useBranding();
  return (
    <Suspense
      fallback={
        <AuthChrome branding={branding} variant="register">
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </AuthChrome>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const { locale } = useLocale();
  const branding = useBranding();
  const inviteOrg = (searchParams.get('org') || '').trim();
  const inviteRef = (searchParams.get('ref') || '').trim();
  const inviteLocked = Boolean(inviteOrg || inviteRef);
  const individualNotice = resolveIndividualRegisterNotice(
    locale,
    branding?.individualRegisterNoticeEnabled,
    branding?.individualRegisterNoticeI18n,
  );

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [referrerQuery, setReferrerQuery] = useState('');
  const [referrerHits, setReferrerHits] = useState<ReferrerSearchHit[]>([]);
  const [referrerSearching, setReferrerSearching] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerSearchHit | null>(null);
  /** 기본: 추천자 없음 → 본사 직속 */
  const [noReferrer, setNoReferrer] = useState(true);
  const [inviteLabel, setInviteLabel] = useState('');
  const [form, setForm] = useState({
    email: '',
    emailCode: '',
    name: '',
    phone: '',
    phoneCountryCode: defaultPhoneCountryCode(locale),
    limitCountry: limitCountryFromPhone(defaultPhoneCountryCode(locale)) as LimitCountryCode,
    bankAccounts: emptyBankAccounts(),
    walletAddress: '',
    walletNetwork: 'TRC20',
    walletLabel: '',
    remittanceEnabled: true,
    remittanceProvider: '',
    remittanceProviderOther: '',
    wiseSenderName: '',
    wiseSenderEmail: '',
    wiseSenderCountry: '',
  });

  useEffect(() => {
    const phone = defaultPhoneCountryCode(locale);
    setForm((prev) => ({
      ...prev,
      phoneCountryCode: phone,
      limitCountry: limitCountryFromPhone(phone),
    }));
  }, [locale]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.remittanceEnabled) return prev;
      const nextName = prev.wiseSenderName || prev.name;
      const nextEmail = prev.wiseSenderEmail || prev.email;
      if (nextName === prev.wiseSenderName && nextEmail === prev.wiseSenderEmail) return prev;
      return { ...prev, wiseSenderName: nextName, wiseSenderEmail: nextEmail };
    });
  }, [form.name, form.email, form.remittanceEnabled]);

  const inviteHint = useMemo(() => {
    if (!inviteLabel) return '';
    return t('auth.inviteLocked', { name: inviteLabel });
  }, [inviteLabel, t]);

  useEffect(() => {
    api
      .branding()
      .then((b) => {
        /** 공개가입 OFF → 조직 가입링크(?org/?ref)만 허용 */
        if (b.customerRegistrationEnabled === false && !inviteLocked) {
          router.replace('/login?register=invite');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router, inviteLocked]);

  useEffect(() => {
    if (!inviteLocked) return;
    setNoReferrer(false);
    setSelectedReferrer(null);
    api
      .registerInviteInfo({ org: inviteOrg || undefined, ref: inviteRef || undefined })
      .then((infoRes) => {
        setInviteLabel(
          infoRes.email ? `${infoRes.displayName} / ${infoRes.email}` : infoRes.displayName,
        );
      })
      .catch(() => setError(t('auth.inviteInvalid')));
  }, [inviteLocked, inviteOrg, inviteRef, t]);

  const searchReferrer = async () => {
    setError('');
    const q = referrerQuery.trim();
    if (q.length < 2) {
      setError(t('auth.referrerQueryShort'));
      return;
    }
    setReferrerSearching(true);
    setReferrerHits([]);
    try {
      const res = await api.registerReferrerSearch(q);
      setReferrerHits(res.items);
      if (res.items.length === 0) setError(t('auth.referrerNotFound'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.referrerSearchFailed'));
    } finally {
      setReferrerSearching(false);
    }
  };

  const requestSendCode = () => {
    setError('');
    setInfo('');
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    if (!email) {
      setError(t('auth.recoverEmailRequired'));
      return;
    }
    if (!name) {
      setError(t('auth.registerNameRequired'));
      return;
    }
    setConfirmSendOpen(true);
  };

  const confirmSendCode = async () => {
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    setSendingCode(true);
    setError('');
    try {
      const res = await api.registerSendCode(email, name, {
        inviteOrgCode: inviteOrg || undefined,
        referrerUserId: inviteRef || undefined,
      });
      setForm((prev) => ({ ...prev, email }));
      setCodeSent(true);
      setInfo(
        t('auth.registerCodeSent', {
          email: res.maskedEmail || email,
        }),
      );
      setConfirmSendOpen(false);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === 'CONFLICT' || err.code === 'EMAIL_TAKEN')
      ) {
        setError(t('auth.registerEmailTaken'));
      } else if (err instanceof ApiError && err.code === 'PHONE_TAKEN') {
        setError(t('auth.registerPhoneTaken'));
      } else if (
        err instanceof ApiError &&
        (err.code === 'EMAIL_SEND_FAILED' || err.code === 'EMAIL_NOT_CONFIGURED')
      ) {
        setError(t('auth.emailSendFailed'));
      } else if (err instanceof ApiError && err.code === 'REGISTRATION_INVITE_ONLY') {
        setError(t('auth.registerInviteOnlyHint'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.emailSendFailed'));
      }
      setConfirmSendOpen(false);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!inviteLocked && !noReferrer && !selectedReferrer) {
      setError(t('auth.referrerRequired'));
      return;
    }
    if (inviteLocked && !inviteOrg && !inviteRef) {
      setError(t('auth.inviteInvalid'));
      return;
    }
    const banks = filledBankAccounts(form.bankAccounts);
    if (banks.length === 0) {
      setError(t('register.bankRequired'));
      return;
    }
    if (!form.phone.trim() || !form.phoneCountryCode.trim()) {
      setError(t('register.phoneRequired'));
      return;
    }
    if (!form.walletAddress.trim()) {
      setError(t('register.walletRequired'));
      return;
    }
    if (form.remittanceEnabled) {
      if (!form.remittanceProvider) {
        setError(t('register.remittanceProviderRequired'));
        return;
      }
      if (form.remittanceProvider === 'OTHER' && !form.remittanceProviderOther.trim()) {
        setError(t('register.remittanceOtherRequired'));
        return;
      }
      if (!form.wiseSenderName.trim() || !form.wiseSenderEmail.trim()) {
        setError(t('register.wiseRequired'));
        return;
      }
    }
    setLoading(true);
    try {
      await api.register({
        email: form.email,
        emailCode: form.emailCode,
        name: form.name,
        phone: form.phone,
        phoneCountryCode: form.phoneCountryCode,
        limitCountry: form.limitCountry,
        customerType: 'INDIVIDUAL',
        inviteOrgCode: inviteOrg || undefined,
        referrerUserId: inviteLocked
          ? inviteRef || undefined
          : noReferrer
            ? undefined
            : selectedReferrer!.userId,
        noReferrer: !inviteLocked && noReferrer ? true : undefined,
        bankAccounts: banks,
        walletAddress: form.walletAddress.trim(),
        walletNetwork: form.walletNetwork,
        walletLabel: form.walletLabel || undefined,
        wiseEnabled: form.remittanceEnabled,
        remittanceProvider: form.remittanceEnabled ? form.remittanceProvider || undefined : undefined,
        remittanceProviderOther:
          form.remittanceEnabled && form.remittanceProvider === 'OTHER'
            ? form.remittanceProviderOther.trim()
            : undefined,
        wiseSenderName: form.remittanceEnabled ? form.wiseSenderName.trim() : undefined,
        wiseSenderEmail: form.remittanceEnabled ? form.wiseSenderEmail.trim() : undefined,
        wiseSenderCountry: form.remittanceEnabled
          ? form.wiseSenderCountry.trim() || undefined
          : undefined,
      });
      setInfo(t('auth.registerPendingApproval'));
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'EMAIL_TAKEN' || err.code === 'CONFLICT')) {
        setError(t('auth.registerEmailTaken'));
      } else if (err instanceof ApiError && err.code === 'PHONE_TAKEN') {
        setError(t('auth.registerPhoneTaken'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome branding={branding} variant="register">
      <div className="w-full">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{t('auth.registerCustomerTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('auth.registerIndividualOnly')}</p>
          </div>
          <ReferenceClocks compact />
        </div>

        {individualNotice ? (
          <section
            className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 shadow-sm sm:text-sm"
            role="alert"
          >
            <h3 className="mb-2 text-[13px] font-bold tracking-tight text-amber-900 sm:text-sm">
              {individualNotice.title}
            </h3>
            <div className="whitespace-pre-wrap sm:columns-2 sm:gap-6">{individualNotice.body}</div>
          </section>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('auth.registerAccountSection')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t('auth.email')}
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                type="email"
              />
              <Field
                label={t('auth.name')}
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                <div className="min-w-0 flex-1">
                  <Field
                    label={t('auth.registerEmailCode')}
                    value={form.emailCode}
                    onChange={(v) => setForm({ ...form, emailCode: v })}
                  />
                </div>
                <button
                  type="button"
                  onClick={requestSendCode}
                  disabled={loading || sendingCode}
                  className="mt-6 min-h-11 shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {sendingCode ? t('common.loading') : t('auth.sendEmailCode')}
                </button>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-2">
                <div>
                  <label className="block text-sm font-medium">{t('usdt.phoneCountryCode')}</label>
                  <select
                    value={form.phoneCountryCode}
                    onChange={(e) => {
                      const phoneCountryCode = e.target.value;
                      setForm({
                        ...form,
                        phoneCountryCode,
                        limitCountry: limitCountryFromPhone(phoneCountryCode),
                      });
                    }}
                    className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                    required
                  >
                    {PHONE_COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label={t('auth.phone')}
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">{t('auth.limitCountry')}</label>
                <select
                  value={form.limitCountry}
                  onChange={(e) =>
                    setForm({ ...form, limitCountry: e.target.value as LimitCountryCode })
                  }
                  className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                  required
                >
                  {LIMIT_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {t(`auth.limitCountry.${c.code}` as 'auth.limitCountry.JP')}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{t('auth.limitCountryHint')}</p>
              </div>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {codeSent && info && (
              <p className="mt-2 text-sm text-green-700">{info}</p>
            )}
          </section>

          {inviteLocked ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
              {inviteHint || t('common.loading')}
            </div>
          ) : (
            <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-medium text-slate-800">{t('auth.referrerTitle')}</p>
              <p className="text-xs text-slate-600">{t('auth.referrerHint')}</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="referrerMode"
                    checked={noReferrer}
                    onChange={() => {
                      setNoReferrer(true);
                      setSelectedReferrer(null);
                      setReferrerHits([]);
                      setReferrerQuery('');
                    }}
                  />
                  {t('auth.referrerNone')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="referrerMode"
                    checked={!noReferrer}
                    onChange={() => setNoReferrer(false)}
                  />
                  {t('auth.referrerHas')}
                </label>
              </div>
              {!noReferrer && (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={referrerQuery}
                      onChange={(e) => setReferrerQuery(e.target.value)}
                      placeholder={t('auth.referrerQueryPlaceholder')}
                      className="auth-field mt-0 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => void searchReferrer()}
                      disabled={referrerSearching}
                      className="min-h-11 shrink-0 rounded-lg border border-blue-200 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {referrerSearching ? t('common.loading') : t('auth.referrerSearch')}
                    </button>
                  </div>
                  {referrerHits.length > 0 && (
                    <ul className="grid max-h-48 gap-1 overflow-auto rounded-lg border border-gray-200 bg-white p-1 sm:grid-cols-2">
                      {referrerHits.map((hit) => {
                        const selected = selectedReferrer?.userId === hit.userId;
                        return (
                          <li key={hit.userId}>
                            <button
                              type="button"
                              onClick={() => setSelectedReferrer(hit)}
                              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                                selected
                                  ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-200'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-medium">{hit.displayName}</span>
                              <span className="mt-0.5 block text-xs text-slate-500">{hit.email}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {selectedReferrer && (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      {t('auth.referrerSelected', {
                        name: selectedReferrer.displayName,
                        email: selectedReferrer.email,
                      })}
                    </p>
                  )}
                </>
              )}
            </section>
          )}

          <section className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
            <p className="text-xs font-semibold text-violet-900">{t('register.remittanceTitle')}</p>
            <p className="text-xs text-violet-800">{t('register.remittanceHint')}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="remittanceEnabled"
                  checked={!form.remittanceEnabled}
                  onChange={() =>
                    setForm({
                      ...form,
                      remittanceEnabled: false,
                      remittanceProvider: '',
                      remittanceProviderOther: '',
                    })
                  }
                />
                {t('register.remittanceNo')}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="remittanceEnabled"
                  checked={form.remittanceEnabled}
                  onChange={() =>
                    setForm({
                      ...form,
                      remittanceEnabled: true,
                      wiseSenderName: form.wiseSenderName || form.name,
                      wiseSenderEmail: form.wiseSenderEmail || form.email,
                    })
                  }
                />
                {t('register.remittanceYes')}
              </label>
            </div>
            {form.remittanceEnabled && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">{t('register.remittanceProvider')}</label>
                  <select
                    value={form.remittanceProvider}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        remittanceProvider: e.target.value,
                        remittanceProviderOther:
                          e.target.value === 'OTHER' ? form.remittanceProviderOther : '',
                      })
                    }
                    className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                    required
                  >
                    <option value="">{t('register.remittanceProviderPlaceholder')}</option>
                    {REMITTANCE_PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                {form.remittanceProvider === 'OTHER' && (
                  <Field
                    label={t('register.remittanceOtherName')}
                    value={form.remittanceProviderOther}
                    onChange={(v) => setForm({ ...form, remittanceProviderOther: v })}
                  />
                )}
                <Field
                  label={t('register.wiseSenderName')}
                  value={form.wiseSenderName}
                  onChange={(v) => setForm({ ...form, wiseSenderName: v })}
                />
                <Field
                  label={t('register.wiseSenderEmail')}
                  value={form.wiseSenderEmail}
                  onChange={(v) => setForm({ ...form, wiseSenderEmail: v })}
                  type="email"
                />
                <Field
                  label={t('register.wiseSenderCountry')}
                  value={form.wiseSenderCountry}
                  onChange={(v) => setForm({ ...form, wiseSenderCountry: v })}
                  optional
                />
              </div>
            )}
          </section>

          <CustomerBankAccountsForm
            accounts={form.bankAccounts}
            accountHolderDefault={form.name}
            onChange={(bankAccounts) => setForm({ ...form, bankAccounts })}
          />

          <section className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold text-emerald-900">{t('users.walletSection')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t('wallets.label')}
                value={form.walletLabel}
                onChange={(v) => setForm({ ...form, walletLabel: v })}
                optional
              />
              <div>
                <label className="block text-sm font-medium">{t('users.walletNetwork')}</label>
                <select
                  value={form.walletNetwork}
                  onChange={(e) => setForm({ ...form, walletNetwork: e.target.value })}
                  className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                  required
                >
                  {WALLET_NETWORKS.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label={t('wallets.address')}
                  value={form.walletAddress}
                  onChange={(v) => setForm({ ...form, walletAddress: v })}
                />
              </div>
            </div>
          </section>

          {error && !confirmSendOpen && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {info && !codeSent && <p className="text-sm text-green-700">{info}</p>}

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/login" className="text-center text-sm text-blue-600 hover:underline sm:text-left">
              {t('auth.backToLogin')}
            </Link>
            <button
              type="submit"
              disabled={loading || sendingCode}
              className="min-h-12 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white disabled:opacity-50 sm:min-w-[220px]"
            >
              {loading ? t('auth.registering') : t('auth.registerSubmit')}
            </button>
          </div>
        </form>
      </div>
      {confirmSendOpen && (
        <AuthConfirmDialog
          title={t('auth.sendEmailCodeConfirmTitle')}
          message={t('auth.sendEmailCodeConfirmBody', {
            email: form.email.trim().toLowerCase(),
          })}
          confirmLabel={t('auth.sendEmailCodeConfirm')}
          busy={sendingCode}
          onConfirm={confirmSendCode}
          onClose={() => {
            if (!sendingCode) setConfirmSendOpen(false);
          }}
        />
      )}
    </AuthChrome>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
        required={!optional}
      />
    </div>
  );
}
