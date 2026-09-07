'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtDepositContext, UsdtTicket, ApiError } from '@/lib/api';
import { StatusBadge, buildUsdtStatusContext } from '@/components/StatusBadge';
import { OperatorAmountConfirmModal } from '@/components/OperatorAmountConfirmModal';
import {
  evaluateUsdtAmountVariance,
  usdtAmountRefFromTicket,
  type UsdtAmountVariance,
} from '@/lib/usdt-amount-guard';
import { formatCurrency, formatDate } from '@/lib/format';
import { AttachmentLink } from '@/components/AttachmentLink';
import { LocalizedFileInput } from '@/components/LocalizedFileInput';
import { DetailHero, DetailRow, DetailSection } from '@/components/DetailKvTable';
import { DualTimezoneDate } from '@/components/DualTimezoneDate';
import { useReferenceTimeState } from '@/components/ReferenceClocks';
import { formatFeeComponentLabel } from '@/lib/fee-component';
import type { TransactionFees } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

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
  const [completeConfirm, setCompleteConfirm] = useState<
    { kind: 'variance'; variance: UsdtAmountVariance } | { kind: 'missing-actual' } | null
  >(null);

  const { country, baseTimezone, serviceTimezone } = useReferenceTimeState();
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
    depositCtx?.receivingAccounts?.[ticket.fiatCurrency as 'KRW' | 'JPY' | 'THB' | 'CNY' | 'HKD'];
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

  const handleStatus = async (
    status: string,
    extra?: {
      usdtTxId?: string;
      actualUsdtAmount?: number;
      cancelReason?: string;
      amountConfirmAcknowledged?: boolean;
    },
  ) => {
    setLoading(true);
    try {
      await api.usdt.updateStatus(id, { status, ...extra });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const parseActualUsdtInput = () => {
    const raw = actualUsdt.trim();
    if (!raw) return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  };

  const submitComplete = async (acknowledged: boolean) => {
    if (!ticket || !txId.trim()) return;
    const parsed = parseActualUsdtInput();
    setCompleteConfirm(null);
    setLoading(true);
    try {
      await api.usdt.updateStatus(id, {
        status: 'COMPLETED',
        usdtTxId: txId.trim(),
        ...(parsed != null ? { actualUsdtAmount: parsed } : {}),
        ...(acknowledged ? { amountConfirmAcknowledged: true } : {}),
      });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'USDT_AMOUNT_CONFIRM_REQUIRED' && parsed != null) {
        setCompleteConfirm({
          kind: 'variance',
          variance: evaluateUsdtAmountVariance(usdtAmountRefFromTicket(ticket), parsed),
        });
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const requestComplete = () => {
    if (!ticket || !txId.trim()) return;
    const parsed = parseActualUsdtInput();
    if (parsed == null) {
      setCompleteConfirm({ kind: 'missing-actual' });
      return;
    }
    const variance = evaluateUsdtAmountVariance(usdtAmountRefFromTicket(ticket), parsed);
    if (variance.requiresConfirm) {
      setCompleteConfirm({ kind: 'variance', variance });
      return;
    }
    void submitComplete(false);
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
  const showAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ORGANIZER' ||
    user?.role === 'SETTLEMENT_ADMIN' ||
    user?.role === 'ORG_STAFF';
  const inputModeLabel =
    ticket.paymentMethod === 'CARD' && ticket.cardChargeFiat != null
      ? t('usdt.inputModeCardCharge')
      : ticket.targetUsdtAmount != null
        ? t('usdt.inputModeTarget')
        : t('usdt.inputModeFiat');
  const collectionLabel =
    ticket.paymentMethod === 'CARD'
      ? t('usdt.collection.na')
      : ticket.collectionProvider === 'CURFEX'
        ? t('usdt.collection.curfex')
        : t('usdt.collection.fixed');
  const heroToUsdt =
    ticket.actualUsdtAmount != null
      ? `${Number(ticket.actualUsdtAmount).toFixed(4)} USDT`
      : expectedRange;
  const usdtCtx = buildUsdtStatusContext(ticket);
  const isTestSeed = ticket.adminNote?.includes('[TEST R2]') ?? false;
  const expectedProofKeys = isCurfexAccount
    ? (['SOURCE_OF_FUNDS_DOC', 'FUNDING_FORECAST_REPORT'] as const)
    : (['SOURCE_OF_FUNDS_DOC', 'FUNDING_FORECAST_REPORT', 'FIAT_DEPOSIT_RECEIPT'] as const);
  const attachedPurposes = new Set(ticket.attachments.map((a) => a.purpose));

  return (
    <div className="pg-stack">
      <DetailHero
        fromLabel={formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}
        toLabel={heroToUsdt}
        meta={
          <>
            <StatusBadge status={ticket.status} kind="usdt" usdtContext={usdtCtx} />
            {isCard && <span className="pg-badge pg-badge-info">{t('usdt.paymentCard')}</span>}
            {ticket.bankMismatch && (
              <span className="pg-badge pg-badge-error">{t('usdt.bankMismatch')}</span>
            )}
            <span className="pg-muted text-xs">
              <DualTimezoneDate
                value={ticket.createdAt}
                baseTimezone={baseTimezone}
                serviceTimezone={serviceTimezone}
                country={country}
              />
            </span>
          </>
        }
      />

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

      <DetailSection title={t('usdt.detail.section.payment')}>
        <DetailRow label={t('usdt.col.ticketNo')} value={ticket.ticketNo} mono />
        <DetailRow
          label={t('usdt.paymentMethod')}
          value={ticket.paymentMethod === 'CARD' ? t('usdt.paymentCard') : t('usdt.paymentBank')}
        />
        <DetailRow label={t('usdt.col.inputMode')} value={inputModeLabel} />
        <DetailRow label={t('usdt.col.collection')} value={collectionLabel} />
        <DetailRow label={t('usdt.col.currency')} value={ticket.fiatCurrency} />
      </DetailSection>

      <DetailSection title={t('usdt.detail.section.amounts')}>
        <DetailRow
          label={t('usdt.detail.fiatAmount')}
          value={formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}
          highlight
        />
        {ticket.targetUsdtAmount != null && (
          <DetailRow
            label={t('usdt.targetUsdt')}
            value={`${ticket.targetUsdtAmount.toFixed(4)} USDT`}
          />
        )}
        <DetailRow label={t('usdt.detail.expected')} value={expectedRange} highlight />
        <DetailRow label={t('usdt.detail.rate')} value={rateLabel} />
        {ticket.cardChargeFiat != null && (
          <DetailRow
            label={t('usdt.cardChargeLabel', { currency: ticket.fiatCurrency })}
            value={formatCurrency(ticket.cardChargeFiat, ticket.fiatCurrency)}
          />
        )}
        {ticket.cardFeePercentSnapshot != null && (
          <DetailRow
            label={t('usdt.cardFee', { pct: String(ticket.cardFeePercentSnapshot) })}
            value={
              ticket.cardFeeFiatSnapshot != null
                ? formatCurrency(ticket.cardFeeFiatSnapshot, ticket.fiatCurrency)
                : `${ticket.cardFeePercentSnapshot}%`
            }
          />
        )}
        {hasLocalPremium(ticket.fiatCurrency) &&
          ticket.fairExchangeRate != null &&
          ticket.kimchiPremiumPercent != null && (
            <DetailRow
              label={
                ticket.fiatCurrency === 'KRW' ? t('usdt.detail.kimchi') : t('usdt.detail.localPremium')
              }
              value={
                ticket.fiatCurrency === 'KRW'
                  ? t('usdt.kimchiPremiumNote', {
                      pct: ticket.kimchiPremiumPercent.toFixed(2),
                      fair: ticket.fairExchangeRate.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      }),
                      domestic: ticket.exchangeRate.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      }),
                    })
                  : t(`usdt.localPremiumNote.${ticket.fiatCurrency}` as 'usdt.localPremiumNote.THB', {
                      pct: ticket.kimchiPremiumPercent.toFixed(2),
                      fair: ticket.fairExchangeRate.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }),
                      domestic: ticket.exchangeRate.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      }),
                    })
              }
            />
          )}
      </DetailSection>

      <DetailSection title={t('usdt.detail.section.fees')}>
        <DetailRow
          label={t('usdt.detail.fxFee')}
          value={`${ticket.fxFeePercentSnapshot}%`}
        />
        <DetailRow label={t('usdt.detail.gasFee')} value={`${ticket.gasFeeSnapshot} USDT`} />
        <DetailRow
          label={t('usdt.detail.transferFee')}
          value={`${ticket.transferFeeSnapshot} USDT`}
        />
        <DetailRow label={t('usdt.detail.otherFee')} value={`${ticket.otherFeeSnapshot} USDT`} />
        <DetailRow label={t('usdt.detail.fees')} value={feeSummaryLabel(ticket, t)} />
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZER') && (
          <DetailRow
            label={t('usdt.brokerUsdt')}
            value={`${ticket.brokerUsdtAmount != null ? ticket.brokerUsdtAmount.toFixed(4) : '—'} USDT`}
          />
        )}
      </DetailSection>

      {(ticket.depositAmount != null ||
        ticket.depositorName ||
        ticket.depositTransferredAt) && (
        <DetailSection title={t('usdt.detail.section.deposit')}>
          {ticket.depositAmount != null && (
            <DetailRow
              label={t('usdt.detail.depositAmount')}
              value={formatCurrency(ticket.depositAmount, ticket.fiatCurrency)}
              highlight
            />
          )}
          {ticket.depositorName && (
            <DetailRow label={t('usdt.detail.depositor')} value={ticket.depositorName} />
          )}
          {ticket.depositTransferredAt && (
            <DetailRow
              label={t('usdt.detail.depositTime')}
              value={
                <DualTimezoneDate
                  value={ticket.depositTransferredAt}
                  baseTimezone={baseTimezone}
                  serviceTimezone={serviceTimezone}
                  country={country}
                />
              }
            />
          )}
        </DetailSection>
      )}

      {(ticket.usdtTxId || ticket.actualUsdtAmount != null || ticket.wallet) && (
        <DetailSection title={t('usdt.detail.section.settlement')}>
          {ticket.actualUsdtAmount != null && (
            <DetailRow
              label={t('usdt.detail.actualUsdt')}
              value={`${ticket.actualUsdtAmount} USDT`}
              highlight
            />
          )}
          {ticket.usdtTxId && (
            <DetailRow label={t('usdt.detail.txid')} value={ticket.usdtTxId} mono />
          )}
          {ticket.wallet && (
            <DetailRow
              label={t('usdt.wallet')}
              value={`${ticket.wallet.address} (${ticket.wallet.network})`}
              mono
            />
          )}
        </DetailSection>
      )}

      <DetailSection title={t('usdt.detail.section.schedule')}>
        {showAdmin && ticket.customer && (
          <DetailRow
            label={t('usdt.col.customer')}
            value={`${ticket.customer.user.name} / ${ticket.customer.user.email}`}
          />
        )}
        <DetailRow
          label={t('usdt.col.date')}
          value={
            <DualTimezoneDate
              value={ticket.createdAt}
              baseTimezone={baseTimezone}
              serviceTimezone={serviceTimezone}
              country={country}
            />
          }
        />
        {ticket.expectedCompleteAt && (
          <DetailRow
            label={t('usdt.col.expectedComplete')}
            value={
              <DualTimezoneDate
                value={ticket.expectedCompleteAt}
                baseTimezone={baseTimezone}
                serviceTimezone={serviceTimezone}
                country={country}
              />
            }
          />
        )}
        {ticket.cancelReason && (
          <DetailRow label={t('usdt.cancelReason')} value={ticket.cancelReason} />
        )}
      </DetailSection>

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
                  type="button"
                  onClick={requestComplete}
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

      {!isCard && (
        <DetailSection title={t('usdt.detail.attachments')}>
          {ticket.attachments.length > 0 ? (
            <ul className="space-y-2">
              {ticket.attachments.map((a) => (
                <li key={a.id}>
                  <AttachmentLink attachment={a} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="pg-callout pg-callout-warn text-xs">
              <p className="font-medium">{t('usdt.detail.attachmentsEmpty')}</p>
              <p className="mt-1 pg-hint">{t('usdt.detail.attachmentsEmptyFixed')}</p>
              {isTestSeed && <p className="mt-2 pg-hint">{t('usdt.detail.attachmentsEmptyTest')}</p>}
            </div>
          )}
          <div className="mt-3 text-xs">
            <p className="font-semibold">{t('usdt.detail.attachmentsExpected')}</p>
            <ul className="mt-1 space-y-1 pg-muted">
              {expectedProofKeys.map((purpose) => (
                <li key={purpose} className="flex items-center gap-2">
                  <span className={attachedPurposes.has(purpose) ? 'text-emerald-700' : 'text-slate-400'}>
                    {attachedPurposes.has(purpose) ? '✓' : '○'}
                  </span>
                  <span>{t(`attachment.${purpose}` as MessageKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </DetailSection>
      )}

      <div className="pg-section">
        <div className="pg-section-head">{t('usdt.detail.history')}</div>
        <div className="pg-section-pad">
          <ol className="space-y-3">
          {ticket.statusHistory.map((h) => (
            <li key={h.id} className="border-l-2 pl-4 text-xs" style={{ borderColor: 'var(--shell-card-border)' }}>
              <StatusBadge status={h.toStatus} kind="usdt" usdtContext={usdtCtx} />
              {h.note && <p className="mt-0.5">{h.note}</p>}
              <p className="mt-1 pg-hint">{h.changedBy.name} · {formatDate(h.createdAt)}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>

      {completeConfirm && (
        <OperatorAmountConfirmModal
          open
          title={
            completeConfirm.kind === 'missing-actual'
              ? t('usdt.detail.completeConfirmMissingTitle')
              : t('usdt.detail.completeConfirmTitle')
          }
          warning={
            completeConfirm.kind === 'missing-actual'
              ? t('usdt.detail.completeConfirmMissingWarn', {
                  expected: ticket.expectedUsdtAmount.toFixed(4),
                })
              : t('usdt.detail.completeConfirmWarn')
          }
          rows={
            completeConfirm.kind === 'variance'
              ? [
                  {
                    label: t('usdt.detail.confirmExpected'),
                    value: `${ticket.expectedUsdtAmount.toFixed(4)} USDT`,
                  },
                  ...(ticket.expectedUsdtMin != null && ticket.expectedUsdtMax != null
                    ? [
                        {
                          label: t('usdt.detail.confirmRange'),
                          value: `${ticket.expectedUsdtMin.toFixed(4)} ~ ${ticket.expectedUsdtMax.toFixed(4)} USDT`,
                        },
                      ]
                    : []),
                  {
                    label: t('usdt.detail.confirmActual'),
                    value: `${completeConfirm.variance.actualAmount.toFixed(4)} USDT`,
                    warn: true,
                  },
                  {
                    label: t('usdt.detail.confirmDiff'),
                    value: `${completeConfirm.variance.diffAmount >= 0 ? '+' : ''}${completeConfirm.variance.diffAmount.toFixed(4)} USDT (${completeConfirm.variance.diffPercent >= 0 ? '+' : ''}${completeConfirm.variance.diffPercent.toFixed(2)}%)`,
                    warn: true,
                  },
                ]
              : [
                  {
                    label: t('usdt.detail.confirmExpected'),
                    value: `${ticket.expectedUsdtAmount.toFixed(4)} USDT`,
                  },
                  {
                    label: t('usdt.detail.confirmActual'),
                    value: t('usdt.detail.confirmNotEntered'),
                    warn: true,
                  },
                ]
          }
          confirmLabel={t('usdt.detail.completeConfirmProceed')}
          cancelLabel={t('usdt.detail.completeConfirmCancel')}
          loading={loading}
          onCancel={() => setCompleteConfirm(null)}
          onConfirm={() => void submitComplete(true)}
        />
      )}
    </div>
  );
}
