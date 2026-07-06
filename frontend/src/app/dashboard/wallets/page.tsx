'use client';

import { useEffect, useState } from 'react';
import { api, Wallet } from '@/lib/api';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState({ label: '', address: '', network: 'TRC20', gasFeeAmount: '1.5', platformFeeAmount: '0.5', isDefault: true });
  const [loading, setLoading] = useState(false);

  const load = () => api.wallets.list().then(setWallets).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.wallets.create({
        label: form.label || undefined,
        address: form.address,
        network: form.network,
        isDefault: form.isDefault,
        gasFeeAmount: parseFloat(form.gasFeeAmount),
        platformFeeAmount: parseFloat(form.platformFeeAmount),
      });
      setForm({ label: '', address: '', network: 'TRC20', gasFeeAmount: '1.5', platformFeeAmount: '0.5', isDefault: false });
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">내 지갑</h1>
      <p className="mt-1 text-sm text-gray-500">USDT 수령 지갑 및 가스비/플랫폼 수수료 설정</p>

      <div className="mt-6 space-y-4">
        {wallets.map((w) => (
          <div key={w.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{w.label ?? '지갑'}</p>
              {w.isDefault && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">기본</span>}
            </div>
            <p className="mt-1 font-mono text-sm text-gray-600">{w.address}</p>
            <p className="mt-2 text-xs text-gray-500">{w.network} · 가스 {w.gasFeeAmount} · 플랫폼 {w.platformFeeAmount} USDT</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">지갑 등록</h2>
        <input placeholder="별칭" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input placeholder="USDT 주소" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" required />
        <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="TRC20">TRC20</option>
          <option value="ERC20">ERC20</option>
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.01" placeholder="가스비 (USDT)" value={form.gasFeeAmount} onChange={(e) => setForm({ ...form, gasFeeAmount: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="플랫폼 수수료 (USDT)" value={form.platformFeeAmount} onChange={(e) => setForm({ ...form, platformFeeAmount: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          기본 지갑으로 설정
        </label>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">등록</button>
      </form>
    </div>
  );
}
