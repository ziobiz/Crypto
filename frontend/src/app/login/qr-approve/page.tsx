'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { useBranding } from '@/hooks/useBranding';

function QrApproveInner() {
  const t = useT();
  const branding = useBranding();
  const { user, loading: authLoading } = useAuth();
  const search = useSearchParams();
  const ticket = search.get('ticket') || '';
  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasToken =
    typeof window !== 'undefined' && Boolean(sessionStorage.getItem('token'));

  useEffect(() => {
    if (!ticket) {
      setStatus('error');
      setError(t('auth.qrApproveFailed'));
      return;
    }
    void api
      .qrInfo(ticket)
      .then((info) => {
        if (info.status === 'EXPIRED' || info.status === 'CONSUMED') {
          setStatus('error');
          setError(t('auth.qrExpired'));
        } else {
          setStatus('ready');
        }
      })
      .catch((e) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : t('auth.qrApproveFailed'));
      });
  }, [ticket, t]);

  const approve = async () => {
    if (!ticket || !hasToken) return;
    setBusy(true);
    setError('');
    try {
      await api.qrApprove(ticket);
      setStatus('done');
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : t('auth.qrApproveFailed'),
      );
    } finally {
      setBusy(false);
    }
  };

  const goLogin = () => {
    const next = `/login/qr-approve?ticket=${ticket}`;
    sessionStorage.setItem('crypto_login_next', next);
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  };

  return (
    <AuthChrome branding={branding}>
      <div className="w-full">
        <h2 className="text-xl font-bold">{t('auth.qrApproveTitle')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('auth.qrApproveHint')}</p>

        {status === 'loading' && <p className="mt-6 text-sm text-slate-500">{t('common.loading')}</p>}

        {status === 'done' && (
          <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            {t('auth.qrApproveDone')}
          </p>
        )}

        {status === 'error' && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {status === 'ready' && (
          <div className="mt-6 space-y-4">
            {authLoading ? (
              <p className="text-sm text-slate-500">{t('common.loading')}</p>
            ) : !user || !hasToken ? (
              <>
                <p className="text-sm text-amber-800">{t('auth.qrApproveNeedLogin')}</p>
                <button
                  type="button"
                  onClick={goLogin}
                  className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 text-white"
                >
                  {t('auth.login')}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">{user.email}</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void approve()}
                  className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
                >
                  {busy ? t('auth.otpVerifying') : t('auth.qrApproveBtn')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </AuthChrome>
  );
}

export default function QrApprovePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">…</div>}>
      <QrApproveInner />
    </Suspense>
  );
}
