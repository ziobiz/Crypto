'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, EscrowDepositContext, EscrowTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { AttachmentLink } from '@/components/AttachmentLink';

const PENDING = ['ESCROW_CREATED', 'SELLER_ACCEPTED'];

function useCountdown(deadline: string | null | undefined) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) { setRemaining('00:00:00'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}

export default function EscrowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const [ticket, setTicket] = useState<EscrowTicket | null>(null);
  const [depositCtx, setDepositCtx] = useState<EscrowDepositContext | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [shipFile, setShipFile] = useState<File | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [depositTime, setDepositTime] = useState('');
  const [sellerPayoutAccount, setSellerPayoutAccount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const acceptanceCountdown = useCountdown(ticket?.acceptanceDeadlineAt);
  const depositCountdown = useCountdown(ticket?.depositDeadlineAt);

  const load = async () => {
    const data = await api.escrow.get(id);
    setTicket(data);
    if (data.status === 'BUYER_DEPOSIT_PROOF') {
      api.escrow.depositContext(id).then(setDepositCtx).catch(console.error);
    }
  };

  useEffect(() => { load().catch(console.error); }, [id]);

  const runAction = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('escrow.detail.actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) return <p className="pg-hint">{t('common.loading')}</p>;

  const isBuyer = user?.id === ticket.buyer.id;
  const isSeller = user?.id === ticket.seller.id;
  const isParty = isBuyer || isSeller;
  const myAccepted = isBuyer ? ticket.buyerAcceptedAt : isSeller ? ticket.sellerAcceptedAt : null;
  const needsMyAccept = isParty && PENDING.includes(ticket.status) && !myAccepted;
  const hasDepositProof = ticket.attachments.some(
    (a) => a.purpose === 'FIAT_DEPOSIT_RECEIPT' || a.purpose === 'USDT_TRANSFER_PROOF',
  );

  return (
    <div className="pg-stack">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{ticket.ticketNo}</p>
        <StatusBadge status={ticket.status} />
        <span className="pg-badge pg-badge-muted">{t(`escrow.tier.${ticket.tradeTier}` as 'escrow.tier.PREMIUM')}</span>
      </div>

      <p className="font-medium">{ticket.title}</p>
      {ticket.escrowTerms && <p className="text-sm text-gray-700"><strong>{t('escrow.escrowTerms')}:</strong> {ticket.escrowTerms}</p>}

      {ticket.requiresReview && (
        <div className="pg-callout pg-callout-warn text-sm">{t('escrow.cautionBanner')}</div>
      )}

      <div className="pg-callout text-sm">{t('escrow.disclaimerText')}</div>

      {ticket.status === 'VOIDED' && (
        <div className="pg-section">
          <div className="pg-section-head">{t('escrow.detail.voided')}</div>
          <div className="pg-section-pad">
            <p className="text-sm text-gray-600">{ticket.voidReason ?? t('escrow.detail.voidedDesc')}</p>
            {ticket.canRetry && (
              <Link href={`/dashboard/escrow/new?retry=${ticket.id}`} className="pg-btn pg-btn-primary mt-3 inline-block">
                {t('escrow.detail.retry')}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="pg-card">
        <div className="pg-card-body">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Item label={t('escrow.detail.amount')} value={formatCurrency(ticket.amount, ticket.currency)} />
            <Item label={t('escrow.col.tier')} value={t(`escrow.tierHint.${ticket.tradeTier}` as 'escrow.tierHint.PREMIUM')} />
            <Item label={t('escrow.detail.buyer')} value={`${ticket.buyer.name} (${ticket.buyer.customerType === 'CORPORATE' ? t('auth.corporate') : t('auth.individual')})`} />
            <Item label={t('escrow.detail.seller')} value={`${ticket.seller.name} (${ticket.seller.customerType === 'CORPORATE' ? t('auth.corporate') : t('auth.individual')})`} />
            {ticket.acceptanceDeadlineAt && PENDING.includes(ticket.status) && (
              <Item label={t('escrow.acceptanceDeadline')} value={`${formatDate(ticket.acceptanceDeadlineAt)} (${acceptanceCountdown})`} />
            )}
            {ticket.payoutScheduledAt && ticket.status === 'PAYOUT_SCHEDULED' && (
              <Item label={t('escrow.detail.payoutScheduled')} value={formatDate(ticket.payoutScheduledAt)} />
            )}
          </dl>
        </div>
      </div>

      {needsMyAccept && (
        <ActionBox title={t('escrow.detail.accept')}>
          <label className="mb-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)} className="mt-1" />
            <span>{t('escrow.disclaimer')}</span>
          </label>
          <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('escrow.detail.rejectReason')} className="pg-input mb-3 w-full" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runAction(() => api.escrow.accept(id))} disabled={loading || !disclaimerAccepted} className="pg-btn pg-btn-primary disabled:opacity-50">
              {t('escrow.detail.accept')}
            </button>
            <button onClick={() => runAction(() => api.escrow.reject(id, rejectReason || undefined))} disabled={loading} className="pg-btn pg-btn-secondary text-red-600">
              {t('escrow.detail.reject')}
            </button>
          </div>
        </ActionBox>
      )}

      {PENDING.includes(ticket.status) && isParty && myAccepted && (
        <ActionBox title={t('escrow.detail.waitingAccept')}>
          <p className="text-sm text-gray-600">{t('escrow.detail.awaitingSellerDesc')}</p>
        </ActionBox>
      )}

      {isBuyer && ticket.status === 'BUYER_DEPOSIT_PROOF' && (
        <ActionBox title={t('escrow.detail.buyerDeposit')}>
          {depositCtx && (
            <div className="mb-4 rounded border bg-gray-50 p-3 text-sm">
              <p>{t('escrow.detail.amount')}: <strong>{formatCurrency(depositCtx.amount, depositCtx.currency)}</strong></p>
              {depositCtx.depositDeadlineAt && <p>{t('escrow.detail.depositDeadline')}: {depositCountdown}</p>}
              {depositCtx.receivingAccount && (
                <p className="mt-2">{depositCtx.receivingAccount.bankName} {depositCtx.receivingAccount.accountNumber} ({depositCtx.receivingAccount.accountHolder})</p>
              )}
              {depositCtx.isUsdtEscrow && <p className="mt-2 text-amber-800">{t('escrow.detail.usdtDepositNote')}</p>}
            </div>
          )}
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-3 text-sm" />
          <button
            onClick={() => runAction(async () => {
              if (!file) return;
              await api.escrow.uploadBuyerDeposit(id, file, {
                depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
                depositorName: depositorName || undefined,
                depositTransferredAt: depositTime || undefined,
              });
              setFile(null);
            })}
            disabled={!file || loading}
            className="pg-btn pg-btn-primary disabled:opacity-50"
          >
            {t('escrow.detail.submitDeposit')}
          </button>
        </ActionBox>
      )}

      {isSeller && ticket.status === 'BUYER_DEPOSIT_PROOF' && hasDepositProof && (
        <ActionBox title={t('escrow.detail.startShipping')}>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setShipFile(e.target.files?.[0] ?? null)} className="mb-3 text-sm" />
          <button onClick={() => runAction(() => api.escrow.startShipping(id, shipFile ?? undefined))} disabled={loading} className="pg-btn pg-btn-primary disabled:opacity-50">
            {t('escrow.detail.startShipping')}
          </button>
        </ActionBox>
      )}

      {isBuyer && (ticket.status === 'SHIPPING_STARTED' || ticket.status === 'SELLER_FULFILLMENT_PROOF') && (
        <ActionBox title={t('escrow.detail.buyerApproval')}>
          <input value={sellerPayoutAccount} onChange={(e) => setSellerPayoutAccount(e.target.value)} placeholder={t('escrow.detail.sellerPayout')} className="pg-input mb-3 w-full" />
          <button onClick={() => runAction(() => api.escrow.buyerApproval(id, sellerPayoutAccount || undefined))} disabled={loading} className="pg-btn pg-btn-primary disabled:opacity-50">
            {t('escrow.detail.finalApproval')}
          </button>
        </ActionBox>
      )}

      {ticket.status === 'PAYOUT_SCHEDULED' && (
        <div className="pg-callout pg-callout-info text-sm">
          {ticket.tradeTier === 'PREMIUM' ? t('escrow.detail.payoutPremium') : t('escrow.detail.payoutBatch')}
          {ticket.payoutScheduledAt && <p className="mt-1">{formatDate(ticket.payoutScheduledAt)}</p>}
        </div>
      )}

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {ticket.attachments.length > 0 && (
        <div className="pg-section">
          <div className="pg-section-head">{t('escrow.detail.attachments')}</div>
          <div className="pg-section-pad">
            <ul className="space-y-2">{ticket.attachments.map((a) => <li key={a.id}><AttachmentLink attachment={a} /></li>)}</ul>
          </div>
        </div>
      )}

      <div className="pg-section">
        <div className="pg-section-head">{t('escrow.detail.history')}</div>
        <div className="pg-section-pad">
          <ol className="space-y-3">
            {ticket.statusHistory.map((h) => (
              <li key={h.id} className="border-l-2 border-blue-200 pl-4 text-sm">
                <StatusBadge status={h.toStatus} />
                <p className="mt-1 text-gray-500">{h.changedBy.name} · {formatDate(h.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (<div><dt className="text-gray-500">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>);
}

function ActionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pg-section">
      <div className="pg-section-head">{title}</div>
      <div className="pg-section-pad">{children}</div>
    </div>
  );
}
