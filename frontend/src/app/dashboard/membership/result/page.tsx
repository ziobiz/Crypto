'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { membershipApi } from '@/lib/api';

function MembershipResultInner() {
  const t = useT();
  const params = useSearchParams();
  const orderNo = params.get('orderNo') || '';
  const [msg, setMsg] = useState('');
  const [paid, setPaid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!orderNo) {
      setMsg(t('paidMembership.resultMissingOrder'));
      return;
    }
    membershipApi
      .syncOrder(orderNo)
      .then((res) => {
        setPaid(res.paid);
        setMsg(res.paid ? t('paidMembership.resultPaid') : t('paidMembership.resultPending'));
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [orderNo, t]);

  return (
    <div className="pg-stack max-w-lg">
      <h1 className="text-lg font-semibold">{t('paidMembership.resultTitle')}</h1>
      <p className="pg-hint text-sm">{msg}</p>
      {paid && (
        <Link href="/dashboard/membership" className="pg-btn pg-btn-primary text-xs inline-flex">
          {t('paidMembership.backToShop')}
        </Link>
      )}
      {!paid && orderNo && (
        <button
          type="button"
          className="pg-btn pg-btn-secondary text-xs"
          onClick={() => {
            void membershipApi.syncOrder(orderNo).then((res) => {
              setPaid(res.paid);
              setMsg(res.paid ? t('paidMembership.resultPaid') : t('paidMembership.resultPending'));
            });
          }}
        >
          {t('paidMembership.refreshStatus')}
        </button>
      )}
    </div>
  );
}

export default function MembershipResultPage() {
  return (
    <Suspense fallback={<p className="pg-hint">…</p>}>
      <MembershipResultInner />
    </Suspense>
  );
}