'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ExchangeRateResponse, Wallet } from '@/lib/api';

export default function UsdtNewPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rate, setRate] = useState<ExchangeRateResponse | null>(null);
  const [fiatAmount, setFiatAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.wallets.list(), api.exchangeRate()])
      .then(([w, r]) => {
        setWallets(w);
        setRate(r);
        const def = w.find((x) => x.isDefault) ?? w[0];
        if (def) setWalletId(def.id);
      })
      .catch(console.error);
  }, []);

  const wallet = wallets.find((w) => w.id === walletId);
  const amount = parseFloat(fiatAmount) || 0;
  const expectedUsdt = rate && wallet && amount > 0
    ? Math.max(0, amount / rate.usdtKrwRate - wallet.gasFeeAmount - wallet.platformFeeAmount)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ticket = await api.usdt.create({ fiatAmount: amount, walletId });
      router.push(`/dashboard/usdt/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '신청 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">USDT 매입 신청</h1>
      {rate && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm">
          <p>참고 시세: 1 USDT = {rate.usdtKrwRate.toLocaleString()} KRW</p>
          <p className="text-gray-500">{rate.disclaimer}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">매입 금액 (KRW)</label>
          <input type="number" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" min="1" required />
        </div>
        <div>
          <label className="block text-sm font-medium">수령 지갑</label>
          <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" required>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.label ?? w.address} ({w.network})</option>
            ))}
          </select>
          {wallets.length === 0 && (
            <p className="mt-1 text-sm text-red-600">지갑을 먼저 등록해 주세요.</p>
          )}
        </div>
        {wallet && amount > 0 && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <p>가스비: {wallet.gasFeeAmount} USDT</p>
            <p>플랫폼 수수료: {wallet.platformFeeAmount} USDT</p>
            <p className="mt-2 font-medium">예상 수령: {expectedUsdt.toFixed(4)} USDT</p>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || wallets.length === 0} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? '처리 중...' : '신청하기'}
        </button>
      </form>
    </div>
  );
}
