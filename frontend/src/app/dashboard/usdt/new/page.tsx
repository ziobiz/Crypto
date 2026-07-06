'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { api, ExchangeRateResponse, Wallet } from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';

const FIAT_CURRENCIES = ['KRW', 'JPY', 'USD'] as const;
type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

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
  const gasVariance = wallet ? wallet.gasFeeAmount * 0.2 : 0;
  const expectedUsdt =
    wallet && fiatRate > 0 && amount > 0
      ? Math.max(0, amount / fiatRate - wallet.gasFeeAmount - wallet.platformFeeAmount)
      : 0;
  const expectedMin = Math.max(0, expectedUsdt - gasVariance);
  const expectedMax = Math.max(0, expectedUsdt + gasVariance);

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
      <h1 className="text-2xl font-bold">{t('usdt.newTitle')}</h1>

      <div className="mt-4">
        <UsdtRatePanel compact />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('usdt.fiatCurrency')}</label>
          <select
            value={fiatCurrency}
            onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium">{t('usdt.fiatAmountLabel', { currency: fiatCurrency })}</label>
          <input type="number" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" min="1" required />
        </div>
        <div>
          <label className="block text-sm font-medium">{t('usdt.wallet')}</label>
          <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" required>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.label ?? w.address} ({w.network})</option>
            ))}
          </select>
          {wallets.length === 0 && (
            <p className="mt-1 text-sm text-red-600">{t('usdt.noWallet')}</p>
          )}
        </div>
        {wallet && amount > 0 && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <p>{t('usdt.gasFee')}: {wallet.gasFeeAmount} USDT</p>
            <p>{t('usdt.platformFee')}: {wallet.platformFeeAmount} USDT</p>
            <p className="mt-2 font-medium">
              {t('usdt.expectedRange')}: {expectedMin.toFixed(4)} ~ {expectedMax.toFixed(4)} USDT
            </p>
            <p className="text-xs text-gray-500">{t('usdt.gasVarianceNote')}</p>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || wallets.length === 0} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('usdt.processing') : t('usdt.submit')}
        </button>
      </form>
    </div>
  );
}
