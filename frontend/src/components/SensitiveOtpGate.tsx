'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { ContentCard } from '@/components/layout/ContentCard';

export const SENSITIVE_OTP_STORAGE_KEY = 'crypto-sensitive-token';

function hasStoredToken() {
  return typeof window !== 'undefined' && Boolean(sessionStorage.getItem(SENSITIVE_OTP_STORAGE_KEY));
}

function clearStoredToken() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(SENSITIVE_OTP_STORAGE_KEY);
}

export function isSensitiveOtpRequired(e: unknown): boolean {
  return e instanceof ApiError && e.code === 'SENSITIVE_OTP_REQUIRED';
}

export type SensitiveOtpRunResult<T> = { cancelled: true } | { cancelled: false; value: T };

type SensitiveOtpContextValue = {
  runWithOtp: <T>(fn: () => Promise<T>) => Promise<SensitiveOtpRunResult<T>>;
};

const SensitiveOtpCtx = createContext<SensitiveOtpContextValue | null>(null);

export function useSensitiveOtp(): SensitiveOtpContextValue {
  const ctx = useContext(SensitiveOtpCtx);
  if (!ctx) throw new Error('useSensitiveOtp must be used within SensitiveOtpGate');
  return ctx;
}

export function SensitiveOtpGate({
  children,
  lockContent = true,
}: {
  children: React.ReactNode;
  lockContent?: boolean;
}) {
  const t = useT();
  const [unlocked, setUnlocked] = useState(hasStoredToken);
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef<{ resolve: (ok: boolean) => void } | null>(null);
  const submittingRef = useRef(false);

  const promptOtp = useCallback(() => {
    if (hasStoredToken()) {
      setUnlocked(true);
      return Promise.resolve(true);
    }
    setCode('');
    setError('');
    setModalOpen(true);
    return new Promise<boolean>((resolve) => {
      pendingRef.current = { resolve };
    });
  }, []);

  const runWithOtp = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<SensitiveOtpRunResult<T>> => {
      const ok = await promptOtp();
      if (!ok) return { cancelled: true };
      try {
        return { cancelled: false, value: await fn() };
      } catch (e) {
        if (!isSensitiveOtpRequired(e)) throw e;
        clearStoredToken();
        setUnlocked(false);
        const ok2 = await promptOtp();
        if (!ok2) return { cancelled: true };
        return { cancelled: false, value: await fn() };
      }
    },
    [promptOtp],
  );

  async function submit(nextCode?: string) {
    const token = (nextCode ?? code).trim();
    if (token.length < 6 || submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const res = await api.stepUpOtp(token);
      sessionStorage.setItem(SENSITIVE_OTP_STORAGE_KEY, res.sensitiveToken);
      setUnlocked(true);
      setModalOpen(false);
      setCode('');
      pendingRef.current?.resolve(true);
      pendingRef.current = null;
    } catch (e) {
      clearStoredToken();
      setUnlocked(false);
      if (e instanceof ApiError && (e.code === 'INVALID_OTP' || e.code === 'OTP_INVALID')) {
        setError(t('auth.otpInvalid'));
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError(t('common.loadFailed'));
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  function cancelModal() {
    pendingRef.current?.resolve(false);
    pendingRef.current = null;
    setModalOpen(false);
    setCode('');
    setError('');
  }

  const form = (
    <>
      <p className="pg-hint mb-3">{lockContent ? t('cost.otpHint') : t('merchantUsers.otpRequired')}</p>
      <OtpCodeInput
        value={code}
        onChange={setCode}
        onComplete={(c) => void submit(c)}
        disabled={loading}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        className="pg-btn pg-btn-primary mt-3"
        disabled={loading || code.length < 6}
        onClick={() => void submit()}
      >
        {loading ? t('auth.otpVerifying') : t('auth.otpVerify')}
      </button>
    </>
  );

  const showPageGate = lockContent && !unlocked;
  const showModal = !lockContent && modalOpen;

  return (
    <SensitiveOtpCtx.Provider value={{ runWithOtp }}>
      {showPageGate ? <ContentCard title={t('cost.otpTitle')}>{form}</ContentCard> : children}
      {showModal ? (
        <div className="pg-modal-overlay" role="dialog" aria-modal="true">
          <div className="pg-modal max-w-md">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('merchantUsers.otpRequired')}</h2>
            </div>
            <div className="pg-modal-body">{form}</div>
            <div className="pg-modal-foot">
              <button type="button" className="pg-btn pg-btn-secondary" onClick={cancelModal} disabled={loading}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SensitiveOtpCtx.Provider>
  );
}
