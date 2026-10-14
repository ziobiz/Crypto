'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api } from '@/lib/api';

const storageKey = (userId: string) => `tinpass_bio_hint_dismissed:${userId}`;

/**
 * 개인 고객 · 바이오 미등록 · 1회만 노출 (닫으면 다시 안 뜸).
 */
export function BioHintBanner() {
  const { user } = useAuth();
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const roleOk = user.role === 'CUSTOMER' || user.role === 'CUSTOMER_OPERATOR';
    const type = String(user.customerProfile?.customerType || '').toUpperCase();
    if (!roleOk || type !== 'INDIVIDUAL') return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey(user.id))) return;

    let cancelled = false;
    void api
      .webauthnCredentials()
      .then((res) => {
        if (cancelled) return;
        if (res.eligible && res.credentials.length === 0) {
          setVisible(true);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.customerProfile?.customerType]);

  if (!visible || !user) return null;

  const dismiss = () => {
    localStorage.setItem(storageKey(user.id), new Date().toISOString());
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-950"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t('auth.bioHintBannerTitle')}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-sky-900/80">
          {t('auth.bioHintBannerBody')}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href="/dashboard/account"
          className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
          onClick={dismiss}
        >
          {t('auth.bioHintBannerCta')}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
        >
          {t('auth.bioHintBannerDismiss')}
        </button>
      </div>
    </div>
  );
}
