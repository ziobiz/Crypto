'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { membershipAdminApi, type MembershipAdminOrderDetail } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

export default function MembershipAdminPaymentDetailPage() {
  const t = useT();
  const params = useParams();
  const orderNo = decodeURIComponent(String(params.orderNo || ''));
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [data, setData] = useState<MembershipAdminOrderDetail | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await membershipAdminApi.getOrder(orderNo);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNo]);

  const order = data?.order;
  const canAdminAct = data?.refundPolicy.adminCancelRefundEnabled === true;
  const canCancel = canAdminAct && order?.status === 'PENDING';
  const canRefund = canAdminAct && order?.status === 'PAID';

  function cancelOrder() {
    requestConfirm({
      title: t('membershipAdmin.action.cancel'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('membershipAdmin.action.cancel'),
      onConfirm: async () => {
        setBusy(true);
        setMsg('');
        try {
          await membershipAdminApi.cancelOrder(orderNo, note || undefined);
          setMsg(t('hq.saved'));
          await load();
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setBusy(false);
        }
      },
    });
  }

  function refundOrder() {
    requestConfirm({
      title: t('membershipAdmin.action.refund'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('membershipAdmin.action.refund'),
      onConfirm: async () => {
        setBusy(true);
        setMsg('');
        try {
          await membershipAdminApi.refundOrder(orderNo, {
            note: note || undefined,
            revokeBenefits: true,
          });
          setMsg(t('hq.saved'));
          await load();
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setBusy(false);
        }
      },
    });
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!order) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      {doubleConfirmDialog}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/membership-admin/payments" className="pg-link text-xs">
          ← {t('membershipAdmin.tab.payments')}
        </Link>
      </div>
      <div className="pg-card">
        <div className="pg-card-body space-y-2 text-sm">
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.orderNo')}: </span>
            <span className="font-mono font-semibold">{order.orderNo}</span>
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.status')}: </span>
            {t(`membershipAdmin.status.${order.status}` as MessageKey)}
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.customer')}: </span>
            {order.customerProfile?.user?.name} ({order.customerProfile?.user?.email})
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.grade')}: </span>
            {order.displayCode} ·{' '}
            {t('paidMembership.periodLabel', { days: String(order.periodDays) })}
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.amount')}: </span>
            {order.amount} {order.currency}
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.payMeans')}: </span>
            {t(`membershipAdmin.payMeans.${order.payMeans}` as MessageKey)}
            {order.payMeans === 'CRYPTO' &&
              ` · ${[order.cryptoAsset, order.cryptoNetwork].filter(Boolean).join(' / ') || t('membershipAdmin.cryptoSlotPending')}`}
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.createdAt')}: </span>
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="text-slate-500">{t('membershipAdmin.col.paidAt')}: </span>
            {order.paidAt ? new Date(order.paidAt).toLocaleString() : '—'}
          </p>
          {(order.failReason || order.adminNote) && (
            <p className="text-xs text-amber-900 whitespace-pre-wrap">
              <span className="text-slate-500">{t('membershipAdmin.col.remarks')}: </span>
              {[
                order.failReason
                  ? (() => {
                      const key = `membershipAdmin.failReason.${order.failReason}` as MessageKey;
                      const labeled = t(key);
                      return labeled === key ? order.failReason : labeled;
                    })()
                  : null,
                order.adminNote?.trim() || null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      {!canAdminAct && (
        <p className="pg-callout pg-callout-muted text-xs">{t('membershipAdmin.action.disabledHint')}</p>
      )}
      {(canCancel || canRefund) && (
        <div className="space-y-2">
          <textarea
            className="pg-input w-full text-xs"
            rows={2}
            placeholder={t('membershipAdmin.action.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <button
                type="button"
                className="pg-btn pg-btn-secondary text-xs"
                disabled={busy}
                onClick={cancelOrder}
              >
                {t('membershipAdmin.action.cancel')}
              </button>
            )}
            {canRefund && (
              <button
                type="button"
                className="pg-btn pg-btn-primary text-xs"
                disabled={busy}
                onClick={refundOrder}
              >
                {t('membershipAdmin.action.refund')}
              </button>
            )}
          </div>
          <p className="pg-hint text-xs">{t('membershipAdmin.action.refundHint')}</p>
        </div>
      )}
      {msg && <p className="pg-hint">{msg}</p>}
    </div>
  );
}
