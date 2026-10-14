'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { startAuthentication } from '@simplewebauthn/browser';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import { useLocale, useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { useBranding } from '@/hooks/useBranding';
import type { Locale } from '@/i18n/locales';
import { getAdminWebOrigin, getMemberWebOrigin, isAdminWebHost } from '@/lib/site-host';

type Step =
  | 'credentials'
  | 'changePassword'
  | 'enrollEmail'
  | 'enrollTotp'
  | 'loginOtp'
  | 'loginBio'
  | 'loginQr'
  | 'anonQr';

/** 로그인 앞단 유형 — 기업은 최소 폼만, 개인은 복구·QR, 신규는 가입 (admin 호스트는 staff 고정) */
type Audience = 'corporate' | 'individual' | 'register' | 'staff';

type InactiveNoticeMessages = Partial<Record<Locale, string>> & { KR?: string };

export default function LoginPage() {
  const { completeLogin } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const [audience, setAudience] = useState<Audience>('corporate');
  const [adminHost, setAdminHost] = useState(false);
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [changeToken, setChangeToken] = useState('');
  const [enrollToken, setEnrollToken] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [error, setError] = useState('');
  const [inactiveNoticeMessages, setInactiveNoticeMessages] = useState<InactiveNoticeMessages | null>(
    null,
  );
  const [staffAdminUrl, setStaffAdminUrl] = useState<string | null>(null);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [webauthnAvailable, setWebauthnAvailable] = useState(false);
  const [qrLoginAvailable, setQrLoginAvailable] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrTicket, setQrTicket] = useState('');
  const branding = useBranding();
  const otpSubmitLock = useRef(false);
  const bioAutoTried = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get('next');
    if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
      sessionStorage.setItem('crypto_login_next', nextParam);
    }

    if (isAdminWebHost()) {
      setAdminHost(true);
      setAudience('staff');
      const hash = window.location.hash || '';
      const ht = hash.match(/^#ht=(.+)$/);
      if (params.get('handoff') === '1' && ht?.[1]) {
        const handoffToken = decodeURIComponent(ht[1]);
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        );
        setLoading(true);
        void completeLogin(handoffToken)
          .catch((err) => {
            setError(
              err instanceof ApiError && err.code === 'MERCHANT_USE_MEMBER_HOST'
                ? t('auth.audience.merchantUseMemberHost')
                : err instanceof Error
                  ? err.message
                  : t('auth.loginFailed'),
            );
          })
          .finally(() => setLoading(false));
        return;
      }
    } else {
      const aud = params.get('audience');
      if (aud === 'corporate' || aud === 'individual' || aud === 'register') {
        setAudience(aud);
      } else if (params.has('register') || window.location.search.includes('register=invite')) {
        setAudience('register');
      }
    }

    if (window.location.search.includes('register=invite')) {
      setInfo(t('auth.registerInviteOnlyHint'));
    }
    const idle =
      window.location.search.includes('idle=1') || Boolean(sessionStorage.getItem('crypto_idle_minutes'));
    if (idle) {
      const min = Number(sessionStorage.getItem('crypto_idle_minutes')) || 30;
      setInfo(t('auth.idleLogout', { min }));
    }
    if (window.location.search.includes('otpReset=1')) {
      const token = sessionStorage.getItem('crypto_otp_enroll_token');
      const masked = sessionStorage.getItem('crypto_otp_enroll_email') || '';
      sessionStorage.removeItem('crypto_otp_enroll_token');
      sessionStorage.removeItem('crypto_otp_enroll_email');
      if (token) {
        setEnrollToken(token);
        setMaskedEmail(masked);
        setStep('enrollEmail');
        setInfo(t('auth.recoverOtpEnrollHint'));
        void api.otpEnrollSendEmail(token).then(() => setInfo(t('auth.otpEnrollEmailSent'))).catch(() => undefined);
      } else {
        setInfo(t('auth.recoverOtpLoginHint'));
      }
    }
  }, [t, completeLogin]);

  useEffect(() => {
    if (!inactiveNoticeMessages) return;
    const msg =
      inactiveNoticeMessages[locale] ||
      inactiveNoticeMessages.KR ||
      inactiveNoticeMessages.US ||
      t('auth.accountInactiveDefault');
    setError(msg);
  }, [locale, inactiveNoticeMessages, t]);

  const finishSession = async (token: string) => {
    await completeLogin(token);
  };

  const withOtpLock = async (fn: () => Promise<void>) => {
    if (otpSubmitLock.current || loading) return;
    otpSubmitLock.current = true;
    setError('');
    setInactiveNoticeMessages(null);
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
      otpSubmitLock.current = false;
    }
  };

  const enterSecondFactor = (opts: {
    otpToken: string;
    maskedEmail: string;
    webauthnAvailable?: boolean;
    qrLoginAvailable?: boolean;
  }) => {
    setOtpToken(opts.otpToken);
    setMaskedEmail(opts.maskedEmail);
    const bio = Boolean(opts.webauthnAvailable);
    const qr = Boolean(opts.qrLoginAvailable);
    setWebauthnAvailable(bio);
    setQrLoginAvailable(qr);
    bioAutoTried.current = false;
    if (bio) {
      setStep('loginBio');
    } else {
      setStep('loginOtp');
    }
    setOtpCode('');
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInactiveNoticeMessages(null);
    setStaffAdminUrl(null);
    if (!turnstileToken) {
      setError(t('auth.turnstileRequired'));
      return;
    }
    setLoading(true);
    try {
      const loginAudience: 'corporate' | 'individual' | 'staff' =
        adminHost || audience === 'staff'
          ? 'staff'
          : audience === 'individual'
            ? 'individual'
            : 'corporate';
      const res = await api.login(
        email.trim().toLowerCase(),
        password.trim(),
        turnstileToken,
        loginAudience,
      );
      if ('mustChangePassword' in res && res.mustChangePassword) {
        setChangeToken(res.changeToken);
        setStep('changePassword');
        return;
      }
      if ('mustSetupOtp' in res && res.mustSetupOtp) {
        setEnrollToken(res.enrollToken);
        setMaskedEmail(res.maskedEmail);
        setStep('enrollEmail');
        await api.otpEnrollSendEmail(res.enrollToken);
        setInfo(t('auth.otpEnrollEmailSent'));
        return;
      }
      if ('otpRequired' in res && res.otpRequired) {
        enterSecondFactor({
          otpToken: res.otpToken,
          maskedEmail: res.maskedEmail,
          webauthnAvailable: res.webauthnAvailable,
          qrLoginAvailable: res.qrLoginAvailable,
        });
        return;
      }
      if ('token' in res) {
        await finishSession(res.token);
      }
    } catch (err) {
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
      if (err instanceof ApiError && err.code === 'TURNSTILE_REQUIRED') {
        setError(t('auth.turnstileRequired'));
      } else if (err instanceof ApiError && err.code === 'TURNSTILE_FAILED') {
        setError(t('auth.turnstileFailed'));
      } else if (err instanceof ApiError && err.code === 'ACCOUNT_INACTIVE') {
        const details = err.details as
          | { inactiveNotice?: { messages?: InactiveNoticeMessages } }
          | undefined;
        const messages = details?.inactiveNotice?.messages;
        if (messages && typeof messages === 'object') {
          setInactiveNoticeMessages(messages);
          setError(
            messages[locale] || messages.KR || err.message || t('auth.accountInactiveDefault'),
          );
        } else {
          setInactiveNoticeMessages(null);
          setError(err.message || t('auth.accountInactiveDefault'));
        }
      } else if (err instanceof ApiError && err.code === 'MERCHANT_USE_MEMBER_HOST') {
        setError(t('auth.audience.merchantUseMemberHost'));
      } else if (err instanceof ApiError && err.code === 'STAFF_USE_ADMIN_HOST') {
        const details = err.details as { adminUrl?: string } | undefined;
        setStaffAdminUrl(details?.adminUrl || `${getAdminWebOrigin()}/login`);
        setError(t('auth.audience.staffUseAdminHost'));
      } else if (
        err instanceof ApiError &&
        (err.code === 'CORPORATE_AUDIENCE_ONLY' || err.code === 'INDIVIDUAL_AUDIENCE_ONLY')
      ) {
        setError(
          err.code === 'CORPORATE_AUDIENCE_ONLY'
            ? t('auth.audience.corporateOnly')
            : t('auth.audience.individualOnly'),
        );
      } else {
        setError(err instanceof Error ? err.message : t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.changePassword(changeToken, newPassword, confirmPassword);
      if ('mustSetupOtp' in res && res.mustSetupOtp) {
        setEnrollToken(res.enrollToken);
        setMaskedEmail(res.maskedEmail);
        setStep('enrollEmail');
        setEmailCode('');
        await api.otpEnrollSendEmail(res.enrollToken);
        setInfo(t('auth.otpEnrollEmailSent'));
        return;
      }
      if ('token' in res) {
        await finishSession(res.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.changePasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  const submitEnrollEmail = (code: string) =>
    withOtpLock(async () => {
      try {
        const res = await api.otpEnrollVerifyEmail(enrollToken, code);
        setEnrollToken(res.enrollToken);
        setOtpauthUrl(res.otpauthUrl);
        setStep('enrollTotp');
        setOtpCode('');
        setInfo(t('auth.otpScanHint'));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
        setEmailCode('');
      }
    });

  const submitEnrollTotp = (code: string) =>
    withOtpLock(async () => {
      try {
        const res = await api.otpEnrollActivate(enrollToken, code);
        await finishSession(res.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
        setOtpCode('');
      }
    });

  const submitLoginOtp = (code: string) =>
    withOtpLock(async () => {
      try {
        const res = await api.verifyOtp(otpToken, code);
        await finishSession(res.token);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'INVALID_OTP_TOKEN') {
          setError(t('auth.otpSessionExpired'));
          setStep('credentials');
          setOtpToken('');
        } else {
          setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
        }
        setOtpCode('');
      }
    });

  const runBiometric = useCallback(async () => {
    if (!otpToken || loading) return;
    setError('');
    setLoading(true);
    try {
      const options = await api.webauthnLoginOptions(otpToken);
      const assertion = await startAuthentication({ optionsJSON: options as never });
      const res = await api.webauthnLoginVerify(otpToken, assertion);
      await finishSession(res.token);
    } catch {
      setError(t('auth.bioFailed'));
      setStep('loginOtp');
    } finally {
      setLoading(false);
    }
  }, [otpToken, loading, t]);

  useEffect(() => {
    if (step !== 'loginBio' || !webauthnAvailable || bioAutoTried.current) return;
    bioAutoTried.current = true;
    void runBiometric();
  }, [step, webauthnAvailable, runBiometric]);

  const startBoundQr = async () => {
    setError('');
    setLoading(true);
    try {
      const created = await api.qrCreate(otpToken);
      setQrTicket(created.ticket);
      setQrUrl(created.approveUrl);
      setStep('loginQr');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.qrApproveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const startAnonQr = async () => {
    setError('');
    setLoading(true);
    try {
      const created = await api.qrCreateAnonymous();
      setQrTicket(created.ticket);
      setQrUrl(created.approveUrl);
      setStep('anonQr');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.qrApproveFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((step !== 'loginQr' && step !== 'anonQr') || !qrTicket) return;
    let cancelled = false;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const st = await api.qrStatus(qrTicket);
          if (cancelled) return;
          if (st.status === 'APPROVED') {
            clearInterval(timer);
            const res = await api.qrExchange(qrTicket);
            await finishSession(res.token);
          } else if (st.status === 'EXPIRED' || st.status === 'CONSUMED') {
            setError(t('auth.qrExpired'));
          }
        } catch {
          /* ignore poll errors */
        }
      })();
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [step, qrTicket, t]);

  const handleEnrollEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailCode.length === 6) submitEnrollEmail(emailCode);
  };

  const handleEnrollTotp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length > 0) submitEnrollTotp(otpCode);
  };

  const handleLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length > 0) submitLoginOtp(otpCode);
  };

  const resendEnrollEmail = async () => {
    setLoading(true);
    try {
      await api.otpEnrollSendEmail(enrollToken);
      setInfo(t('auth.otpResent'));
      setEmailCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const secondFactorNav = (
    <div className="mt-4 flex flex-wrap gap-2 text-sm">
      {webauthnAvailable && (
        <button
          type="button"
          className="rounded-lg border px-3 py-2"
          onClick={() => {
            setStep('loginBio');
            bioAutoTried.current = false;
          }}
        >
          {t('auth.bioUse')}
        </button>
      )}
      <button
        type="button"
        className="rounded-lg border px-3 py-2"
        onClick={() => {
          setStep('loginOtp');
        }}
      >
        {t('auth.bioUseOtp')}
      </button>
      {qrLoginAvailable && (
        <button type="button" className="rounded-lg border px-3 py-2" onClick={() => void startBoundQr()}>
          {t('auth.bioUseQr')}
        </button>
      )}
    </div>
  );

  return (
    <AuthChrome branding={branding}>
      <div className="w-full">
        {step === 'credentials' && (
          <>
            <h2 className="text-xl font-bold sm:text-2xl">
              {adminHost || audience === 'staff'
                ? t('auth.audience.staffTitle')
                : audience === 'register'
                  ? t('auth.audience.registerTitle')
                  : t('auth.loginTitle')}
            </h2>
            {!adminHost && audience !== 'staff' && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('auth.audience.selectLabel')}
                </span>
                <select
                  value={
                    audience === 'corporate' || audience === 'individual' || audience === 'register'
                      ? audience
                      : 'corporate'
                  }
                  onChange={(e) => {
                    const next = e.target.value as 'corporate' | 'individual' | 'register';
                    setAudience(next);
                    setError('');
                    setInfo('');
                  }}
                  className="auth-field w-full rounded-lg border border-gray-200 bg-sky-50 px-3 py-3 text-base text-slate-900"
                  aria-label={t('auth.audience.selectLabel')}
                >
                  <option value="corporate">{t('auth.audience.corporate')}</option>
                  <option value="individual">{t('auth.audience.individual')}</option>
                  <option value="register">{t('auth.audience.register')}</option>
                </select>
              </label>
            )}
            {info && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {info}
              </p>
            )}
            {audience === 'register' ? (
              <div className="mt-6 space-y-3 rounded-lg border border-sky-200 bg-sky-50/80 p-4">
                <p className="text-center text-sm font-medium text-slate-800">
                  {t('auth.individualSignupWarnShort')}
                </p>
                <p className="text-center text-xs leading-relaxed text-slate-600">
                  {t('auth.audience.registerHint')}
                </p>
                {branding?.customerRegistrationEnabled !== false ? (
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center rounded-lg bg-slate-800 py-3 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    {t('auth.registerIndividual')}
                  </Link>
                ) : (
                  <p className="text-center text-sm text-slate-500">{t('auth.audience.registerDisabled')}</p>
                )}
              </div>
            ) : (
              <>
                {audience === 'corporate' && (
                  <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    {t('auth.audience.corporateHint')}
                  </p>
                )}
                <form
                  onSubmit={handleCredentials}
                  className={`${audience === 'corporate' ? 'mt-4' : 'mt-6'} space-y-4`}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('auth.email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-field mt-1 w-full rounded-lg border border-gray-200 bg-sky-50 px-3 py-3 text-base"
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-field mt-1 w-full rounded-lg border border-gray-200 bg-sky-50 px-3 py-3 text-base"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileReset} />
                  {error && (
                    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      <p>{error}</p>
                      {staffAdminUrl && (
                        <a
                          href={staffAdminUrl}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-sky-300 px-3 py-2 font-medium text-sky-950 hover:bg-sky-400"
                        >
                          {t('auth.audience.goAdminLogin')}
                        </a>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
                  >
                    {loading ? t('auth.loggingIn') : t('auth.login')}
                  </button>
                </form>
                {audience === 'individual' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void startAnonQr()}
                      className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {t('auth.qrOnLogin')}
                    </button>
                    {branding?.accountRecoveryEnabled !== false && (
                      <Link
                        href="/recover"
                        className="mt-4 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 py-3 text-base font-medium text-slate-700 hover:bg-slate-200/80"
                      >
                        {t('auth.recoverLink')}
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
            {adminHost && (
              <a
                href={`${getMemberWebOrigin()}/login`}
                className="mt-3 flex w-full items-center justify-center rounded-lg bg-sky-300 py-3 font-medium text-sky-950 hover:bg-sky-400"
              >
                {t('auth.audience.merchantLogin')}
              </a>
            )}
          </>
        )}

        {step === 'changePassword' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.changePasswordTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.changePasswordDesc')}</p>
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <input type="password" placeholder={t('auth.newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="auth-field w-full rounded-lg border px-3 py-3 text-base" required minLength={8} />
              <input type="password" placeholder={t('auth.confirmPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="auth-field w-full rounded-lg border px-3 py-3 text-base" required minLength={8} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-3 text-white">{t('auth.changePasswordSubmit')}</button>
            </form>
          </>
        )}

        {step === 'enrollEmail' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.otpEnrollTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.otpEmailHint', { email: maskedEmail })}</p>
            {info && <p className="mt-2 text-sm text-green-700">{info}</p>}
            <form onSubmit={handleEnrollEmail} className="mt-6 space-y-4">
              <OtpCodeInput
                value={emailCode}
                onChange={setEmailCode}
                onComplete={submitEnrollEmail}
                disabled={loading}
                maxLength={6}
                completeAt={6}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {loading && <p className="text-center text-sm text-gray-500">{t('auth.otpVerifying')}</p>}
              <button type="submit" disabled={loading || emailCode.length !== 6} className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
                {loading ? t('auth.otpVerifying') : t('auth.otpVerify')}
              </button>
              <button type="button" onClick={resendEnrollEmail} disabled={loading} className="w-full rounded-lg border py-2 text-sm">
                {t('auth.otpResend')}
              </button>
            </form>
          </>
        )}

        {step === 'enrollTotp' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.otpGoogleTitle')}</h2>
            <p className="text-sm text-gray-600">{t('auth.otpScanHint')}</p>
            {otpauthUrl && (
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`} alt="QR" className="mx-auto my-4 rounded border" />
            )}
            <form onSubmit={handleEnrollTotp} className="space-y-4">
              <OtpCodeInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={submitEnrollTotp}
                disabled={loading}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {loading && <p className="text-center text-sm text-gray-500">{t('auth.otpVerifying')}</p>}
              <button type="submit" disabled={loading || otpCode.length === 0} className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
                {loading ? t('auth.otpVerifying') : t('auth.otpActivate')}
              </button>
            </form>
          </>
        )}

        {step === 'loginBio' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.bioTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.bioHint')}</p>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={loading}
              onClick={() => void runBiometric()}
              className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
            >
              {loading ? t('auth.otpVerifying') : t('auth.bioUse')}
            </button>
            {secondFactorNav}
          </>
        )}

        {step === 'loginOtp' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.otpTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.otpTotpHint')}</p>
            <form onSubmit={handleLoginOtp} className="mt-6 space-y-4">
              <OtpCodeInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={submitLoginOtp}
                disabled={loading}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {loading && <p className="text-center text-sm text-gray-500">{t('auth.otpVerifying')}</p>}
              <button type="submit" disabled={loading || otpCode.length === 0} className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
                {loading ? t('auth.otpVerifying') : t('auth.otpVerify')}
              </button>
            </form>
            {(webauthnAvailable || qrLoginAvailable) && secondFactorNav}
          </>
        )}

        {(step === 'loginQr' || step === 'anonQr') && (
          <>
            <h2 className="text-xl font-bold">{t('auth.qrTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.qrHint')}</p>
            {qrUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="Login QR"
                className="mx-auto my-4 rounded border"
              />
            )}
            <p className="text-center text-sm text-slate-600">{t('auth.qrWaiting')}</p>
            {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
            <button
              type="button"
              className="mt-4 w-full rounded-lg border py-2 text-sm"
              onClick={() => void (step === 'anonQr' ? startAnonQr() : startBoundQr())}
            >
              {t('auth.qrRefresh')}
            </button>
            {step === 'loginQr' && secondFactorNav}
            {step === 'anonQr' && (
              <button
                type="button"
                className="mt-2 w-full rounded-lg border py-2 text-sm"
                onClick={() => {
                  setStep('credentials');
                  setQrTicket('');
                  setQrUrl('');
                }}
              >
                {t('auth.otpBack')}
              </button>
            )}
          </>
        )}
      </div>
    </AuthChrome>
  );
}
