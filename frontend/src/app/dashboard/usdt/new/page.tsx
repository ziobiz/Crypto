'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { api, ExchangeRateResponse, Wallet } from '@/lib/api';
import { calculateExpectedUsdtRange } from '@/lib/transaction-fees';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';

const FIAT_CURRENCIES = ['KRW', 'JPY', 'USD'] as const;
type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

function walletFees(wallet: Wallet) {
  return (
    wallet.effectiveFees ?? {
      fxFeePercent: wallet.fxFeePercent,
      gasFeeUsdt: wallet.gasFeeAmount,
      transferFeeUsdt: wallet.transferFeeAmount || wallet.platformFeeAmount,
      otherFeeUsdt: wallet.otherFeeAmount,
    }
  );
}

export default function UsdtNewPage() {
  const router = useRouter();
  const t = useT();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rate, setRate] = useState<ExchangeRateResponse | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('KRW');
  const [fiatAmount, setFiatAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const wallet = wallets.find((w) => w.id === walletId);
  const amount = parseFloat(fiatAmount) || 0;
  const fiatRate = rate?.usdtFiatRate ?? rate?.usdtKrwRate ?? 0;
  const fees = wallet ? walletFees(wallet) : null;
  const range =
    wallet && fees && fiatRate > 0 && amount > 0
      ? calculateExpectedUsdtRange(amount, fiatRate, fees)
      : { expected: 0, min: 0, max: 0 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ticket = await api.usdt.create({ fiatAmount: amount, walletId, fiatCurrency });
      router.push(`/dashboard/usdt/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('usdt.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-3">
        <UsdtRatePanel compact />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="pg-label">{t('usdt.fiatCurrency')}</label>
          <select
            value={fiatCurrency}
            onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
            className="pg-input mt-1"
          >
            {FIAT_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {rate && fiatRate > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {t('usdt.rateRefCurrency', { rate: fiatRate.toLocaleString(), currency: fiatCurrency })}
            </p>
          )}
        </div>
        <div>
          <label className="pg-label">{t('usdt.fiatAmountLabel', { currency: fiatCurrency })}</label>
          <input type="number" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} className="pg-input mt-1" min="1" required />
        </div>
        <div>
          <label className="pg-label">{t('usdt.wallet')}</label>
          <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="pg-input mt-1" required>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.label ?? w.address} ({w.network})</option>
            ))}
          </select>
          {wallets.length === 0 && (
            <p className="mt-1 text-sm text-red-600">{t('usdt.noWallet')}</p>
          )}
        </div>
        {wallet && fees && amount > 0 && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-1">
            <p>{t('usdt.fxFee')}: {fees.fxFeePercent}%</p>
            <p>{t('usdt.gasFee')}: {fees.gasFeeUsdt} USDT</p>
            <p>{t('usdt.transferFee')}: {fees.transferFeeUsdt} USDT</p>
            <p>{t('usdt.otherFee')}: {fees.otherFeeUsdt} USDT</p>
            <p className="mt-2 font-medium">
              {t('usdt.expectedRange')}: {range.min.toFixed(4)} ~ {range.max.toFixed(4)} USDT
            </p>
            <p className="text-xs text-gray-500">{t('usdt.gasVarianceNote')}</p>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || wallets.length === 0} className="pg-btn pg-btn-primary disabled:opacity-50">
          {loading ? t('usdt.processing') : t('usdt.submit')}
        </button>
      </form>
    </div>
  );
}
