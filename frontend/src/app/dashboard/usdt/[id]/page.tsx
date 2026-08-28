'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtDepositContext, UsdtTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { AttachmentLink } from '@/components/AttachmentLink';
import { LocalizedFileInput } from '@/components/LocalizedFileInput';
import { formatFeeComponentLabel } from '@/lib/fee-component';
import type { TransactionFees } from '@/lib/api';

const LOCAL_PREMIUM_CURRENCIES = ['KRW', 'THB', 'JPY'] as const;

function hasLocalPremium(currency: string) {
  return (LOCAL_PREMIUM_CURRENCIES as readonly string[]).includes(currency);
}

function feeSummaryLabel(ticket: UsdtTicket, t: ReturnType<typeof useT>) {
  const policy = ticket.feePolicySnapshot;
  if (policy) {
    return [
      `${t('usdt.fxFee')} ${formatFeeComponentLabel(policy, 'fx')}`,
      `${t('usdt.gasFee')} ${formatFeeComponentLabel(policy, 'gas')}`,
      `${t('usdt.transferFee')} ${formatFeeComponentLabel(policy, 'transfer')}`,
      `${t('usdt.otherFee')} ${formatFeeComponentLabel(policy, 'other')}`,
    ].join(' · ');
  }
  const legacyPolicy = {
    fxFeeMode: 'percent' as const,
    fxFeePercent: ticket.fxFeePercentSnapshot,
    fxFeeUsdt: 0,
    gasFeeMode: 'fixed' as const,
    gasFeePercent: 0,
    gasFeeUsdt: ticket.gasFeeSnapshot,
    transferFeeMode: 'fixed' as const,
    transferFeePercent: 0,
    transferFeeUsdt: ticket.transferFeeSnapshot,
    otherFeeMode: 'fixed' as const,
    otherFeePercent: 0,
    otherFeeUsdt: ticket.otherFeeSnapshot,
  } satisfies TransactionFees;
  return [
    `${t('usdt.fxFee')} ${formatFeeComponentLabel(legacyPolicy, 'fx')}`,
    `${t('usdt.gasFee')} ${formatFeeComponentLabel(legacyPolicy, 'gas')}`,
    `${t('usdt.transferFee')} ${formatFeeComponentLabel(legacyPolicy, 'transfer')}`,
    `${t('usdt.otherFee')} ${formatFeeComponentLabel(legacyPolicy, 'other')}`,
  ].join(' · ');
}

function useCountdown(deadline: string | null | undefined) {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining('00:00:00');
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

export default function UsdtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const [ticket, setTicket] = useState<UsdtTicket | null>(null);
  const [depositCtx, setDepositCtx] = useState<UsdtDepositContext | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [depositTime, setDepositTime] = useState('');
  const [txId, setTxId] = useState('');
  const [actualUsdt, setActualUsdt] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  const countdown = useCountdown(ticket?.depositDeadlineAt);
  const isCurfex =
    ticket?.collectionProvider === 'CURFEX' || ticket?.curfexAutoDetect === true;

  const load = () => api.usdt.get(id).then(setTicket).catch(console.error);
  useEffect(() => {
    load();
    api.usdt.depositContext().then(setDepositCtx).catch(console.error);
  }, [id]);

  // CURFEX: poll for webhook/poll auto-detect
  useEffect(() => {
    if (!isCurfex || ticket?.status !== 'DEPOSIT_PROOF_PENDING') return;
    const idTimer = setInterval(() => {
      api.usdt
        .syncCurfexDeposit(id)
        .then((r) => {
          if (r.ticket) setTicket(r.ticket);
          else load();
        })
        .catch(() => load());
    }, 15_000);
    return () => clearInterval(idTimer);
  }, [id, isCurfex, ticket?.status]);

  useEffect(() => {
    if (ticket?.registeredBank?.accountHolder && !depositorName) {
      setDepositorName(ticket.registeredBank.accountHolder);
    }
  }, [ticket, depositorName]);

  if (!ticket) return <p className="pg-hint">{t('common.loading')}</p>;

  const isOperator = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_STAFF';
  const isCustomer = user?.role === 'CUSTOMER';
  const receivingFixed =
    depositCtx?.receivingAccounts?.[ticket.fiatCurrency as 'KRW' | 'JPY' | 'THB' | 'CNY'];
  const receiving =
    ticket.collectionProvider === 'CURFEX' && ticket.collectionAccount
      ? ticket.collectionAccount
      : receivingFixed;
  const isCurfexAccount = ticket.collectionProvider === 'CURFEX' && !!ticket.collectionAccount;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await api.usdt.uploadDepositProof(id, file, {
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        depositorName: depositorName || undefined,
        depositTransferredAt: depositTime || undefined,
      });
      await load();
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCurfexSync = async () => {
    setLoading(true);
    try {
      const r = await api.usdt.syncCurfexDeposit(id);
      if (r.ticket) setTicket(r.ticket);
      else await load();
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxDeposit = async () => {
    setLoading(true);
    try {
      const r = await api.usdt.simulateCurfexSandboxDeposit(id);
      if (r.ticket) setTicket(r.ticket);
      else await load();
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (status: string, extra?: Record<string, string | number>) => {
    setLoading(true);
    try {
      await api.usdt.updateStatus(id, { status, ...extra });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const rateLabel = `1 USDT = ${ticket.exchangeRate.toLocaleString()} ${ticket.fiatCurrency}`;
  const expectedRange =
    ticket.expectedUsdtMin != null && ticket.expectedUsdtMax != null
      ? `${ticket.expectedUsdtMin.toFixed(4)} ~ ${ticket.expectedUsdtMax.toFixed(4)} USDT`
      : `${ticket.expectedUsdtAmount.toFixed(4)} USDT`;

  const depositExpired =
    ticket.depositDeadlineAt &&
    new Date(ticket.depositDeadlineAt) < new Date() &&
    ticket.status === 'DEPOSIT_PROOF_PENDING';

  const isCard = ticket.paymentMethod === 'CARD';

  return (
    <div className="pg-stack">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold">{ticket.ticketNo}</p>
        <StatusBadge status={ticket.status} kind="usdt" />
        {isCard && <span className="pg-badge pg-badge-info">{t('usdt.paymentCard')}</span>}
        {ticket.bankMismatch && (
          <span className="pg-badge pg-badge-error">{t('usdt.bankMismatch')}</span>
        )}
      </div>

      {ticket.status === 'DEPOSIT_PROOF_PENDING' && ticket.depositDeadlineAt && !isCard && (
        <div className="pg-card">
          <div className={`pg-card-body pg-callout ${depositExpired ? 'pg-callout-error' : 'pg-callout-warn'}`}>
            <p className="font-medium">{t('usdt.depositDeadline')}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{countdown}</p>
            <p className="mt-1 pg-hint">
              {t('usdt.depositDeadlineDesc', { hours: String(depositCtx?.depositWindowHours ?? 2) })}
            </p>
          </div>
        </div>
      )}

      {isCard && (
        <div className="pg-card">
          <div className="pg-card-body pg-callout pg-callout-info">
            <p className="font-semibold">{t('usdt.detail.cardPayment')}</p>
            {ticket.cardChargeFiat != null && (
              <p className="mt-1">
                {t('usdt.detail.cardCharged')}: {formatCurrency(ticket.cardChargeFiat, ticket.fiatCurrency)}
              </p>
            )}
            {ticket.cardFeeFiatSnapshot != null && (
              <p>{t('usdt.detail.cardFeePaid')}: {formatCurrency(ticket.cardFeeFiatSnapshot, ticket.fiatCurrency)}</p>
            )}
            {ticket.cardLast4 && <p>{t('usdt.detail.cardLast4', { last4: ticket.cardLast4 })}</p>}
            {ticket.icopayTransactionId && (
              <p className="font-mono text-xs">{t('usdt.detail.icopayTx')}: {ticket.icopayTransactionId}</p>
            )}
            {ticket.cardPaymentStatus === 'DECLINED' && (
              <p className="mt-2 text-red-700">{t('usdt.detail.cardDeclined')}</p>
            )}
          </div>
        </div>
      )}

      {receiving && !isCard && (
        <div className="pg-card">
          <div className="pg-card-body pg-callout pg-callout-info">
            <p className="font-semibold">
              {isCurfexAccount ? t('usdt.curfexAccount') : t('usdt.companyAccount')}
            </p>
            <p className="mt-1">{receiving.bankName} · {receiving.accountNumber}</p>
            <p className="pg-muted">{receiving.accountHolder}</p>
            {isCurfexAccount && ticket.curfexRefNo && (
              <p className="mt-1 font-mono text-[11px] text-slate-600">
                {t('usdt.curfexRef')}: {ticket.curfexRefNo}
              </p>
            )}
            {isCurfexAccount && (
              <p className="mt-1 pg-hint">{t('usdt.curfexAccountHint')}</p>
            )}
          </div>
        </div>
      )}

      {ticket.registeredBank && (
        <div className="pg-card">
          <div className="pg-card-body text-xs">
            <p className="font-semibold">{t('usdt.registeredBank')}</p>
            <p className="mt-1">{ticket.registeredBank.bankName} · {ticket.registeredBank.accountNumber}</p>
            <p className="pg-muted">{ticket.registeredBank.accountHolder}</p>
            <p className="mt-1 pg-hint">{t('usdt.registeredBankOnly')}</p>
          </div>
        </div>
      )}

      <div className="pg-card">
        <div className="pg-card-body">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Item
          tone={0}
          label={t('usdt.paymentMethod')}
          value={ticket.paymentMethod === 'CARD' ? t('usdt.paymentCard') : t('usdt.paymentBank')}
        />
        <Item
          tone={1}
          label={t('usdt.col.inputMode')}
          value={
            ticket.paymentMethod === 'CARD' && ticket.cardChargeFiat != null
              ? t('usdt.inputModeCardCharge')
              : ticket.targetUsdtAmount != null
                ? t('usdt.inputModeTarget')
                : t('usdt.inputModeFiat')
          }
        />
        <Item
          tone={2}
          label={t('usdt.col.collection')}
          value={
            ticket.collectionProvider === 'CURFEX'
              ? t('usdt.collection.curfex')
              : t('usdt.collection.fixed')
          }
        />
        <Item tone={3} label={t('usdt.col.currency')} value={ticket.fiatCurrency} />
        <Item tone={4} label={t('usdt.detail.fiatAmount')} value={formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)} />
        {ticket.targetUsdtAmount != null && (
          <Item tone={5} label={t('usdt.targetUsdt')} value={`${ticket.targetUsdtAmount.toFixed(4)} USDT`} />
        )}
        {ticket.cardChargeFiat != null && (
          <Item
            tone={6}
            label={t('usdt.cardChargeLabel', { currency: ticket.fiatCurrency })}
            value={formatCurrency(ticket.cardChargeFiat, ticket.fiatCurrency)}
          />
        )}
        {ticket.cardFeePercentSnapshot != null && (
          <Item
            tone={7}
            label={t('usdt.cardFee', { pct: String(ticket.cardFeePercentSnapshot) })}
            value={
              ticket.cardFeeFiatSnapshot != null
                ? formatCurrency(ticket.cardFeeFiatSnapshot, ticket.fiatCurrency)
                : `${ticket.cardFeePercentSnapshot}%`
            }
          />
        )}
        <Item tone={0} label={t('usdt.detail.rate')} value={rateLabel} />
        <Item tone={1} label={t('usdt.detail.expected')} value={expectedRange} />
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZER') && (
          <Item
            tone={2}
            label={t('usdt.brokerUsdt')}
            value={`${ticket.brokerUsdtAmount != null ? ticket.brokerUsdtAmount.toFixed(4) : '—'} USDT`}
          />
        )}
        <Item
          tone={3}
          label={t('usdt.detail.fees')}
          value={
            hasLocalPremium(ticket.fiatCurrency) && ticket.kimchiPremiumPercent != null
              ? `${feeSummaryLabel(ticket, t)} (${
                  ticket.fiatCurrency === 'KRW'
                    ? t('usdt.kimchiPremiumFee', { pct: ticket.kimchiPremiumPercent.toFixed(2) })
                    : t('usdt.localPremiumFee', {
                        currency: ticket.fiatCurrency,
                        pct: ticket.kimchiPremiumPercent.toFixed(2),
                      })
                } ${ticket.kimchiPremiumFeeUsdt ?? 0})`
              : feeSummaryLabel(ticket, t)
          }
        />
        <Item
          tone={4}
          label={t('usdt.detail.fxFee')}
          value={`${ticket.fxFeePercentSnapshot}%`}
        />
        <Item
          tone={5}
          label={t('usdt.detail.gasFee')}
          value={`${ticket.gasFeeSnapshot} USDT`}
        />
        <Item
          tone={6}
          label={t('usdt.detail.transferFee')}
          value={`${ticket.transferFeeSnapshot} USDT`}
        />
        <Item
          tone={7}
          label={t('usdt.detail.otherFee')}
          value={`${ticket.otherFeeSnapshot} USDT`}
        />
        {hasLocalPremium(ticket.fiatCurrency) && ticket.fairExchangeRate != null && ticket.kimchiPremiumPercent != null && (
          <Item
            tone={0}
            label={ticket.fiatCurrency === 'KRW' ? t('usdt.detail.kimchi') : t('usdt.detail.localPremium')}
            value={
              ticket.fiatCurrency === 'KRW'
                ? t('usdt.kimchiPremiumNote', {
                    pct: ticket.kimchiPremiumPercent.toFixed(2),
                    fair: ticket.fairExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                    domestic: ticket.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                  })
                : t(`usdt.localPremiumNote.${ticket.fiatCurrency}` as 'usdt.localPremiumNote.THB', {
                    pct: ticket.kimchiPremiumPercent.toFixed(2),
                    fair: ticket.fairExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                    domestic: ticket.exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                  })
            }
          />
        )}
        {ticket.depositAmount != null && (
          <Item tone={1} label={t('usdt.detail.depositAmount')} value={formatCurrency(ticket.depositAmount, ticket.fiatCurrency)} />
        )}
        {ticket.depositorName && <Item tone={2} label={t('usdt.detail.depositor')} value={ticket.depositorName} />}
        {ticket.depositTransferredAt && (
          <Item tone={3} label={t('usdt.detail.depositTime')} value={formatDate(ticket.depositTransferredAt)} />
        )}
        {ticket.usdtTxId && <Item tone={4} label="TXID" value={ticket.usdtTxId} />}
        {ticket.actualUsdtAmount != null && (
          <Item tone={5} label={t('usdt.detail.actualUsdt')} value={`${ticket.actualUsdtAmount} USDT`} />
        )}
        {ticket.cancelReason && <Item tone={6} label={t('usdt.cancelReason')} value={ticket.cancelReason} />}
        {ticket.wallet && <Item tone={7} label={t('usdt.wallet')} value={`${ticket.wallet.address} (${ticket.wallet.network})`} />}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZER' || user?.role === 'SETTLEMENT_ADMIN' || user?.role === 'ORG_STAFF') && ticket.customer && (
          <Item
            tone={0}
            label={t('usdt.col.customer')}
            value={`${ticket.customer.user.name} / ${ticket.customer.user.email}`}
          />
        )}
        <Item tone={1} label={t('usdt.col.date')} value={formatDate(ticket.createdAt)} />
        {ticket.expectedCompleteAt && (
          <Item tone={2} label={t('usdt.col.expectedComplete')} value={formatDate(ticket.expectedCompleteAt)} />
        )}
          </dl>
        </div>
      </div>

      {ticket.status === 'COMPLETED' && (
        <div className="pg-card border-green-200 bg-green-50">
          <div className="pg-card-body text-sm text-green-800">
            {t('usdt.detail.receiptSent')}
          </div>
        </div>
      )}

      {isCustomer && ticket.status === 'DEPOSIT_PROOF_PENDING' && !depositExpired && !isCard && isCurfex && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.curfexWaitingTitle')}</div>
          <div className="pg-section-pad space-y-3">
            <p className="pg-hint">{t('usdt.curfexWaitingDesc')}</p>
            {ticket.curfexStatusCode && (
              <p className="text-xs font-mono text-slate-600">
                {t('usdt.curfexStatus')}: {ticket.curfexStatusCode}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCurfexSync}
                disabled={loading}
                className="pg-btn pg-btn-secondary disabled:opacity-50"
              >
                {t('usdt.curfexCheckStatus')}
              </button>
              <button
                type="button"
                onClick={handleSandboxDeposit}
                disabled={loading}
                className="pg-btn pg-btn-primary disabled:opacity-50"
              >
                {t('usdt.curfexSandboxSimulate')}
              </button>
            </div>
            <p className="text-[11px] text-gray-500">{t('usdt.curfexSandboxSimulateHint')}</p>
          </div>
        </div>
      )}

      {isCustomer && ticket.status === 'DEPOSIT_PROOF_PENDING' && !depositExpired && !isCard && !isCurfex && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.detail.depositInfo')}</div>
          <div className="pg-section-pad">
            <p className="pg-hint">{t('usdt.detail.depositInfoDesc')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              placeholder={t('usdt.detail.depositAmount')}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="pg-input"
            />
            <input
              placeholder={t('usdt.detail.depositor')}
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className="pg-input"
            />
            <input
              type="datetime-local"
              value={depositTime}
              onChange={(e) => setDepositTime(e.target.value)}
              className="pg-input"
            />
            <div className="sm:col-span-2">
              <LocalizedFileInput
                accept="image/*,.pdf"
                files={file ? [file] : []}
                onFiles={(next) => setFile(next[0] ?? null)}
              />
            </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="pg-btn pg-btn-primary mt-4 disabled:opacity-50"
            >
              {t('usdt.detail.submitReceipt')}
            </button>
          </div>
        </div>
      )}

      {isOperator && ticket.status === 'DEPOSIT_PROOF_PENDING' && isCurfex && !isCard && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.curfexOpsTitle')}</div>
          <div className="pg-section-pad flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCurfexSync}
              disabled={loading}
              className="pg-btn pg-btn-secondary disabled:opacity-50"
            >
              {t('usdt.curfexCheckStatus')}
            </button>
            <button
              type="button"
              onClick={handleSandboxDeposit}
              disabled={loading}
              className="pg-btn pg-btn-primary disabled:opacity-50"
            >
              {t('usdt.curfexSandboxSimulate')}
            </button>
          </div>
        </div>
      )}

      {isOperator && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.detail.admin')}</div>
          <div className="pg-section-pad">
            <p className="pg-hint">{t('usdt.detail.adminDesc')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
            {ticket.status === 'ADMIN_REVIEWING' && (
              <button
                onClick={() => handleStatus('TRANSFER_IN_PROGRESS')}
                disabled={loading || ticket.bankMismatch}
                className="pg-btn pg-btn-primary disabled:opacity-50"
              >
                {t('usdt.detail.startTransfer')}
              </button>
            )}
            {ticket.status === 'TRANSFER_IN_PROGRESS' && (
              <>
                <input
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="USDT TXID"
                  className="pg-input"
                />
                <input
                  value={actualUsdt}
                  onChange={(e) => setActualUsdt(e.target.value)}
                  placeholder={t('usdt.detail.actualUsdt')}
                  className="pg-input"
                />
                <button
                  onClick={() =>
                    handleStatus('COMPLETED', {
                      usdtTxId: txId,
                      ...(actualUsdt ? { actualUsdtAmount: parseFloat(actualUsdt) } : {}),
                    })
                  }
                  disabled={loading || !txId}
                  className="pg-btn pg-btn-primary disabled:opacity-50"
                >
                  {t('usdt.detail.complete')}
                </button>
              </>
            )}
            {ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && (
              <>
                <input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('usdt.cancelReason')}
                  className="pg-input"
                />
                <button
                  onClick={() =>
                    handleStatus('CANCELLED', {
                      cancelReason: cancelReason || t('usdt.adminCancelDefault'),
                    })
                  }
                  disabled={loading}
                  className="pg-btn pg-btn-secondary text-red-600 disabled:opacity-50"
                >
                  {t('usdt.cancelTrade')}
                </button>
              </>
            )}
          </div>
          {ticket.bankMismatch && (
            <p className="mt-2 text-sm text-red-600">{t('usdt.bankMismatchAdmin')}</p>
          )}
          </div>
        </div>
      )}

      {ticket.attachments.length > 0 && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.detail.attachments')}</div>
          <div className="pg-section-pad">
            <ul className="space-y-2">
              {ticket.attachments.map((a) => (
                <li key={a.id}><AttachmentLink attachment={a} /></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="pg-section">
        <div className="pg-section-head">{t('usdt.detail.history')}</div>
        <div className="pg-section-pad">
          <ol className="space-y-3">
          {ticket.statusHistory.map((h) => (
            <li key={h.id} className="border-l-2 pl-4 text-xs" style={{ borderColor: 'var(--shell-card-border)' }}>
              <StatusBadge status={h.toStatus} kind="usdt" />
              {h.note && <p className="mt-0.5">{h.note}</p>}
              <p className="mt-1 pg-hint">{h.changedBy.name} · {formatDate(h.createdAt)}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value, tone = 0 }: { label: string; value: string; tone?: number }) {
  const tones = [
    'pg-field-chip-sky',
    'pg-field-chip-rose',
    'pg-field-chip-amber',
    'pg-field-chip-emerald',
    'pg-field-chip-violet',
    'pg-field-chip-teal',
    'pg-field-chip-orange',
    'pg-field-chip-slate',
  ] as const;
  return (
    <div>
      <dt>
        <span className={`pg-field-chip ${tones[tone % tones.length]}`}>{label}</span>
      </dt>
      <dd className="pg-field-value">{value}</dd>
    </div>
  );
}
