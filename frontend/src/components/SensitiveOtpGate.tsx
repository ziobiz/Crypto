'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { ContentCard } from '@/components/layout/ContentCard';

const STORAGE_KEY = 'crypto-sensitive-token';

export function SensitiveOtpGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await api.stepUpOtp(code);
      sessionStorage.setItem(STORAGE_KEY, res.sensitiveToken);
      setUnlocked(true);
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
      setError(e instanceof ApiError ? t('auth.otpInvalid') : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <ContentCard title={t('cost.otpTitle')}>
      <p className="pg-hint mb-3">{t('cost.otpHint')}</p>
      <OtpCodeInput value={code} onChange={setCode} onComplete={() => undefined} />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button type="button" className="pg-btn pg-btn-primary mt-3" disabled={loading || code.length < 6} onClick={submit}>
        {loading ? t('auth.otpVerifying') : t('auth.otpVerify')}
      </button>
    </ContentCard>
  );
}
