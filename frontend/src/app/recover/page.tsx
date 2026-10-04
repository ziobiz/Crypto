'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { AuthConfirmDialog } from '@/components/AuthConfirmDialog';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { useBranding } from '@/hooks/useBranding';

type Mode = 'password' | 'otp';

export default function RecoverPage() {
  const t = useT();
  const router = useRouter();
  const branding = useBranding();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  useEffect(() => {
    if (branding?.accountRecoveryEnabled === false) {
      router.replace('/login');
    }
  }, [branding?.accountRecoveryEnabled, router]);

  const resetForm = (next: Mode) => {
    setMode(next);
    setCodeSent(false);
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setInfo('');
    setTurnstileToken('');
    setTurnstileReset((n) => n + 1);
    setConfirmSendOpen(false);
  };

  const requestSendCode = () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError(t('auth.recoverEmailRequired'));
      return;
    }
    if (!turnstileToken) {
      setError(t('auth.turnstileRequired'));
      return;
    }
    setConfirmSendOpen(true);
  };

  const confirmSendCode = async () => {
    setSendingCode(true);
    setError('');
    try {
      if (mode === 'password') {
        const res = await api.passwordForgotSendCode(email.trim().toLowerCase(), turnstileToken);
        setCodeSent(true);
        setInfo(t('auth.recoverCodeSent', { email: res.maskedEmail }));
      } else {
        const res = await api.otpForgotSendCode(email.trim().toLowerCase(), turnstileToken);
        setCodeSent(true);
        setInfo(t('auth.recoverCodeSent', { email: res.maskedEmail }));
      }
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
      setConfirmSendOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RECOVERY_DISABLED') {
        setError(t('auth.recoverDisabled'));
        router.replace('/login');
      } else if (
        err instanceof ApiError &&
        (err.code === 'EMAIL_SEND_FAILED' || err.code === 'EMAIL_NOT_CONFIGURED')
      ) {
        setError(t('auth.emailSendFailed'));
      } else if (err instanceof ApiError && err.code === 'TURNSTILE_REQUIRED') {
        setError(t('auth.turnstileRequired'));
      } else if (err instanceof ApiError && err.code === 'TURNSTILE_FAILED') {
        setError(t('auth.turnstileFailed'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.recoverFailed'));
      }
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
      setConfirmSendOpen(false);
    } finally {
      setSendingCode(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!turnstileToken) {
      setError(t('auth.turnstileRequired'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'password') {
        if (newPassword !== confirmPassword) {
          setError(t('users.passwordMismatch'));
          setLoading(false);
          return;
        }
        await api.passwordForgotReset({
          email: email.trim().toLowerCase(),
          code,
          newPassword,
          confirmPassword,
          turnstileToken,
        });
        setInfo(t('auth.recoverPasswordDone'));
        setTimeout(() => router.push('/login'), 1500);
      } else {
        const res = await api.otpForgotReset(email.trim().toLowerCase(), code, turnstileToken);
        if (res.enrollToken) {
          sessionStorage.setItem('crypto_otp_enroll_token', res.enrollToken);
          sessionStorage.setItem('crypto_otp_enroll_email', res.maskedEmail ?? '');
        }
        setInfo(t('auth.recoverOtpDone'));
        setTimeout(() => router.push('/login?otpReset=1'), 1200);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RECOVERY_DISABLED') {
        setError(t('auth.recoverDisabled'));
        router.replace('/login');
      } else if (err instanceof ApiError && (err.code === 'INVALID_CODE' || err.code === 'INVALID_RESET')) {
        setError(t('auth.recoverInvalidCode'));
      } else if (err instanceof ApiError && err.code === 'TURNSTILE_REQUIRED') {
        setError(t('auth.turnstileRequired'));
      } else if (err instanceof ApiError && err.code === 'TURNSTILE_FAILED') {
        setError(t('auth.turnstileFailed'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.recoverFailed'));
      }
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  if (branding?.customerRegistrationEnabled === false) {
    return (
      <AuthChrome branding={branding}>
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </AuthChrome>
    );
  }

  return (
    <AuthChrome branding={branding}>
      <div className="w-full">
        <h2 className="text-xl font-bold sm:text-2xl">{t('auth.recoverLink')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('auth.recoverHint')}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              mode === 'password' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200'
            }`}
            onClick={() => resetForm('password')}
          >
            {t('auth.recoverPasswordTab')}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              mode === 'otp' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200'
            }`}
            onClick={() => resetForm('otp')}
          >
            {t('auth.recoverOtpTab')}
          </button>
        </div>

        <form onSubmit={submitReset} className="mt-6 space-y-4">
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

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">{t('auth.registerEmailCode')}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="auth-field mt-1 w-full rounded-lg border border-gray-200 bg-sky-50 px-3 py-3 text-base"
                required={codeSent}
                inputMode="numeric"
                autoComplete="one-time-code"
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

          {mode === 'password' && (
            <>
              <input
                type="password"
                placeholder={t('auth.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-field w-full rounded-lg border px-3 py-3 text-base"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-field w-full rounded-lg border px-3 py-3 text-base"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </>
          )}

          <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileReset} />
          {info && <p className="text-sm text-green-700">{info}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !codeSent || !turnstileToken}
            className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
          >
            {mode === 'password' ? t('auth.recoverPasswordSubmit') : t('auth.recoverOtpSubmit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
      {confirmSendOpen && (
        <AuthConfirmDialog
          title={t('auth.sendEmailCodeConfirmTitle')}
          message={t('auth.sendEmailCodeConfirmBody', {
            email: email.trim().toLowerCase(),
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
