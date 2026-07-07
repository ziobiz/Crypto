'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  ExchangeRateResponse,
  UsdtCardPaymentContext,
  UsdtFeePreview,
  Wallet,
} from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';
import { UsdtFeeBreakdownPanel } from '@/components/UsdtFeeBreakdown';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { ContentCard } from '@/components/layout/ContentCard';
import { CardPaymentForm, emptyCardForm, type CardFormState } from '@/components/CardPaymentForm';

const FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY'] as const;
type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
type PaymentMethod = 'BANK_TRANSFER' | 'CARD';
type InputMode = 'target' | 'fiat' | 'cardCharge';

export default function UsdtNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
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
  const [cardForm, setCardForm] = useState<CardFormState>(emptyCardForm());

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
    }).catch(() => setCardContext({ cardPaymentEnabled: false, enabled: false, cardFeePercent: 0, limits: {} as UsdtCardPaymentContext['limits'], icopayConfigured: false, userPhone: null, userPhoneCountryCode: null, userEmail: null, userName: null }));
  }, []);

  useEffect(() => {
    if (cardContext && !cardContext.cardPaymentEnabled && paymentMethod === 'CARD') {
      setPaymentMethod('BANK_TRANSFER');
      setInputMode('target');
    }
  }, [cardContext, paymentMethod]);

  useEffect(() => {
    api.exchangeRateFor(fiatCurrency).then(setRate).catch(console.error);
  }, [fiatCurrency]);

  const usdtAmount = parseFloat(targetUsdt) || 0;
  const isCard = paymentMethod === 'CARD';
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
      return;
    }
    const base = { walletId, fiatCurrency, paymentMethod: isCard ? ('CARD' as const) : undefined };
    const params =
      inputMode === 'target'
        ? { ...base, targetUsdtAmount: usdtAmount }
        : inputMode === 'cardCharge'
          ? { ...base, cardChargeFiat }
          : { ...base, fiatAmount };
    api.usdt.fees(params).then(setFeePreview).catch(() => setFeePreview(null));
  }, [walletId, fiatCurrency, inputMode, usdtAmount, fiatAmount, cardChargeFiat, canPreview, isCard]);

  const fiatRate = rate?.usdtFiatRate ?? rate?.usdtKrwRate ?? 0;
  const breakdown = feePreview?.breakdown ?? null;
  const cardPaymentEnabled = cardContext?.cardPaymentEnabled === true;
  const cardOperational = cardContext?.enabled === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      router.push(`/dashboard/usdt/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('usdt.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pg-stack">
      <p className="pg-hint">
        {isCard ? t('usdt.cardFlowHint') : t('usdt.manualFlowHint')}
      </p>

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
                  onClick={() => {
                    setPaymentMethod('BANK_TRANSFER');
                    setInputMode('target');
                  }}
                  className={`pg-choice ${paymentMethod === 'BANK_TRANSFER' ? 'pg-choice-active' : ''}`}
                >
                  {t('usdt.paymentBank')}
                </button>
                <button
                  type="button"
                  disabled={!cardPaymentEnabled}
                  onClick={() => {
                    if (!cardPaymentEnabled) return;
                    setPaymentMethod('CARD');
                    setInputMode('target');
                  }}
                  className={`pg-choice ${
                    !cardPaymentEnabled
                      ? 'pg-choice-idle'
                      : paymentMethod === 'CARD'
                        ? 'pg-choice-active'
                        : ''
                  }`}
                  title={!cardPaymentEnabled ? t('usdt.paymentCardDisabledHint') : undefined}
                >
                  {t('usdt.paymentCard')}
                </button>
              </div>
              {!cardPaymentEnabled && (
                <p className="mt-1.5 text-[11px] text-gray-500">{t('usdt.paymentCardDisabledHint')}</p>
              )}
            </div>

            <div>
              <label className="pg-label">{t('usdt.fiatCurrency')}</label>
              <select
                value={fiatCurrency}
                onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
                className="pg-input mt-1 w-full"
              >
                {FIAT_CURRENCIES.map((c) => (
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
                  <option key={w.id} value={w.id}>{w.label ?? w.address} ({w.network})</option>
                ))}
              </select>
              {wallets.length === 0 && (
                <p className="mt-1 text-sm text-red-600">{t('usdt.noWallet')}</p>
              )}
            </div>

            {isCard && cardPaymentEnabled && <CardPaymentForm value={cardForm} onChange={setCardForm} />}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || wallets.length === 0 || !breakdown}
              className="pg-btn pg-btn-primary mt-5 w-full disabled:opacity-50"
            >
              {loading ? t('usdt.processing') : isCard ? t('usdt.submitCard') : t('usdt.submit')}
            </button>
          </ContentCard>
        </form>

        <div className="space-y-4 lg:col-span-3">
          {breakdown ? (
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
