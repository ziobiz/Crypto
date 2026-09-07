'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  ApiError,
  ExchangeRateResponse,
  UsdtCardPaymentContext,
  UsdtDepositContext,
  UsdtFeePreview,
  Wallet,
} from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';
import { UsdtFeeBreakdownPanel } from '@/components/UsdtFeeBreakdown';
import { QuoteExpiryTimer } from '@/components/QuoteExpiryTimer';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { ContentCard } from '@/components/layout/ContentCard';
import { CardPaymentForm, emptyCardForm, type CardFormState } from '@/components/CardPaymentForm';
import { LocalizedFileInput } from '@/components/LocalizedFileInput';
import { ReferenceClocks } from '@/components/ReferenceClocks';
import { displayWalletLabel } from '@/lib/wallet-label';
import { isKycApproved } from '@/lib/kyc';

const FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'HKD'] as const;
type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
const ALL_CURRENCY_TRADE: Record<FiatCurrency, { transfer: boolean; card: boolean }> = {
  KRW: { transfer: true, card: true },
  JPY: { transfer: true, card: true },
  THB: { transfer: true, card: true },
  CNY: { transfer: true, card: true },
  HKD: { transfer: true, card: true },
};
type PaymentMethod = 'BANK_TRANSFER' | 'CARD';
type InputMode = 'target' | 'fiat' | 'cardCharge';

export default function UsdtNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
  const kycOk = isKycApproved(user);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rate, setRate] = useState<ExchangeRateResponse | null>(null);
  const [cardContext, setCardContext] = useState<UsdtCardPaymentContext | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('JPY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [inputMode, setInputMode] = useState<InputMode>('target');
  const [targetUsdt, setTargetUsdt] = useState('');
  const [fiatAmount, setFiatAmount] = useState(0);
  const [cardChargeFiat, setCardChargeFiat] = useState(0);
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feePreview, setFeePreview] = useState<UsdtFeePreview | null>(null);
  const [quoteExpired, setQuoteExpired] = useState(false);
  const [quoteRefreshKey, setQuoteRefreshKey] = useState(0);
  const [cardForm, setCardForm] = useState<CardFormState>(emptyCardForm());
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [depositFiles, setDepositFiles] = useState<File[]>([]);
  const [depositCtx, setDepositCtx] = useState<UsdtDepositContext | null>(null);
  const feePreviewSeq = useRef(0);

  const refreshQuote = useCallback(() => {
    setQuoteExpired(false);
    setQuoteRefreshKey((k) => k + 1);
    api.exchangeRateFor(fiatCurrency).then(setRate).catch(console.error);
  }, [fiatCurrency]);

  const handleQuoteExpired = useCallback(() => {
    setQuoteExpired(true);
    window.alert(t('usdt.quote.expired'));
  }, [t]);

  useEffect(() => {
    const def = user?.sessionPolicy?.defaultUsdtFiatCurrency;
    if (def && FIAT_CURRENCIES.includes(def)) {
      setFiatCurrency(def);
    }
  }, [user?.sessionPolicy?.defaultUsdtFiatCurrency]);

  useEffect(() => {
    api.wallets.list().then((w) => {
      setWallets(w);
      const def = w.find((x) => x.isDefault) ?? w[0];
      if (def) setWalletId(def.id);
    }).catch(console.error);
    api.usdt.depositContext().then(setDepositCtx).catch(console.error);
    api.usdt.cardContext().then((ctx) => {
      setCardContext(ctx);
      setCardForm(
        emptyCardForm({
          email: ctx.userEmail ?? '',
          phone: ctx.userPhone ?? '',
          phoneCountryCode: ctx.userPhoneCountryCode ?? '+82',
          cardholderName: ctx.userName ?? '',
        }),
      );
    }).catch(() => setCardContext({
      cardPaymentEnabled: false,
      enabled: false,
      cardFeePercent: 0,
      limits: {} as UsdtCardPaymentContext['limits'],
      currencyTrade: ALL_CURRENCY_TRADE,
      icopayConfigured: false,
      userPhone: null,
      userPhoneCountryCode: null,
      userEmail: null,
      userName: null,
    }));
  }, []);

  const isCard = paymentMethod === 'CARD';
  const trade = { ...ALL_CURRENCY_TRADE, ...(cardContext?.currencyTrade ?? {}) };
  const transferFiats = FIAT_CURRENCIES.filter((c) => trade[c].transfer);
  const cardFiats = FIAT_CURRENCIES.filter((c) => trade[c].card);
  const cardPaymentEnabled = cardContext?.cardPaymentEnabled === true;
  const cardOperational = cardContext?.enabled === true;
  const cardMethodAvailable = cardPaymentEnabled && cardFiats.length > 0;
  const bankMethodAvailable = transferFiats.length > 0;
  const methodFiats = isCard ? cardFiats : transferFiats;
  const isCurfexCurrency =
    !isCard && (depositCtx?.curfexEnabledCurrencies ?? []).includes(fiatCurrency);

  useEffect(() => {
    if (isCurfexCurrency) setDepositFiles([]);
  }, [isCurfexCurrency, fiatCurrency]);

  useEffect(() => {
    if (cardContext && !cardMethodAvailable && paymentMethod === 'CARD') {
      setPaymentMethod('BANK_TRANSFER');
      setInputMode('target');
    }
  }, [cardContext, cardMethodAvailable, paymentMethod]);

  useEffect(() => {
    if (!bankMethodAvailable && cardMethodAvailable && paymentMethod === 'BANK_TRANSFER') {
      setPaymentMethod('CARD');
      setInputMode('target');
    }
  }, [bankMethodAvailable, cardMethodAvailable, paymentMethod]);

  useEffect(() => {
    const list = isCard ? cardFiats : transferFiats;
    if (list.length > 0 && !list.includes(fiatCurrency)) {
      setFiatCurrency(list[0]);
    }
  }, [isCard, fiatCurrency, transferFiats.join('|'), cardFiats.join('|')]);

  useEffect(() => {
    api.exchangeRateFor(fiatCurrency).then(setRate).catch(console.error);
  }, [fiatCurrency]);

  const usdtAmount = parseFloat(targetUsdt) || 0;
  const canPreview =
    walletId &&
    (inputMode === 'target'
      ? usdtAmount > 0
      : inputMode === 'cardCharge'
        ? cardChargeFiat > 0
        : fiatAmount > 0);

  useEffect(() => {
    if (!canPreview) {
      setFeePreview(null);
      setQuoteExpired(false);
      return;
    }
    const seq = ++feePreviewSeq.current;
    const base = { walletId, fiatCurrency, paymentMethod: isCard ? ('CARD' as const) : undefined };
    const params =
      inputMode === 'target'
        ? { ...base, targetUsdtAmount: usdtAmount }
        : inputMode === 'cardCharge'
          ? { ...base, cardChargeFiat }
          : { ...base, fiatAmount };
    api.usdt
      .fees(params)
      .then((p) => {
        if (seq !== feePreviewSeq.current) return;
        setFeePreview(p);
        setQuoteExpired(false);
        setError('');
      })
      .catch((e) => {
        if (seq !== feePreviewSeq.current) return;
        setFeePreview(null);
        const code = e instanceof ApiError ? e.code : undefined;
        if (code === 'DEPOSIT_BELOW_FEES') setError(t('usdt.depositBelowFees'));
        else if (code === 'TRANSACTION_LIMIT') setError(t('usdt.limits.blocked'));
        else setError('');
      });
  }, [
    walletId,
    fiatCurrency,
    inputMode,
    usdtAmount,
    fiatAmount,
    cardChargeFiat,
    canPreview,
    isCard,
    quoteRefreshKey,
    t,
  ]);

  const fiatRate = rate?.usdtFiatRate ?? rate?.usdtKrwRate ?? 0;
  const breakdown = feePreview?.breakdown ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isCard && !cardMethodAvailable) {
      setError(t('usdt.fiatCardDisabled', { currency: fiatCurrency }));
      return;
    }
    if (!isCard && !bankMethodAvailable) {
      setError(t('usdt.fiatTransferDisabled', { currency: fiatCurrency }));
      return;
    }
    if (isCard && !cardPaymentEnabled) {
      setError(t('usdt.paymentCardDisabled'));
      return;
    }
    if (isCard && !cardOperational) {
      setError(t('usdt.paymentCardNotReady'));
      return;
    }
    if (isCard && !cardForm.waiverAccepted) {
      setError(t('usdt.cardWaiverRequired'));
      return;
    }
    if (!isCard) {
      if (sourceFiles.length === 0) {
        setError(t('usdt.funding.sourceRequired'));
        return;
      }
      if (!isCurfexCurrency && depositFiles.length === 0) {
        setError(t('usdt.funding.depositRequired'));
        return;
      }
    }
    if (!kycOk) {
      setError(t('kyc.requiredToTrade'));
      return;
    }
    if (quoteExpired || !feePreview?.quotedAt) {
      setError(t('usdt.quote.expired'));
      refreshQuote();
      return;
    }
    setLoading(true);
    try {
      if (isCard) {
        const ticket = await api.usdt.create({
          walletId,
          fiatCurrency,
          paymentMethod: 'CARD',
          cardWaiverAccepted: true,
          targetUsdtAmount: inputMode === 'target' ? usdtAmount : undefined,
          cardChargeFiat: inputMode === 'cardCharge' ? cardChargeFiat : undefined,
          card: {
            cardNumber: cardForm.cardNumber,
            cardExpiry: cardForm.cardExpiry,
            cardCvv: cardForm.cardCvv,
            cardholderName: cardForm.cardholderName,
            email: cardForm.email,
            phone: cardForm.phone,
            phoneCountryCode: cardForm.phoneCountryCode,
          },
        });
        router.push(`/dashboard/usdt/${ticket.id}`);
        return;
      }
      const ticket = await api.usdt.create(
        inputMode === 'target'
          ? { targetUsdtAmount: usdtAmount, walletId, fiatCurrency }
          : { fiatAmount, walletId, fiatCurrency },
      );
      await api.usdt.uploadApplicationDocs(ticket.id, {
        sourceOfFunds: sourceFiles,
        depositReceipt: isCurfexCurrency ? [] : depositFiles,
      });
      router.push(`/dashboard/usdt/${ticket.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FIAT_TRANSFER_DISABLED') {
        setError(t('usdt.fiatTransferDisabled', { currency: fiatCurrency }));
      } else if (err instanceof ApiError && err.code === 'FIAT_CARD_DISABLED') {
        setError(t('usdt.fiatCardDisabled', { currency: fiatCurrency }));
      } else {
        setError(err instanceof Error ? err.message : t('usdt.submitFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pg-stack">
      <ReferenceClocks compact />
      <p className="pg-hint">
        {isCard ? t('usdt.cardFlowHint') : t('usdt.manualFlowHint')}
      </p>
      {!kycOk && (
        <div className="pg-callout pg-callout-warn text-sm">
          {t('kyc.requiredToTrade')}{' '}
          <a href="/dashboard/kyc" className="pg-link">{t('nav.kyc')}</a>
        </div>
      )}

      <ContentCard>
        <UsdtRatePanel compact />
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <ContentCard>
            <div className="mb-5">
              <p className="pg-label">{t('usdt.paymentMethod')}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!bankMethodAvailable}
                  onClick={() => {
                    if (!bankMethodAvailable) return;
                    setPaymentMethod('BANK_TRANSFER');
                    setInputMode('target');
                  }}
                  className={`pg-choice ${
                    !bankMethodAvailable
                      ? 'pg-choice-idle'
                      : paymentMethod === 'BANK_TRANSFER'
                        ? 'pg-choice-active'
                        : ''
                  }`}
                >
                  {t('usdt.paymentBank')}
                </button>
                <button
                  type="button"
                  disabled={!cardMethodAvailable}
                  onClick={() => {
                    if (!cardMethodAvailable) return;
                    setPaymentMethod('CARD');
                    setInputMode('target');
                  }}
                  className={`pg-choice ${
                    !cardMethodAvailable
                      ? 'pg-choice-idle'
                      : paymentMethod === 'CARD'
                        ? 'pg-choice-active'
                        : ''
                  }`}
                  title={!cardMethodAvailable ? t('usdt.paymentCardDisabledHint') : undefined}
                >
                  {t('usdt.paymentCard')}
                </button>
              </div>
              {!cardMethodAvailable && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {cardPaymentEnabled ? t('usdt.noEnabledFiatCard') : t('usdt.paymentCardDisabledHint')}
                </p>
              )}
              {!bankMethodAvailable && (
                <p className="mt-1.5 text-[11px] text-gray-500">{t('usdt.noEnabledFiatTransfer')}</p>
              )}
            </div>

            <div>
              <label className="pg-label">{t('usdt.fiatCurrency')}</label>
              <select
                value={methodFiats.includes(fiatCurrency) ? fiatCurrency : (methodFiats[0] ?? fiatCurrency)}
                onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
                className="pg-input mt-1 w-full"
                disabled={methodFiats.length === 0}
              >
                {methodFiats.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {rate && fiatRate > 0 && (
                <p className="mt-1 pg-hint">
                  {t('usdt.rateRefCurrency', { rate: fiatRate.toLocaleString(), currency: fiatCurrency })}
                  {rate.source ? ` (${rate.source})` : ''}
                </p>
              )}
            </div>

            <div className="mt-5">
              <p className="pg-label">{t('usdt.inputModeTitle')}</p>
              <div className={`mt-2 grid gap-2 ${isCard ? 'grid-cols-2' : 'grid-cols-2'}`}>
                <button
                  type="button"
                  onClick={() => setInputMode('target')}
                  className={`pg-choice ${inputMode === 'target' ? 'pg-choice-active' : ''}`}
                >
                  <span className="block font-semibold">{t('usdt.inputModeTarget')}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">{t('usdt.targetUsdtDesc')}</span>
                </button>
                {isCard ? (
                  <button
                    type="button"
                    onClick={() => setInputMode('cardCharge')}
                    className={`pg-choice ${inputMode === 'cardCharge' ? 'pg-choice-active' : ''}`}
                  >
                    <span className="block font-semibold">{t('usdt.inputModeCardCharge')}</span>
                    <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">{t('usdt.cardChargeDesc')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInputMode('fiat')}
                    className={`pg-choice ${inputMode === 'fiat' ? 'pg-choice-active' : ''}`}
                  >
                    <span className="block font-semibold">{t('usdt.inputModeFiat')}</span>
                    <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">{t('usdt.fiatAmountDesc')}</span>
                  </button>
                )}
              </div>
            </div>

            {inputMode === 'target' ? (
              <div className="mt-5">
                <label className="pg-label">{t('usdt.targetUsdt')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetUsdt}
                  onChange={(e) => setTargetUsdt(e.target.value.replace(/[^\d.]/g, ''))}
                  className="pg-input mt-1 w-full"
                  placeholder="0.0000"
                  required
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            ) : inputMode === 'cardCharge' ? (
              <div className="mt-5">
                <label className="pg-label">{t('usdt.cardChargeLabel', { currency: fiatCurrency })}</label>
                <FormattedAmountInput
                  min={1}
                  value={cardChargeFiat}
                  onChange={setCardChargeFiat}
                  className="pg-input mt-1 w-full"
                />
              </div>
            ) : (
              <div className="mt-5">
                <label className="pg-label">{t('usdt.fiatAmountLabel', { currency: fiatCurrency })}</label>
                <FormattedAmountInput
                  min={1}
                  value={fiatAmount}
                  onChange={setFiatAmount}
                  className="pg-input mt-1 w-full"
                />
              </div>
            )}

            <div className="mt-5">
              <label className="pg-label">{t('usdt.wallet')}</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="pg-input mt-1 w-full"
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {displayWalletLabel(w.label, t)} ({w.network})
                  </option>
                ))}
              </select>
              {wallets.length === 0 && (
                <p className="mt-1 text-sm text-red-600">{t('usdt.noWallet')}</p>
              )}
            </div>

            {isCard && cardPaymentEnabled && <CardPaymentForm value={cardForm} onChange={setCardForm} />}

            {!isCard && (
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                <p className="pg-label">{t('usdt.funding.applyTitle')}</p>
                <p className="pg-hint">
                  {isCurfexCurrency
                    ? t('usdt.funding.applyHintCurfex')
                    : t('usdt.funding.applyHint')}
                </p>
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
                {!isCurfexCurrency && (
                  <div>
                    <label className="pg-label">{t('usdt.funding.depositReceipt')}</label>
                    <div className="mt-1">
                      <LocalizedFileInput
                        accept="image/*,.pdf"
                        multiple
                        files={depositFiles}
                        onFiles={setDepositFiles}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || wallets.length === 0 || !breakdown || !kycOk || quoteExpired}
              className="pg-btn pg-btn-primary mt-5 w-full disabled:opacity-50"
            >
              {loading ? t('usdt.processing') : isCard ? t('usdt.submitCard') : t('usdt.submit')}
            </button>
          </ContentCard>
        </form>

        <div className="space-y-4 lg:col-span-3">
          {breakdown ? (
            <>
              <QuoteExpiryTimer
                quotedAt={feePreview?.quotedAt}
                expiresInSeconds={feePreview?.quoteExpiresInSeconds ?? 240}
                onExpired={handleQuoteExpired}
              />
              {quoteExpired && (
                <div className="pg-callout pg-callout-warn flex items-center justify-between gap-3">
                  <p>{t('usdt.quote.expired')}</p>
                  <button type="button" className="pg-btn pg-btn-secondary text-xs" onClick={refreshQuote}>
                    {t('usdt.quote.refresh')}
                  </button>
                </div>
              )}
              <UsdtFeeBreakdownPanel
                breakdown={breakdown}
                currency={fiatCurrency}
                exchangeRate={fiatRate}
                source={rate?.source}
                fees={feePreview?.fees}
                display={feePreview?.feeDiagramDisplay}
                isCardPayment={isCard}
                cardFeeFiat={feePreview?.cardFeeFiat}
                cardChargeFiat={feePreview?.cardChargeFiat}
                cardFeePercent={feePreview?.cardFeePercent}
              />
            </>
          ) : (
            <div className="pg-card border-dashed">
              <div className="pg-card-body py-12 text-center pg-hint">
                {inputMode === 'target'
                  ? t('usdt.previewHintTarget')
                  : inputMode === 'cardCharge'
                    ? t('usdt.previewHintCardCharge')
                    : t('usdt.previewHintFiat')}
              </div>
            </div>
          )}

          {feePreview?.transactionLimits?.enabled && (
            <div className="pg-card">
              <div className="pg-card-body pg-callout pg-callout-warn">
                <p className="font-semibold">{t('usdt.limits.title')}</p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {feePreview.transactionLimits.effectiveMin > 0 && (
                    <div>
                      <dt>{t('usdt.limits.min')}</dt>
                      <dd className="font-mono tabular-nums">
                        {feePreview.transactionLimits.effectiveMin.toLocaleString()} {fiatCurrency}
                      </dd>
                    </div>
                  )}
                  {feePreview.transactionLimits.effectiveMax != null && (
                    <div>
                      <dt>{t('usdt.limits.max')}</dt>
                      <dd className="font-mono tabular-nums">
                        {feePreview.transactionLimits.effectiveMax.toLocaleString()} {fiatCurrency}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
