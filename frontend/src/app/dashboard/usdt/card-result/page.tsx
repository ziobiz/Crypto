'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { api } from '@/lib/api';
import {
  clearIcopayPendingReturn,
  pickIcopayOrderNoFromSearch,
  readIcopayPendingReturn,
} from '@/lib/icopay-return';

type Outcome = 'PAID' | 'DECLINED' | 'PENDING';

function UsdtCardResultInner() {
  const t = useT();
  const router = useRouter();
  const search = useSearchParams();
  const [phase, setPhase] = useState<'resolving' | 'done' | 'error'>('resolving');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [err, setErr] = useState('');
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pending = readIcopayPendingReturn();
    const orderNo =
      pickIcopayOrderNoFromSearch(search) || pending?.orderNo || '';
    const ticketIdParam =
      search.get('ticketId') || search.get('ticket_id') || pending?.ticketId || '';

    api.usdt
      .cardReturn({ orderNo: orderNo || undefined, ticketId: ticketIdParam || undefined })
      .then((r) => {
        if (cancelled) return;
        clearIcopayPendingReturn();
        const next = r.outcome as Outcome;
        setOutcome(next);
        setTicketId(r.ticketId);
        setPhase('done');
        const q =
          next === 'PAID'
            ? 'cardReturn=paid'
            : next === 'DECLINED'
              ? 'cardReturn=declined'
              : 'cardReturn=pending';
        timer = setTimeout(() => {
          if (!cancelled) router.replace(`/dashboard/usdt/${r.ticketId}?${q}`);
        }, next === 'PAID' ? 1600 : 900);
      })
      .catch((e) => {
        if (cancelled) return;
        if (pending?.ticketId) {
          clearIcopayPendingReturn();
          setOutcome('PENDING');
          setTicketId(pending.ticketId);
          setPhase('done');
          timer = setTimeout(() => {
            if (!cancelled) {
              router.replace(`/dashboard/usdt/${pending.ticketId}?cardReturn=pending`);
            }
          }, 900);
          return;
        }
        setErr(e instanceof Error ? e.message : t('usdt.cardResult.failed'));
        setPhase('error');
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, search, t]);

  const title =
    phase === 'resolving'
      ? t('usdt.cardResult.title')
      : outcome === 'PAID'
        ? t('usdt.cardResult.paidTitle')
        : outcome === 'DECLINED'
          ? t('usdt.cardResult.declinedTitle')
          : outcome === 'PENDING'
            ? t('usdt.cardResult.pendingTitle')
            : t('usdt.cardResult.title');

  const callout =
    outcome === 'PAID'
      ? 'pg-callout-success'
      : outcome === 'DECLINED'
        ? 'pg-callout-error'
        : 'pg-callout-warn';

  return (
    <div className="pg-stack max-w-lg">
      <h1 className="text-base font-semibold text-teal-800">{title}</h1>
      {phase === 'resolving' && <p className="pg-hint">{t('usdt.cardResult.resolving')}</p>}
      {phase === 'done' && outcome && (
        <div className={`pg-callout ${callout} space-y-2 text-sm`}>
          {outcome === 'PAID' && <p>{t('usdt.cardResult.paidBody')}</p>}
          {outcome === 'DECLINED' && <p>{t('usdt.detail.cardDeclined')}</p>}
          {outcome === 'PENDING' && <p>{t('usdt.detail.cardPendingHint')}</p>}
          {ticketId && (
            <a href={`/dashboard/usdt/${ticketId}?cardReturn=${outcome.toLowerCase()}`} className="pg-link">
              {t('usdt.cardResult.continueToDetail')}
            </a>
          )}
        </div>
      )}
      {phase === 'error' && (
        <div className="pg-callout pg-callout-error space-y-2 text-sm">
          <p>{err}</p>
          <a href="/dashboard/usdt" className="pg-link">
            {t('usdt.cardResult.backToList')}
          </a>
        </div>
      )}
    </div>
  );
}

export default function UsdtCardResultPage() {
  const t = useT();
  return (
    <Suspense
      fallback={
        <div className="pg-stack max-w-lg">
          <h1 className="text-base font-semibold text-teal-800">{t('usdt.cardResult.title')}</h1>
          <p className="pg-hint">{t('usdt.cardResult.resolving')}</p>
        </div>
      }
    >
      <UsdtCardResultInner />
    </Suspense>
  );
}
