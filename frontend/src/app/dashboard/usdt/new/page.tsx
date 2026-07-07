'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, ExchangeRateResponse, UsdtFeePreview, Wallet } from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';
import { UsdtFeeBreakdownPanel } from '@/components/UsdtFeeBreakdown';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { ContentCard } from '@/components/layout/ContentCard';

const FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY'] as const;
type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
type InputMode = 'target' | 'fiat';

export default function UsdtNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rate, setRate] = useState<ExchangeRateResponse | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('JPY');
  const [inputMode, setInputMode] = useState<InputMode>('target');
  const [targetUsdt, setTargetUsdt] = useState('');
  const [fiatAmount, setFiatAmount] = useState(0);
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feePreview, setFeePreview] = useState<UsdtFeePreview | null>(null);

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
  }, []);

  useEffect(() => {
    api.exchangeRateFor(fiatCurrency).then(setRate).catch(console.error);
  }, [fiatCurrency]);

  const usdtAmount = parseFloat(targetUsdt) || 0;
  const canPreview =
    walletId &&
    (inputMode === 'target' ? usdtAmount > 0 : fiatAmount > 0);

  useEffect(() => {
    if (!canPreview) {
      setFeePreview(null);
      return;
    }
    const params =
      inputMode === 'target'
        ? { walletId, fiatCurrency, targetUsdtAmount: usdtAmount }
        : { walletId, fiatCurrency, fiatAmount };
    api.usdt
      .fees(params)
      .then(setFeePreview)
      .catch(() => setFeePreview(null));
  }, [walletId, fiatCurrency, inputMode, usdtAmount, fiatAmount, canPreview]);

  const fiatRate = rate?.usdtFiatRate ?? rate?.usdtKrwRate ?? 0;
  const breakdown = feePreview?.breakdown ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
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
      <p className="pg-hint">{t('usdt.manualFlowHint')}</p>

      <ContentCard>
        <UsdtRatePanel compact />
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <ContentCard>
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
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('target')}
                  className={`pg-choice ${inputMode === 'target' ? 'pg-choice-active' : ''}`}
                >
                  <span className="block font-semibold">{t('usdt.inputModeTarget')}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">{t('usdt.targetUsdtDesc')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('fiat')}
                  className={`pg-choice ${inputMode === 'fiat' ? 'pg-choice-active' : ''}`}
                >
                  <span className="block font-semibold">{t('usdt.inputModeFiat')}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">{t('usdt.fiatAmountDesc')}</span>
                </button>
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

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || wallets.length === 0 || !breakdown}
              className="pg-btn pg-btn-primary mt-5 w-full disabled:opacity-50"
            >
              {loading ? t('usdt.processing') : t('usdt.submit')}
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
            />
          ) : (
            <div className="pg-card border-dashed">
              <div className="pg-card-body py-12 text-center pg-hint">
                {inputMode === 'target'
                  ? t('usdt.previewHintTarget')
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
                <div>
                  <dt>{t('usdt.limits.dailyUsed')}</dt>
                  <dd className="font-mono tabular-nums">
                    {feePreview.transactionLimits.dailyTotal.toLocaleString()} {fiatCurrency}
                    {feePreview.transactionLimits.remainingDaily != null
                      ? ` · ${t('usdt.limits.dailyRemain')} ${feePreview.transactionLimits.remainingDaily.toLocaleString()}`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt>{t('usdt.limits.monthlyUsed')}</dt>
                  <dd className="font-mono tabular-nums">
                    {feePreview.transactionLimits.monthlyTotal.toLocaleString()} {fiatCurrency}
                    {feePreview.transactionLimits.remainingMonthly != null
                      ? ` · ${t('usdt.limits.monthlyRemain')} ${feePreview.transactionLimits.remainingMonthly.toLocaleString()}`
                      : ''}
                  </dd>
                </div>
              </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
