'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { api, Wallet } from '@/lib/api';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';

const emptyForm = {
  label: '',
  address: '',
  network: 'TRC20',
  fxFeePercent: '0',
  gasFeeAmount: '0',
  transferFeeAmount: '0',
  otherFeeAmount: '0',
  isDefault: true,
};

export default function WalletsPage() {
  const t = useT();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState(emptyForm);
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
        fxFeePercent: parseFloat(form.fxFeePercent) || 0,
        gasFeeAmount: parseFloat(form.gasFeeAmount) || 0,
        transferFeeAmount: parseFloat(form.transferFeeAmount) || 0,
        otherFeeAmount: parseFloat(form.otherFeeAmount) || 0,
      });
      setForm({ ...emptyForm, isDefault: false });
      await load();
    } finally {
      setLoading(false);
    }
  };

  function feeSummary(w: Wallet) {
    const f = w.effectiveFees;
    if (!f) return `${w.network}`;
    return `FX ${f.fxFeePercent}% · Gas ${f.gasFeeUsdt} · ${f.transferFeeUsdt} · ${f.otherFeeUsdt} USDT`;
  }

  return (
    <div className="max-w-2xl">
      <p className="text-[11px] text-gray-500 sm:text-xs">{t('wallets.subtitle')}</p>

      <div className="mt-3 space-y-2">
        {wallets.map((w) => (
          <div key={w.id} className="rounded border bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{w.label ?? t('wallets.defaultLabel')}</p>
              {w.isDefault && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{t('wallets.default')}</span>}
            </div>
            <p className="mt-1 font-mono text-sm text-gray-600">{w.address}</p>
            <p className="mt-2 text-xs text-gray-500">{feeSummary(w)}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded border bg-white p-3 sm:p-4">
        <h2 className="text-xs font-semibold sm:text-sm">{t('wallets.addTitle')}</h2>
        <p className="text-xs text-gray-500">{t('wallets.feeHint')}</p>
        <input placeholder={t('wallets.label')} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="pg-input" />
        <input placeholder={t('wallets.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="pg-input" required />
        <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} className="pg-input">
          {WALLET_NETWORKS.map((n) => (
            <option key={n.value} value={n.value}>{n.label}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.01" placeholder={t('wallets.fxFee')} value={form.fxFeePercent} onChange={(e) => setForm({ ...form, fxFeePercent: e.target.value })} className="pg-input" />
          <input type="number" step="0.01" placeholder={t('wallets.gasFee')} value={form.gasFeeAmount} onChange={(e) => setForm({ ...form, gasFeeAmount: e.target.value })} className="pg-input" />
          <input type="number" step="0.01" placeholder={t('wallets.transferFee')} value={form.transferFeeAmount} onChange={(e) => setForm({ ...form, transferFeeAmount: e.target.value })} className="pg-input" />
          <input type="number" step="0.01" placeholder={t('wallets.otherFee')} value={form.otherFeeAmount} onChange={(e) => setForm({ ...form, otherFeeAmount: e.target.value })} className="pg-input" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          {t('wallets.setDefault')}
        </label>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{t('common.register')}</button>
      </form>
    </div>
  );
}
