'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { membershipApi } from '@/lib/api';

const PENDING_ORDER_KEY = 'tinpass_membership_pending_order';
const POLL_MS = 5000;
const POLL_MAX = 36; /* ~3분 */

type PayMeans = 'CARD' | 'CRYPTO' | '';

function readPendingPayMeans(orderNo: string): PayMeans {
  try {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { orderNo?: string; payMeans?: string };
    if (parsed.orderNo && parsed.orderNo !== orderNo) return '';
    const pm = String(parsed.payMeans || '').toUpperCase();
    if (pm === 'CRYPTO' || pm === 'CARD') return pm;
  } catch {
    /* ignore */
  }
  return '';
}

function MembershipResultInner() {
  const t = useT();
  const params = useSearchParams();
  const orderNo = params.get('orderNo') || '';
  const [msg, setMsg] = useState('');
  const [paid, setPaid] = useState<boolean | null>(null);
  const [payMeans, setPayMeans] = useState<PayMeans>('');
  const [autoChecking, setAutoChecking] = useState(false);
  const payMeansRef = useRef<PayMeans>('');

  useEffect(() => {
    if (!orderNo) {
      setMsg(t('paidMembership.resultMissingOrder'));
      return;
    }

    const initial = readPendingPayMeans(orderNo);
    payMeansRef.current = initial;
    setPayMeans(initial);

    let cancelled = false;
    let ticks = 0;
    let timer: number | undefined;

    const pendingText = (means: PayMeans) => {
      if (means === 'CRYPTO') return t('paidMembership.resultPendingCrypto');
      if (means === 'CARD') return t('paidMembership.resultPendingCard');
      return t('paidMembership.resultPending');
    };

    const run = async () => {
      try {
        const res = await membershipApi.syncOrder(orderNo);
        if (cancelled) return true;
        const pm = String(res.order?.payMeans || payMeansRef.current || '').toUpperCase();
        const means: PayMeans =
          pm === 'CRYPTO' || pm === 'CARD' ? pm : payMeansRef.current;
        if (means) {
          payMeansRef.current = means;
          setPayMeans(means);
        }
        if (res.paid) {
          setPaid(true);
          setMsg(t('paidMembership.resultPaid'));
          setAutoChecking(false);
          try {
            sessionStorage.removeItem(PENDING_ORDER_KEY);
          } catch {
            /* ignore */
          }
          return true;
        }
        setPaid(false);
        setMsg(pendingText(means));
        return false;
      } catch (e) {
        if (!cancelled) {
          setAutoChecking(false);
          setMsg(e instanceof Error ? e.message : t('common.loadFailed'));
        }
        return true;
      }
    };

    setAutoChecking(true);
    void run().then((done) => {
      if (cancelled || done) {
        if (!cancelled && done) setAutoChecking(false);
        return;
      }
      timer = window.setInterval(() => {
        ticks += 1;
        if (ticks > POLL_MAX) {
          if (timer) window.clearInterval(timer);
          setAutoChecking(false);
          return;
        }
        void run().then((finished) => {
          if (finished && timer) {
            window.clearInterval(timer);
            setAutoChecking(false);
          }
        });
      }, POLL_MS);
    });

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [orderNo, t]);

  return (
    <div className="pg-stack max-w-lg">
      <h1 className="text-lg font-semibold">{t('paidMembership.resultTitle')}</h1>
      {orderNo ? (
        <p className="text-sm font-semibold tabular-nums text-slate-800">
          {t('paidMembership.resultOrderNo', { orderNo })}
        </p>
      ) : null}
      <p className="pg-hint text-sm leading-relaxed">{msg}</p>
      {!paid && orderNo && autoChecking ? (
        <p className="text-xs text-sky-800">{t('paidMembership.resultAutoChecking')}</p>
      ) : null}
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
            void membershipApi
              .syncOrder(orderNo)
              .then((res) => {
                const pm = String(res.order?.payMeans || payMeans || '').toUpperCase();
                const means: PayMeans =
                  pm === 'CRYPTO' || pm === 'CARD' ? pm : payMeans;
                if (means) setPayMeans(means);
                setPaid(res.paid);
                if (res.paid) {
                  setMsg(t('paidMembership.resultPaid'));
                  setAutoChecking(false);
                  try {
                    sessionStorage.removeItem(PENDING_ORDER_KEY);
                  } catch {
                    /* ignore */
                  }
                } else if (means === 'CRYPTO') {
                  setMsg(t('paidMembership.resultPendingCrypto'));
                } else if (means === 'CARD') {
                  setMsg(t('paidMembership.resultPendingCard'));
                } else {
                  setMsg(t('paidMembership.resultPending'));
                }
              })
              .catch((e) => setMsg(e instanceof Error ? e.message : t('common.loadFailed')));
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
