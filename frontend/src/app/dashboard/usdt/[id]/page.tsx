'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT, useLocale } from '@/context/LocaleProvider';
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
import { CopyButton, CopyableMono } from '@/components/CopyButton';
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
  const { locale } = useLocale();
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

  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [depositReceiptFiles, setDepositReceiptFiles] = useState<File[]>([]);
  const [confirmFiat, setConfirmFiat] = useState('');
  const [confirmUsdt, setConfirmUsdt] = useState('');

  const { country, baseTimezone, serviceTimezone } = useReferenceTimeState();
  const countdown = useCountdown(ticket?.depositDeadlineAt);
  const quoteCountdown = useCountdown(ticket?.quoteDueAt);
  const showQuoteValidTimer =
    !!ticket?.depositDeadlineAt &&
    (ticket?.status === 'QUOTE_CONFIRMED' ||
      (ticket?.status === 'DEPOSIT_PROOF_PENDING' && !!ticket?.quoteConfirmedAt));
  const quoteValidMinutes =
    depositCtx?.quoteValidMinutes ?? depositCtx?.quoteResponse?.quoteValidMinutes ?? 20;
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

  // AUTO 견적: 확정 대기 중 폴링
  useEffect(() => {
    if (ticket?.status !== 'QUOTE_PENDING') return;
    const idTimer = setInterval(() => {
      load();
    }, 10_000);
    return () => clearInterval(idTimer);
  }, [id, ticket?.status]);

  useEffect(() => {
    if (ticket?.registeredBank?.accountHolder && !depositorName) {
      setDepositorName(ticket.registeredBank.accountHolder);
    }
  }, [ticket, depositorName]);

  useEffect(() => {
    if (ticket?.status === 'QUOTE_PENDING') {
      setConfirmFiat(String(ticket.fiatAmount));
      setConfirmUsdt(String(ticket.expectedUsdtAmount));
    }
  }, [ticket?.id, ticket?.status]);

  if (!ticket) return <p className="pg-hint">{t('common.loading')}</p>;

  const isOperator = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_STAFF';
  const isCustomer = user?.role === 'CUSTOMER' || user?.role === 'CUSTOMER_OPERATOR';
  const receivingFixed =
    depositCtx?.receivingAccounts?.[ticket.fiatCurrency as 'KRW' | 'JPY' | 'THB' | 'CNY'];
  // CURFEX: 견적 확정 후에만 가상계좌 발급 → 확정 전에는 계좌 미표시(고정계좌로 폴백하지 않음)
  const receivingRaw =
    ticket.collectionProvider === 'CURFEX'
      ? ticket.collectionAccount ?? null
      : receivingFixed;
  const isCurfexAccount = ticket.collectionProvider === 'CURFEX' && !!ticket.collectionAccount;
  const receiving = receivingRaw
    ? {
        bankName: String(receivingRaw.bankName ?? ''),
        accountNumber: String(receivingRaw.accountNumber ?? ''),
        accountHolder: String(receivingRaw.accountHolder ?? ''),
        bankAddress:
          'bankAddress' in receivingRaw && receivingRaw.bankAddress
            ? String(receivingRaw.bankAddress)
            : '',
        bankCode:
          'bankCode' in receivingRaw && receivingRaw.bankCode ? String(receivingRaw.bankCode) : '',
        branchCode:
          'branchCode' in receivingRaw && receivingRaw.branchCode
            ? String(receivingRaw.branchCode)
            : '',
        accountType:
          'accountType' in receivingRaw && receivingRaw.accountType
            ? String(receivingRaw.accountType)
            : '',
        notice: 'notice' in receivingRaw && receivingRaw.notice ? String(receivingRaw.notice) : '',
        noticeI18n:
          'noticeI18n' in receivingRaw && receivingRaw.noticeI18n && typeof receivingRaw.noticeI18n === 'object'
            ? (receivingRaw.noticeI18n as Partial<Record<'KR' | 'US' | 'JP' | 'CH' | 'TH', string>>)
            : undefined,
      }
    : null;

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

  const handleConfirmQuote = async () => {
    setLoading(true);
    try {
      const fiat = parseFloat(confirmFiat);
      const usdt = parseFloat(confirmUsdt);
      await api.usdt.confirmQuote(id, {
        confirmedFiatAmount: Number.isFinite(fiat) && fiat > 0 ? fiat : undefined,
        confirmedUsdtAmount: Number.isFinite(usdt) && usdt > 0 ? usdt : undefined,
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleTradeAfterQuote = async () => {
    if (sourceFiles.length === 0 || depositReceiptFiles.length === 0) return;
    setLoading(true);
    try {
      await api.usdt.uploadApplicationDocs(id, {
        sourceOfFunds: sourceFiles,
        depositReceipt: depositReceiptFiles,
      });
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
  const displayFiat =
    ticket.confirmedFiatAmount != null ? ticket.confirmedFiatAmount : ticket.fiatAmount;
  const displayUsdt =
    ticket.confirmedUsdtAmount != null
      ? ticket.confirmedUsdtAmount
      : ticket.expectedUsdtAmount;
  const expectedRange =
    ticket.status === 'QUOTE_CONFIRMED' || ticket.confirmedUsdtAmount != null
      ? `${displayUsdt.toFixed(4)} USDT`
      : ticket.status === 'QUOTE_PENDING'
        ? `${ticket.expectedUsdtAmount.toFixed(4)} USDT`
        : ticket.expectedUsdtMin != null && ticket.expectedUsdtMax != null
          ? `${ticket.expectedUsdtMin.toFixed(4)} ~ ${ticket.expectedUsdtMax.toFixed(4)} USDT`
          : `${ticket.expectedUsdtAmount.toFixed(4)} USDT`;

  const depositExpired =
    ticket.depositDeadlineAt &&
    new Date(ticket.depositDeadlineAt) < new Date() &&
    ticket.status === 'DEPOSIT_PROOF_PENDING';

  const isCard = ticket.paymentMethod === 'CARD';
  const showDepositAccount = !!receiving && !isCard && ticket.status !== 'QUOTE_PENDING';
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
      {showQuoteValidTimer && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            <span>{t('usdt.quoteValidLabel')}</span>
            <span className="font-mono tabular-nums tracking-wide">{countdown || '—'}</span>
          </span>
          <p className="text-[11px] text-rose-800/80">
            {t('usdt.quoteValidHint', { minutes: quoteValidMinutes })}
          </p>
        </div>
      )}
      <DetailHero
        fromLabel={formatCurrency(displayFiat, ticket.fiatCurrency)}
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

      {ticket.status === 'QUOTE_PENDING' && (
        <div className="pg-card">
          <div className="pg-card-body pg-callout pg-callout-warn space-y-2">
            <p className="font-semibold">{t('usdt.quote.pendingTitle')}</p>
            <p className="pg-hint">{t('usdt.quote.pendingDesc')}</p>
            {ticket.quoteDueAt && (
              <p className="text-sm">
                {t('usdt.quote.dueAt')}: <span className="font-mono tabular-nums">{quoteCountdown}</span>
              </p>
            )}
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="pg-muted">{t('usdt.quote.provisionalFiat')}</dt>
                <dd className="font-mono font-semibold">
                  {formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}
                </dd>
              </div>
              <div>
                <dt className="pg-muted">{t('usdt.quote.provisionalUsdt')}</dt>
                <dd className="font-mono font-semibold">{ticket.expectedUsdtAmount.toFixed(4)} USDT</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {ticket.status === 'QUOTE_CONFIRMED' && (
        <div className="pg-card">
          <div className="pg-card-body pg-callout pg-callout-info space-y-2">
            <p className="font-semibold">{t('usdt.quote.resultTitle')}</p>
            <p className="pg-hint">{t('usdt.quote.resultDesc')}</p>
            <p className="text-xs text-rose-800">
              {t('usdt.quoteValidHint', { minutes: quoteValidMinutes })}
            </p>
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="pg-muted">{t('usdt.quote.confirmedFiat')}</dt>
                <dd className="font-mono text-lg font-bold text-rose-800">
                  {formatCurrency(displayFiat, ticket.fiatCurrency)}
                </dd>
              </div>
              <div>
                <dt className="pg-muted">{t('usdt.quote.confirmedUsdt')}</dt>
                <dd className="font-mono text-lg font-bold">{displayUsdt.toFixed(4)} USDT</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {isOperator && ticket.status === 'QUOTE_PENDING' && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.quote.adminConfirmTitle')}</div>
          <div className="pg-section-pad space-y-3">
            <p className="pg-hint">{t('usdt.quote.adminConfirmDesc')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="pg-label">{t('usdt.quote.confirmedFiat')}</label>
                <input
                  className="pg-input mt-1 w-full"
                  value={confirmFiat}
                  onChange={(e) => setConfirmFiat(e.target.value)}
                />
              </div>
              <div>
                <label className="pg-label">{t('usdt.quote.confirmedUsdt')}</label>
                <input
                  className="pg-input mt-1 w-full"
                  value={confirmUsdt}
                  onChange={(e) => setConfirmUsdt(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirmQuote}
              disabled={loading}
              className="pg-btn pg-btn-primary disabled:opacity-50"
            >
              {t('usdt.quote.confirmBtn')}
            </button>
          </div>
        </div>
      )}

      {isCustomer && ticket.status === 'QUOTE_CONFIRMED' && !isCard && (
        <div className="pg-section">
          <div className="pg-section-head">{t('usdt.quote.tradeTitle')}</div>
          <div className="pg-section-pad space-y-3">
            <p className="pg-hint">{t('usdt.quote.tradeDesc')}</p>
            <div>
              <label className="pg-label">{t('usdt.funding.sourceFiles')}</label>
              <div className="mt-1">
                <LocalizedFileInput
                  accept=".xlsx,.xls,.pdf,image/*"
                  multiple
                  files={sourceFiles}
                  onFiles={setSourceFiles}
                />
              </div>
            </div>
            <div>
              <label className="pg-label">
                {t('usdt.funding.depositReceipt')}
                <span className="ml-1 text-rose-600">*</span>
              </label>
              <div className="mt-1">
                <LocalizedFileInput
                  accept=".pdf,image/*"
                  multiple
                  files={depositReceiptFiles}
                  onFiles={setDepositReceiptFiles}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleTradeAfterQuote}
              disabled={loading || sourceFiles.length === 0 || depositReceiptFiles.length === 0}
              className="pg-btn pg-btn-primary disabled:opacity-50"
            >
              {t('usdt.quote.tradeBtn')}
            </button>
          </div>
        </div>
      )}

      {ticket.status === 'DEPOSIT_PROOF_PENDING' && ticket.depositDeadlineAt && !isCard && (
        <div className="pg-card">
          <div className={`pg-card-body pg-callout ${depositExpired ? 'pg-callout-error' : 'pg-callout-warn'}`}>
            <p className="font-medium">{t('usdt.depositDeadline')}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{countdown}</p>
            <p className="mt-1 pg-hint">
              {isCurfex
                ? t('usdt.depositDeadlineDescVirtual', {
                    hours: String(depositCtx?.depositWindowHours ?? 2),
                  })
                : t('usdt.depositDeadlineDesc', {
                    hours: String(depositCtx?.depositWindowHours ?? 2),
                  })}
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

      {showDepositAccount && (
        <div className="pg-card">
          <div className="pg-card-body pg-callout pg-callout-info space-y-2">
            <p className="font-semibold">
              {isCurfexAccount ? t('usdt.curfexAccount') : t('usdt.companyAccount')}
            </p>
            <dl className="grid gap-1.5 text-xs sm:grid-cols-[7.5rem_1fr]">
              <dt className="text-slate-500">{t('usdt.deposit.bankName')}</dt>
              <CopyableMono
                value={receiving.bankName}
                copyLabel={t('common.copy')}
                copiedLabel={t('common.copied')}
              />
              {receiving.bankAddress ? (
                <>
                  <dt className="text-slate-500">{t('usdt.deposit.bankAddress')}</dt>
                  <CopyableMono
                    value={receiving.bankAddress}
                    copyLabel={t('common.copy')}
                    copiedLabel={t('common.copied')}
                  />
                </>
              ) : null}
              {receiving.bankCode ? (
                <>
                  <dt className="text-slate-500">{t('usdt.deposit.bankCode')}</dt>
                  <CopyableMono
                    value={receiving.bankCode}
                    copyLabel={t('common.copy')}
                    copiedLabel={t('common.copied')}
                  />
                </>
              ) : null}
              {receiving.branchCode ? (
                <>
                  <dt className="text-slate-500">{t('usdt.deposit.branchCode')}</dt>
                  <CopyableMono
                    value={receiving.branchCode}
                    copyLabel={t('common.copy')}
                    copiedLabel={t('common.copied')}
                  />
                </>
              ) : null}
              {receiving.accountType ? (
                <>
                  <dt className="text-slate-500">{t('usdt.deposit.accountType')}</dt>
                  <dd>{receiving.accountType}</dd>
                </>
              ) : null}
              <dt className="text-slate-500">{t('usdt.deposit.accountNumber')}</dt>
              <CopyableMono
                value={receiving.accountNumber}
                copyLabel={t('usdt.deposit.copyAccountNumber')}
                copiedLabel={t('common.copied')}
                strong
              />
              <dt className="text-slate-500">{t('usdt.deposit.accountHolder')}</dt>
              <CopyableMono
                value={receiving.accountHolder}
                copyLabel={t('usdt.deposit.copyHolder')}
                copiedLabel={t('common.copied')}
                strong
              />
            </dl>
            <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 space-y-1">
              <p>
                {(receiving.noticeI18n?.[locale] ||
                  receiving.noticeI18n?.KR ||
                  receiving.notice ||
                  t('usdt.deposit.holderCopyWarning')) as string}
              </p>
              <p className="font-medium text-red-700/90">{t('usdt.deposit.holderNameStayJp')}</p>
            </div>
            {isCurfexAccount && ticket.curfexRefNo && (
              <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-600">
                <span>
                  {t('usdt.curfexRef')}: {ticket.curfexRefNo}
                </span>
                <CopyButton
                  text={ticket.curfexRefNo}
                  label={t('usdt.deposit.copyRef')}
                  copiedLabel={t('common.copied')}
                />
              </p>
            )}
            {isCurfexAccount && <p className="pg-hint">{t('usdt.curfexAccountHint')}</p>}
          </div>
        </div>
      )}

      {ticket.registeredBank && (
        <div className="pg-card">
          <div className="pg-card-body text-xs space-y-1.5">
            <p className="font-semibold">{t('usdt.registeredBank')}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span>
                {ticket.registeredBank.bankName} · {ticket.registeredBank.accountNumber}
              </span>
              {ticket.registeredBank.accountNumber ? (
                <CopyButton
                  text={ticket.registeredBank.accountNumber}
                  label={t('usdt.deposit.copyAccountNumber')}
                  copiedLabel={t('common.copied')}
                />
              ) : null}
            </p>
            <p className="pg-muted flex flex-wrap items-center gap-2">
              <span>{ticket.registeredBank.accountHolder}</span>
              {ticket.registeredBank.accountHolder ? (
                <CopyButton
                  text={ticket.registeredBank.accountHolder}
                  label={t('usdt.deposit.copyHolder')}
                  copiedLabel={t('common.copied')}
                />
              ) : null}
            </p>
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
        {(() => {
          const billing =
            ticket.feeDiagramDisplay?.billingMethod ??
            ticket.feeDiagramDisplay?.defaultFeeBillingMethod ??
            'ITEMIZED';
          const showFeeAmounts = ticket.feeDiagramDisplay?.showTotalFee !== false;
          const showIntegrated = billing === 'INTEGRATED' || billing === 'HYBRID';
          const showItemized = billing === 'ITEMIZED' || billing === 'HYBRID';
          if (!showFeeAmounts) {
            return (
              <p className="text-xs text-slate-500">{t('usdt.fee.totalFeeHidden')}</p>
            );
          }
          return (
            <>
              {showIntegrated && (
                <DetailRow label={t('usdt.fee.integratedTotal')} value={feeSummaryLabel(ticket, t)} />
              )}
              {showItemized && (
                <>
                  <DetailRow
                    label={t('usdt.detail.fxFee')}
                    value={`${ticket.fxFeePercentSnapshot}%`}
                  />
                  <DetailRow
                    label={t('usdt.detail.gasFee')}
                    value={`${ticket.gasFeeSnapshot} USDT`}
                  />
                  <DetailRow
                    label={t('usdt.detail.transferFee')}
                    value={`${ticket.transferFeeSnapshot} USDT`}
                  />
                  <DetailRow
                    label={t('usdt.detail.otherFee')}
                    value={`${ticket.otherFeeSnapshot} USDT`}
                  />
                </>
              )}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZER') && (
                <DetailRow
                  label={t('usdt.brokerUsdt')}
                  value={`${ticket.brokerUsdtAmount != null ? ticket.brokerUsdtAmount.toFixed(4) : '—'} USDT`}
                />
              )}
            </>
          );
        })()}
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
            <p className="mt-2 text-xs font-medium text-amber-900">{t('usdt.detail.fixedDepositAfterAccount')}</p>
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
