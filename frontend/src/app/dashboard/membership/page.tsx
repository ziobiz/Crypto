'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  membershipApi,
  type PaidMemberGrade,
  type PaidMembershipProduct,
} from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { periodDaysToMode } from '@/lib/membership-period';

type ProductRow = PaidMembershipProduct & {
  id: string;
  name: string;
  grade: PaidMemberGrade;
  displayCode?: string;
  cryptoCheckoutReady: boolean;
  priceUsd?: number;
  chargeAmount?: number;
  equivalents?: { USD: number; USDT: number; USDC: number; EURC: number };
};

export default function MembershipShopPage() {
  const t = useT();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [status, setStatus] = useState<{
    active: boolean;
    displayCode: string;
    paidMemberUntil: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    membershipApi
      .products()
      .then((res) => {
        setProducts(res.products as ProductRow[]);
        setStatus(res.status);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  async function buy(productId: string, payMeans: 'CARD' | 'CRYPTO') {
    setBuying(`${productId}-${payMeans}`);
    setError('');
    setMsg('');
    try {
      const res = await membershipApi.purchase({ productId, payMeans });
      if (res.cryptoPending) {
        setMsg(t('paidMembership.cryptoNotReady'));
        return;
      }
      const url = res.icopayCheckout?.payUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      setMsg(t('paidMembership.purchaseCreated'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setBuying(null);
    }
  }

  if (loading) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <div className="pg-stack">
      <h1 className="text-lg font-semibold text-slate-900">{t('paidMembership.shopTitle')}</h1>
      <p className="pg-hint">{t('paidMembership.shopDesc')}</p>
      <p className="pg-callout border-red-200 bg-red-50 text-sm font-semibold text-red-600">
        {t('paidMembership.noRefund')}
      </p>
      <p className="pg-hint text-xs text-slate-700">{t('paidMembership.icopayRedirectHint')}</p>
      <p className="pg-hint text-xs">{t('paidMembership.priceUsdBasis')}</p>

      {status && (
        <ContentCard>
          <p className="text-sm">
            {t('paidMembership.currentStatus')}:{' '}
            <span className="font-semibold">{status.displayCode}</span>
            {status.active && status.paidMemberUntil
              ? ` · ${t('paidMembership.until')} ${new Date(status.paidMemberUntil).toLocaleString()}`
              : ` · ${t('paidMembership.notPaid')}`}
          </p>
        </ContentCard>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="pg-hint text-sm">{msg}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.length === 0 && (
          <p className="pg-hint">{t('paidMembership.noProducts')}</p>
        )}
        {products.map((p) => {
          const cardOk = p.payMeans === 'CARD' || p.payMeans === 'BOTH';
          const cryptoOk = p.payMeans === 'CRYPTO' || p.payMeans === 'BOTH';
          const usd = p.priceUsd ?? p.price;
          const charge = p.chargeAmount ?? p.price;
          const eq = p.equivalents;
          const period = periodDaysToMode(p.periodDays);
          const periodText =
            period.mode === 'months'
              ? t('paidMembership.periodMonthsOption', { n: String(period.months) })
              : t('paidMembership.periodDaysOption', { n: String(period.days) });
          const title = p.name || p.displayCode || p.grade;
          return (
            <ContentCard key={p.id}>
              <div className="space-y-3">
                <p className="text-base font-semibold text-slate-900">{title}</p>
                <p className="text-2xl font-bold tabular-nums text-sky-800">
                  {usd.toLocaleString()} <span className="text-lg tracking-wide">USD</span>
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-800">
                  {t('paidMembership.shopCharge')}: {charge.toLocaleString()} {p.currency}
                </p>
                {eq && (
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    USDT {eq.USDT} · USDC {eq.USDC} · EURC {eq.EURC}
                  </p>
                )}
                <p className="pg-hint text-xs">{periodText}</p>
                <p className="text-[11px] font-semibold text-red-600">
                  {t('paidMembership.noRefundShort')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cardOk && (
                    <button
                      type="button"
                      className="pg-btn pg-btn-primary text-xs"
                      disabled={buying != null}
                      onClick={() => void buy(p.id, 'CARD')}
                    >
                      {buying === `${p.id}-CARD`
                        ? t('hq.saving')
                        : t('paidMembership.buyCard')}
                    </button>
                  )}
                  {cryptoOk && (
                    <button
                      type="button"
                      className="pg-btn pg-btn-secondary text-xs"
                      disabled={buying != null}
                      onClick={() => void buy(p.id, 'CRYPTO')}
                      title={t('paidMembership.cryptoNotReady')}
                    >
                      {t('paidMembership.buyCrypto')}
                    </button>
                  )}
                </div>
              </div>
            </ContentCard>
          );
        })}
      </div>
    </div>
  );
}
