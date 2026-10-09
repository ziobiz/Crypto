'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError, type ReferrerSearchHit } from '@/lib/api';
import { contactTakenMessageKey } from '@/lib/contact-taken';
import { useLocale, useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { AuthConfirmDialog } from '@/components/AuthConfirmDialog';
import { useBranding } from '@/hooks/useBranding';
import { resolveIndividualRegisterNotice } from '@/lib/individual-register-notice';
import { validateWalletAddressFormat } from '@/lib/wallet-address';
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
import {
  isAllowedRemittanceCountry,
  remittanceCountryGroups,
} from '@/constants/remittance-countries';
import {
  defaultNetworkForAsset,
  networksForAsset,
  type SettlementWalletAsset,
} from '@/constants/wallet-networks';

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
  const [contactAlert, setContactAlert] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [remainSec, setRemainSec] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailProof, setEmailProof] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [referrerBy, setReferrerBy] = useState<'email' | 'phone'>('email');
  const [referrerEmail, setReferrerEmail] = useState('');
  const [referrerPhone, setReferrerPhone] = useState('');
  const [referrerPhoneCc, setReferrerPhoneCc] = useState(defaultPhoneCountryCode(locale));
  const [referrerHits, setReferrerHits] = useState<ReferrerSearchHit[]>([]);
  const [referrerSearching, setReferrerSearching] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerSearchHit | null>(null);
  /** 기본: 추천자 없음 → 본사 직속 */
  const [noReferrer, setNoReferrer] = useState(true);
  /** 빠른송금 국가·이메일을 계정 정보와 같이 유지 */
  const [senderSameAsAccount, setSenderSameAsAccount] = useState(true);
  const [inviteLabel, setInviteLabel] = useState('');
  const settlementAsset: SettlementWalletAsset =
    branding?.settlementAsset === 'USDC' ? 'USDC' : 'USDT';
  const [form, setForm] = useState({
    email: '',
    name: '',
    legalFirstName: '',
    legalLastName: '',
    phone: '',
    phoneCountryCode: defaultPhoneCountryCode(locale),
    limitCountry: limitCountryFromPhone(defaultPhoneCountryCode(locale)) as LimitCountryCode,
    bankAccounts: emptyBankAccounts(),
    walletAddress: '',
    walletAsset: 'USDT' as SettlementWalletAsset,
    walletNetwork: defaultNetworkForAsset('USDT'),
    walletLabel: '',
    remittanceEnabled: false,
    remittanceProvider: '',
    remittanceProviderOther: '',
    wiseSenderName: '',
    wiseSenderEmail: '',
    wiseSenderCountry: '',
  });

  useEffect(() => {
    if (!branding?.settlementAsset) return;
    const asset: SettlementWalletAsset =
      branding.settlementAsset === 'USDC' ? 'USDC' : 'USDT';
    setForm((prev) => {
      const allowed = networksForAsset(asset);
      const networkOk = allowed.some((n) => n.value === prev.walletNetwork);
      return {
        ...prev,
        walletAsset: asset,
        walletNetwork: networkOk ? prev.walletNetwork : defaultNetworkForAsset(asset),
      };
    });
  }, [branding?.settlementAsset]);

  useEffect(() => {
    if (!codeExpiresAt || emailVerified) return;
    const tick = () => {
      setRemainSec(Math.max(0, Math.ceil((codeExpiresAt - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [codeExpiresAt, emailVerified]);

  useEffect(() => {
    const phone = defaultPhoneCountryCode(locale);
    setReferrerPhoneCc(phone);
    setForm((prev) => ({
      ...prev,
      phoneCountryCode: phone,
      limitCountry: limitCountryFromPhone(phone),
    }));
  }, [locale]);

  useEffect(() => {
    setForm((prev) => {
      const wiseSenderName = `${prev.legalFirstName} ${prev.legalLastName}`.trim() || prev.name;
      if (!senderSameAsAccount) {
        if (prev.wiseSenderName === wiseSenderName) return prev;
        return { ...prev, wiseSenderName };
      }
      const wiseSenderEmail = prev.email;
      const wiseSenderCountry = prev.limitCountry;
      if (
        prev.wiseSenderName === wiseSenderName &&
        prev.wiseSenderEmail === wiseSenderEmail &&
        prev.wiseSenderCountry === wiseSenderCountry
      ) {
        return prev;
      }
      return { ...prev, wiseSenderName, wiseSenderEmail, wiseSenderCountry };
    });
  }, [
    form.name,
    form.legalFirstName,
    form.legalLastName,
    form.email,
    form.limitCountry,
    senderSameAsAccount,
  ]);

  const inviteHint = useMemo(() => {
    if (!inviteLabel) return '';
    return t('auth.inviteLocked', { name: inviteLabel });
  }, [inviteLabel, t]);

  const senderCountries = useMemo(
    () => remittanceCountryGroups(form.limitCountry),
    [form.limitCountry],
  );

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
    const email = referrerEmail.trim().toLowerCase();
    const phone = referrerPhone.trim();
    if (referrerBy === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(t('auth.referrerEmailInvalid'));
        return;
      }
    } else if (!referrerPhoneCc.trim() || phone.replace(/\D/g, '').length < 8) {
      setError(t('auth.referrerPhoneRequired'));
      return;
    }
    setReferrerSearching(true);
    setReferrerHits([]);
    try {
      const res = await api.registerReferrerSearch(
        referrerBy === 'email'
          ? { email }
          : { phone, phoneCountryCode: referrerPhoneCc },
      );
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
      setEmailVerified(false);
      setEmailProof('');
      setEmailCode('');
      setSentEmail(email);
      const expMs = res.expiresAt
        ? new Date(res.expiresAt).getTime()
        : Date.now() + (res.expiresInSeconds ?? 300) * 1000;
      setCodeExpiresAt(Number.isFinite(expMs) ? expMs : Date.now() + 300_000);
      setInfo(
        t('auth.registerCodeSent', {
          email: res.maskedEmail || email,
        }),
      );
      setConfirmSendOpen(false);
    } catch (err) {
      const taken = contactTakenMessageKey(err);
      if (taken) {
        setContactAlert(t(taken));
        setError(t(taken));
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

  const resetEmailVerification = () => {
    setCodeSent(false);
    setEmailVerified(false);
    setEmailProof('');
    setEmailCode('');
    setSentEmail('');
    setCodeExpiresAt(null);
    setRemainSec(0);
  };

  const confirmEmailCode = async () => {
    setError('');
    const email = form.email.trim().toLowerCase();
    if (!codeSent || email !== sentEmail) {
      setError(t('auth.registerVerifyRequired'));
      return;
    }
    if (remainSec <= 0) {
      setError(t('auth.registerCodeExpired'));
      return;
    }
    const digits = emailCode.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError(t('auth.registerCodeInvalid'));
      return;
    }
    setVerifying(true);
    try {
      const res = await api.registerVerifyCode(email, digits, {
        inviteOrgCode: inviteOrg || undefined,
        referrerUserId: inviteRef || undefined,
      });
      setEmailProof(res.emailProof);
      setEmailVerified(true);
      setInfo(t('auth.registerVerifyDone'));
    } catch (err) {
      setEmailVerified(false);
      setEmailProof('');
      if (err instanceof ApiError && err.code === 'EMAIL_CODE_EXPIRED') {
        setRemainSec(0);
        setError(t('auth.registerCodeExpired'));
      } else {
        setError(t('auth.registerCodeInvalid'));
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailVerified || !emailProof) {
      setError(t('auth.registerVerifyRequired'));
      return;
    }
    const legalFirst = form.legalFirstName.trim();
    const legalLast = form.legalLastName.trim();
    const englishNameRe = /^[A-Za-z][A-Za-z .'-]*$/;
    if (!legalFirst || !legalLast || !englishNameRe.test(legalFirst) || !englishNameRe.test(legalLast)) {
      setError(t('auth.legalNameRequired'));
      return;
    }
    if (!inviteLocked && !noReferrer && !selectedReferrer) {
      setError(t('auth.referrerRequired'));
      return;
    }
    if (inviteLocked && !inviteOrg && !inviteRef) {
      setError(t('auth.inviteInvalid'));
      return;
    }
    const holderFallback = `${legalFirst} ${legalLast}`.trim() || form.name.trim();
    const banks = filledBankAccounts(
      form.bankAccounts.map((account) => ({
        ...account,
        accountHolder: account.accountHolder.trim() || holderFallback,
      })),
    );
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
    if (!validateWalletAddressFormat(form.walletNetwork, form.walletAddress).ok) {
      setError(t('wallets.err.addressInvalid'));
      return;
    }
    if (!form.walletLabel.trim()) {
      setError(t('wallets.err.nicknameRequired'));
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
      if (!form.name.trim() || !form.wiseSenderEmail.trim()) {
        setError(t('register.wiseRequired'));
        return;
      }
      const senderCountry = (form.wiseSenderCountry || form.limitCountry).trim().toUpperCase();
      if (!isAllowedRemittanceCountry(senderCountry)) {
        setError(t('register.senderCountryBlocked'));
        return;
      }
    }
    setLoading(true);
    try {
      await api.register({
        email: form.email,
        emailProof,
        name: form.name,
        legalFirstName: legalFirst,
        legalLastName: legalLast,
        phone: form.phone,
        phoneCountryCode: form.phoneCountryCode,
        limitCountry: form.limitCountry,
        customerType: 'INDIVIDUAL',
        inviteOrgCode: inviteOrg || undefined,
        referrerUserId: inviteLocked
          ? inviteRef || undefined
          : noReferrer
            ? undefined
            : selectedReferrer!.introducedByUserId &&
                selectedReferrer!.userId === selectedReferrer!.introducedByUserId
              ? undefined
              : selectedReferrer!.userId,
        introducedByUserId:
          inviteLocked || noReferrer ? undefined : selectedReferrer!.introducedByUserId,
        noReferrer: !inviteLocked && noReferrer ? true : undefined,
        bankAccounts: banks,
        walletAddress: form.walletAddress.trim(),
        walletNetwork: form.walletNetwork,
        walletLabel: form.walletLabel.trim(),
        wiseEnabled: form.remittanceEnabled,
        remittanceProvider: form.remittanceEnabled ? form.remittanceProvider || undefined : undefined,
        remittanceProviderOther:
          form.remittanceEnabled && form.remittanceProvider === 'OTHER'
            ? form.remittanceProviderOther.trim()
            : undefined,
        wiseSenderName: form.remittanceEnabled
          ? `${legalFirst} ${legalLast}`.trim()
          : undefined,
        wiseSenderEmail: form.remittanceEnabled ? form.wiseSenderEmail.trim() : undefined,
        wiseSenderCountry: form.remittanceEnabled
          ? (form.wiseSenderCountry || form.limitCountry).trim().toUpperCase()
          : undefined,
      });
      setInfo(t('auth.registerPendingApproval'));
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      const taken = contactTakenMessageKey(err);
      if (taken) {
        setContactAlert(t(taken));
        setError(t(taken));
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
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, email: v }));
                  if (sentEmail && v.trim().toLowerCase() !== sentEmail) resetEmailVerification();
                }}
                type="email"
              />
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <Field
                    label={t('auth.nickname')}
                    value={form.name}
                    onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={requestSendCode}
                  disabled={loading || sendingCode || verifying}
                  className="mt-6 min-h-11 shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {sendingCode ? t('common.loading') : t('auth.sendEmailCode')}
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
              <p className="text-xs font-semibold text-amber-950">{t('auth.legalNameSection')}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-900/90">
                {t('auth.legalNameWarning')}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field
                  label={t('auth.legalFirstName')}
                  value={form.legalFirstName}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      legalFirstName: v.replace(/[^A-Za-z .'-]/g, ''),
                    }))
                  }
                />
                <Field
                  label={t('auth.legalLastName')}
                  value={form.legalLastName}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      legalLastName: v.replace(/[^A-Za-z .'-]/g, ''),
                    }))
                  }
                />
              </div>
            </div>
          </section>

          {codeSent && (
            <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <p className="text-sm font-semibold text-slate-800">{t('auth.registerVerifyTitle')}</p>
              <p className="mt-1 text-xs text-slate-600">{t('auth.registerVerifyHint')}</p>
              {emailVerified ? (
                <p className="mt-3 text-sm font-medium text-green-700">{t('auth.registerVerifyDone')}</p>
              ) : (
                <>
                  <p
                    className={`mt-3 text-sm font-semibold ${
                      remainSec > 0 ? 'text-blue-800' : 'text-red-600'
                    }`}
                  >
                    {remainSec > 0
                      ? t('auth.registerCodeRemain', {
                          time: `${Math.floor(remainSec / 60)}:${String(remainSec % 60).padStart(2, '0')}`,
                        })
                      : t('auth.registerCodeExpired')}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <Field
                        label={t('auth.registerEmailCode')}
                        value={emailCode}
                        onChange={(v) => setEmailCode(v.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void confirmEmailCode()}
                      disabled={verifying || sendingCode || remainSec <= 0 || emailCode.length !== 6}
                      className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {verifying ? t('common.loading') : t('auth.registerVerifyConfirm')}
                    </button>
                    <button
                      type="button"
                      onClick={requestSendCode}
                      disabled={sendingCode || verifying}
                      className="min-h-11 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {t('auth.registerResendCode')}
                    </button>
                  </div>
                </>
              )}
              {info && <p className="mt-2 text-sm text-green-700">{info}</p>}
            </section>
          )}

          {!emailVerified && (
            <p className="text-sm text-amber-800">{t('auth.registerVerifyRequired')}</p>
          )}

          <fieldset
            disabled={!emailVerified}
            className="m-0 min-w-0 space-y-5 border-0 p-0 disabled:opacity-60"
          >
          <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
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
                      setReferrerEmail('');
                      setReferrerPhone('');
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
                  <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="referrerBy"
                        checked={referrerBy === 'email'}
                        onChange={() => {
                          setReferrerBy('email');
                          setReferrerHits([]);
                        }}
                      />
                      {t('auth.referrerByEmail')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="referrerBy"
                        checked={referrerBy === 'phone'}
                        onChange={() => {
                          setReferrerBy('phone');
                          setReferrerHits([]);
                        }}
                      />
                      {t('auth.referrerByPhone')}
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {referrerBy === 'email' ? (
                      <input
                        value={referrerEmail}
                        onChange={(e) => setReferrerEmail(e.target.value)}
                        placeholder={t('auth.referrerEmailPlaceholder')}
                        type="email"
                        className="auth-field mt-0 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                      />
                    ) : (
                      <div className="grid min-w-0 flex-1 grid-cols-[7rem_1fr] gap-2">
                        <select
                          value={referrerPhoneCc}
                          onChange={(e) => setReferrerPhoneCc(e.target.value)}
                          className="auth-field mt-0 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                          aria-label={t('usdt.phoneCountryCode')}
                        >
                          {PHONE_COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={referrerPhone}
                          onChange={(e) => setReferrerPhone(e.target.value)}
                          placeholder={t('auth.referrerPhonePlaceholder')}
                          inputMode="tel"
                          className="auth-field mt-0 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                        />
                      </div>
                    )}
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
                        const hitKey = hit.introducedByUserId || hit.userId;
                        const selected =
                          (selectedReferrer?.introducedByUserId || selectedReferrer?.userId) === hitKey;
                        return (
                          <li key={hitKey}>
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
                              {hit.customerType ? (
                                <span className="mt-0.5 block text-xs text-slate-600">
                                  {hit.customerType === 'CORPORATE'
                                    ? t('auth.corporate')
                                    : t('auth.individual')}
                                </span>
                              ) : null}
                              {hit.email ? (
                                <span className="mt-0.5 block text-xs text-slate-500">{hit.email}</span>
                              ) : null}
                              {hit.introducedByUserId ? (
                                <span className="mt-0.5 block text-xs text-slate-500">
                                  {t('auth.referrerRouted')}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {selectedReferrer && (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      {selectedReferrer.email
                        ? t('auth.referrerSelected', {
                            name: selectedReferrer.displayName,
                            email: selectedReferrer.email,
                          })
                        : selectedReferrer.displayName}
                      {selectedReferrer.customerType
                        ? ` · ${
                            selectedReferrer.customerType === 'CORPORATE'
                              ? t('auth.corporate')
                              : t('auth.individual')
                          }`
                        : ''}
                      {selectedReferrer.introducedByUserId ? ` · ${t('auth.referrerRouted')}` : ''}
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
                  onChange={() => {
                    setSenderSameAsAccount(true);
                    setForm({
                      ...form,
                      remittanceEnabled: false,
                      remittanceProvider: '',
                      remittanceProviderOther: '',
                    });
                  }}
                />
                {t('register.remittanceNo')}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="remittanceEnabled"
                  checked={form.remittanceEnabled}
                  onChange={() => {
                    setSenderSameAsAccount(true);
                    setForm({
                      ...form,
                      remittanceEnabled: true,
                      wiseSenderName: form.name,
                      wiseSenderEmail: form.email,
                      wiseSenderCountry: form.limitCountry,
                    });
                  }}
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
                <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={senderSameAsAccount}
                    onChange={(e) => setSenderSameAsAccount(e.target.checked)}
                  />
                  {t('register.sameAsAccount')}
                </label>
                <Field
                  label={t('register.wiseSenderName')}
                  value={form.name}
                  onChange={() => {}}
                  readOnly
                  hint={t('register.senderNameLocked')}
                />
                <Field
                  label={t('register.wiseSenderEmail')}
                  value={form.wiseSenderEmail}
                  onChange={(v) => {
                    setSenderSameAsAccount(false);
                    setForm({ ...form, wiseSenderEmail: v });
                  }}
                  type="email"
                />
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">{t('register.wiseSenderCountry')}</label>
                  <select
                    value={form.wiseSenderCountry || form.limitCountry}
                    onChange={(e) => {
                      setSenderSameAsAccount(false);
                      setForm({ ...form, wiseSenderCountry: e.target.value });
                    }}
                    className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                    required
                  >
                    <optgroup label={t('register.countryPrimary')}>
                      {senderCountries.priority.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t('register.countryOthers')}>
                      {senderCountries.others.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">{t('register.senderCountryHint')}</p>
                </div>
              </div>
            )}
          </section>

          <CustomerBankAccountsForm
            accounts={form.bankAccounts}
            accountHolderDefault={form.name}
            onChange={(bankAccounts) => setForm((prev) => ({ ...prev, bankAccounts }))}
          />

          <section className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold text-emerald-900">{t('users.walletSection')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={t('wallets.label')}
                value={form.walletLabel}
                onChange={(v) => setForm({ ...form, walletLabel: v })}
                hint={t('wallets.labelHint')}
              />
              <div>
                <label className="block text-sm font-medium">{t('wallets.col.asset')}</label>
                <select
                  value={form.walletAsset}
                  onChange={(e) => {
                    const walletAsset = e.target.value as SettlementWalletAsset;
                    setForm({
                      ...form,
                      walletAsset,
                      walletNetwork: defaultNetworkForAsset(walletAsset),
                    });
                  }}
                  className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                  required
                >
                  <option value={settlementAsset}>
                    {settlementAsset === 'USDC' ? 'USDC (Circle)' : 'USDT (Tether)'}
                  </option>
                </select>
                <p className="mt-1 text-xs text-gray-500">{t('register.walletAssetHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium">{t('users.walletNetwork')}</label>
                <select
                  value={form.walletNetwork}
                  onChange={(e) => setForm({ ...form, walletNetwork: e.target.value })}
                  className="auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                  required
                >
                  {networksForAsset(form.walletAsset).map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {form.walletAsset === 'USDC'
                    ? t('wallets.networkHintUsdc')
                    : t('wallets.networkHintUsdt')}
                </p>
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
          </fieldset>

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
              disabled={loading || sendingCode || verifying || !emailVerified}
              className="min-h-12 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white disabled:opacity-50 sm:min-w-[220px]"
            >
              {loading ? t('auth.registering') : t('auth.registerSubmit')}
            </button>
          </div>
        </form>
      </div>
      {contactAlert && (
        <AuthConfirmDialog
          title={t('auth.registerContactTakenTitle')}
          message={contactAlert}
          confirmLabel={t('common.confirm')}
          hideCancel
          onConfirm={() => setContactAlert('')}
          onClose={() => setContactAlert('')}
        />
      )}
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
  readOnly,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  optional?: boolean;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`auth-field mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base ${
          readOnly ? 'bg-slate-100 text-slate-700' : ''
        }`}
        required={!optional}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
