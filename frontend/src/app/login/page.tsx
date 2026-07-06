'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { useBranding } from '@/hooks/useBranding';

type Step = 'credentials' | 'changePassword' | 'enrollEmail' | 'enrollTotp' | 'loginOtp';

export default function LoginPage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const t = useT();
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
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const branding = useBranding();

  const finishSession = async (token: string) => {
    setToken(token);
    await refresh();
    router.push('/dashboard');
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
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
        setOtpToken(res.otpToken);
        setMaskedEmail(res.maskedEmail);
        setStep('loginOtp');
        return;
      }
      if ('token' in res) {
        await finishSession(res.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
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

  const handleEnrollEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.otpEnrollVerifyEmail(enrollToken, emailCode);
      setEnrollToken(res.enrollToken);
      setOtpauthUrl(res.otpauthUrl);
      setStep('enrollTotp');
      setInfo(t('auth.otpScanHint'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.otpEnrollActivate(enrollToken, otpCode);
      await finishSession(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(otpToken, otpCode);
      await finishSession(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const resendEnrollEmail = async () => {
    setLoading(true);
    try {
      await api.otpEnrollSendEmail(enrollToken);
      setInfo(t('auth.otpResent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome branding={branding}>
      <div className="w-full">
        {step === 'credentials' && (
          <>
            <h2 className="text-xl font-bold sm:text-2xl">{t('auth.loginTitle')}</h2>
            <p className="mt-1 text-xs text-gray-500">{t('auth.initialPasswordHint')}</p>
            <form onSubmit={handleCredentials} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('auth.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-sky-50 px-3 py-3" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-sky-50 px-3 py-3" required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-blue-600 hover:underline">{t('auth.register')}</Link>
            </p>
          </>
        )}

        {step === 'changePassword' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.changePasswordTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.changePasswordDesc')}</p>
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <input type="password" placeholder={t('auth.newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border px-3 py-3" required minLength={8} />
              <input type="password" placeholder={t('auth.confirmPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border px-3 py-3" required minLength={8} />
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
              <input type="text" inputMode="numeric" maxLength={6} value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border px-3 py-3 text-center text-2xl tracking-widest" placeholder="000000" required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading || emailCode.length !== 6} className="w-full rounded-lg bg-blue-600 py-3 text-white">{t('auth.otpVerify')}</button>
              <button type="button" onClick={resendEnrollEmail} className="w-full rounded-lg border py-2 text-sm">{t('auth.otpResend')}</button>
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
              <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border px-3 py-3 text-center text-2xl tracking-widest" placeholder="000000" required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full rounded-lg bg-blue-600 py-3 text-white">{t('auth.otpActivate')}</button>
            </form>
          </>
        )}

        {step === 'loginOtp' && (
          <>
            <h2 className="text-xl font-bold">{t('auth.otpTitle')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('auth.otpTotpHint')}</p>
            <form onSubmit={handleLoginOtp} className="mt-6 space-y-4">
              <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border px-3 py-3 text-center text-2xl tracking-widest" placeholder="000000" required />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full rounded-lg bg-blue-600 py-3 text-white">{t('auth.otpVerify')}</button>
            </form>
          </>
        )}
      </div>
    </AuthChrome>
  );
}
