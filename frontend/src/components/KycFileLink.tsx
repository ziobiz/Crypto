'use client';

import { useEffect, useState } from 'react';
import { api, ApiError, getToken } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-base';
import { useT } from '@/context/LocaleProvider';
import { OtpCodeInput } from '@/components/OtpCodeInput';

const API_URL = getApiBaseUrl();

export function KycFileLink({
  id,
  fileName,
  purposeLabel,
}: {
  id: string;
  fileName: string;
  purposeLabel: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_URL}/api/kyc/attachments/${id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('file');
        return res.blob();
      })
      .then((blob) => setUrl(URL.createObjectURL(blob)))
      .catch(console.error);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  if (!url) return <span className="text-sm text-gray-500">{fileName}</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="pg-link text-sm">
      {purposeLabel} · {fileName}
    </a>
  );
}

const IDENTITY_OTP_TOKEN = 'crypto-kyc-identity-token';
const IDENTITY_OTP_UNTIL = 'crypto-kyc-identity-until';

function readIdentityOtpToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(IDENTITY_OTP_TOKEN);
  const until = Number(sessionStorage.getItem(IDENTITY_OTP_UNTIL) || 0);
  if (!token || !Number.isFinite(until) || until <= Date.now()) {
    sessionStorage.removeItem(IDENTITY_OTP_TOKEN);
    sessionStorage.removeItem(IDENTITY_OTP_UNTIL);
    return null;
  }
  return token;
}

function storeIdentityOtpToken(token: string, minutes: number) {
  const hold = Math.min(720, Math.max(1, Math.round(minutes) || 60));
  sessionStorage.setItem(IDENTITY_OTP_TOKEN, token);
  sessionStorage.setItem(IDENTITY_OTP_UNTIL, String(Date.now() + hold * 60_000));
}

function clearIdentityOtpToken() {
  sessionStorage.removeItem(IDENTITY_OTP_TOKEN);
  sessionStorage.removeItem(IDENTITY_OTP_UNTIL);
}

export function IdentityDocOpen({
  id,
  label,
  holdMinutes = 60,
}: {
  id: string;
  label: string;
  holdMinutes?: number;
}) {
  const t = useT();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [otpError, setOtpError] = useState('');

  async function openBlob(sensitiveToken: string) {
    const blob = await api.kyc.openIdentityFile(id, sensitiveToken);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function openDoc() {
    setError('');
    const cached = readIdentityOtpToken();
    if (!cached) {
      setCode('');
      setOtpError('');
      setModalOpen(true);
      return;
    }
    setBusy(true);
    try {
      await openBlob(cached);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SENSITIVE_OTP_REQUIRED') {
        clearIdentityOtpToken();
        setCode('');
        setOtpError('');
        setModalOpen(true);
      } else {
        setError(e instanceof Error ? e.message : t('common.loadFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(nextCode?: string) {
    const token = (nextCode ?? code).trim();
    if (token.length < 6 || busy) return;
    setOtpError('');
    setBusy(true);
    try {
      const res = await api.stepUpOtp(token, 'kyc_identity');
      storeIdentityOtpToken(res.sensitiveToken, res.expiresInMinutes ?? holdMinutes);
      setModalOpen(false);
      setCode('');
      await openBlob(res.sensitiveToken);
    } catch (e) {
      clearIdentityOtpToken();
      if (e instanceof ApiError && (e.code === 'INVALID_OTP' || e.code === 'OTP_INVALID')) {
        setOtpError(t('auth.otpInvalid'));
      } else if (e instanceof ApiError) {
        setOtpError(e.message);
      } else {
        setOtpError(t('common.loadFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-slate-700">{label}</p>
      <p className="pg-hint">{t('kyc.identityEncrypted', { minutes: holdMinutes })}</p>
      <button type="button" className="pg-btn pg-btn-secondary text-sm" disabled={busy} onClick={() => void openDoc()}>
        {busy ? t('common.loading') : t('kyc.identityOpen')}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {modalOpen ? (
        <div className="pg-modal-overlay" role="dialog" aria-modal="true">
          <div className="pg-modal max-w-md">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('kyc.identityOpen')}</h2>
            </div>
            <div className="pg-modal-body">
              <p className="pg-hint mb-3">{t('kyc.identityEncrypted', { minutes: holdMinutes })}</p>
              <OtpCodeInput
                value={code}
                onChange={setCode}
                onComplete={(c) => void submitOtp(c)}
                disabled={busy}
              />
              {otpError ? <p className="mt-2 text-sm text-red-600">{otpError}</p> : null}
              <button
                type="button"
                className="pg-btn pg-btn-primary mt-3"
                disabled={busy || code.length < 6}
                onClick={() => void submitOtp()}
              >
                {busy ? t('auth.otpVerifying') : t('auth.otpVerify')}
              </button>
            </div>
            <div className="pg-modal-foot">
              <button
                type="button"
                className="pg-btn pg-btn-secondary"
                disabled={busy}
                onClick={() => {
                  setModalOpen(false);
                  setCode('');
                  setOtpError('');
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
