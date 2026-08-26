'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { api, Wallet } from '@/lib/api';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';
import { ContentCard } from '@/components/layout/ContentCard';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { displayWalletLabel } from '@/lib/wallet-label';
import {
  MobileStackCard,
  MobileStackEmpty,
  MobileStackField,
  MobileStackFields,
  MobileStackList,
} from '@/components/layout/MobileStackList';

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
  useEffect(() => {
    load();
  }, []);

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
    if (!f) return w.network;
    return t('wallets.feeLine', {
      network: w.network,
      gas: String(f.gasFeeUsdt),
      platform: String(f.transferFeeUsdt + f.otherFeeUsdt),
    });
  }

  return (
    <div className="pg-stack">
      <p className="pg-hint">{t('wallets.subtitle')}</p>

      <MobileStackList>
        {wallets.map((w) => (
          <MobileStackCard key={w.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-left text-sm font-semibold">{displayWalletLabel(w.label, t)}</p>
              {w.isDefault ? (
                <span className="pg-badge pg-badge-info shrink-0">{t('wallets.default')}</span>
              ) : null}
            </div>
            <MobileStackFields>
              <MobileStackField label={t('wallets.address')} wide>
                <span className="font-mono text-xs">{w.address}</span>
              </MobileStackField>
              <MobileStackField label={t('wallets.col.fees')} wide>
                {feeSummary(w)}
              </MobileStackField>
            </MobileStackFields>
          </MobileStackCard>
        ))}
        {wallets.length === 0 && <MobileStackEmpty>{t('wallets.empty')}</MobileStackEmpty>}
      </MobileStackList>

      <div className="pg-card pg-table-wrap hidden md:block">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('wallets.label')}</th>
              <th>{t('wallets.address')}</th>
              <th>{t('wallets.col.fees')}</th>
              <th>{t('wallets.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id}>
                <td className="font-medium">{displayWalletLabel(w.label, t)}</td>
                <td className="font-mono text-xs sm:text-sm">{w.address}</td>
                <td className="pg-muted text-xs">{feeSummary(w)}</td>
                <td>
                  {w.isDefault ? (
                    <span className="pg-badge pg-badge-info">{t('wallets.default')}</span>
                  ) : (
                    <span className="pg-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {wallets.length === 0 && (
              <tr>
                <td colSpan={4} className="pg-empty">
                  {t('wallets.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ContentCard title={t('wallets.addTitle')}>
        <p className="pg-hint mb-4">{t('wallets.feeHint')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="pg-label">{t('wallets.label')}</span>
              <input
                placeholder={t('wallets.label')}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="pg-input mt-1 w-full"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="pg-label">{t('wallets.address')}</span>
              <input
                placeholder={t('wallets.address')}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="pg-input mt-1 w-full font-mono text-sm"
                required
              />
            </label>
            <label className="block">
              <span className="pg-label">{t('wallets.col.network')}</span>
              <select
                value={form.network}
                onChange={(e) => setForm({ ...form, network: e.target.value })}
                className="pg-input mt-1 w-full"
              >
                {WALLET_NETWORKS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="pg-label">{t('wallets.fxFee')}</span>
              <PolicyNumberInput
                step="0.01"
                value={parseFloat(form.fxFeePercent) || 0}
                onChange={(n) => setForm({ ...form, fxFeePercent: String(n) })}
                className="pg-input mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="pg-label">{t('wallets.gasFee')}</span>
              <PolicyNumberInput
                step="0.01"
                value={parseFloat(form.gasFeeAmount) || 0}
                onChange={(n) => setForm({ ...form, gasFeeAmount: String(n) })}
                className="pg-input mt-1 w-full"
              />
              <span className="pg-hint mt-1 block">{t('wallets.gasFeeHint')}</span>
            </label>
            <label className="block">
              <span className="pg-label">{t('wallets.transferFee')}</span>
              <PolicyNumberInput
                step="0.01"
                value={parseFloat(form.transferFeeAmount) || 0}
                onChange={(n) => setForm({ ...form, transferFeeAmount: String(n) })}
                className="pg-input mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="pg-label">{t('wallets.otherFee')}</span>
              <PolicyNumberInput
                step="0.01"
                value={parseFloat(form.otherFeeAmount) || 0}
                onChange={(n) => setForm({ ...form, otherFeeAmount: String(n) })}
                className="pg-input mt-1 w-full"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            {t('wallets.setDefault')}
          </label>
          <button type="submit" disabled={loading} className="pg-btn pg-btn-primary disabled:opacity-50">
            {t('common.register')}
          </button>
        </form>
      </ContentCard>
    </div>
  );
}
