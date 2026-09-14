'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useAuth } from '@/context/AuthProvider';
import { api, ApiError, Wallet } from '@/lib/api';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';
import { ContentCard } from '@/components/layout/ContentCard';
import { displayWalletLabel } from '@/lib/wallet-label';
import { SensitiveOtpGate } from '@/components/SensitiveOtpGate';
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
};

export default function WalletsPage() {
  const t = useT();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function walletStatus(w: Wallet) {
    if (w.hqRegistered) return t('wallets.hqRegistered');
    if (w.approvalStatus === 'PENDING') return t('wallets.pending');
    if (w.approvalStatus === 'REJECTED') return t('wallets.rejected');
    return t('wallets.approved');
  }

  const load = () => api.wallets.list().then(setWallets).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.wallets.create({
        label: form.label || undefined,
        address: form.address,
        network: form.network,
        isDefault: false,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  async function setDefault(id: string) {
    setLoading(true);
    setError('');
    try {
      await api.wallets.update(id, { isDefault: true });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  function feeSummary(w: Wallet) {
    if (w.feesVisible === false || !w.effectiveFees) {
      return t('wallets.feeFollowHq');
    }
    const f = w.effectiveFees;
    return t('wallets.feeLine', {
      network: w.network,
      gas: String(f.gasFeeUsdt),
      platform: String(f.transferFeeUsdt + f.otherFeeUsdt),
    });
  }

  if (user?.role === 'CUSTOMER_OPERATOR') {
    return (
      <div className="pg-stack">
        <p className="pg-error">{t('merchantUsers.adminOnly')}</p>
      </div>
    );
  }

  return (
    <SensitiveOtpGate>
      <div className="pg-stack">
        <p className="pg-hint">{t('wallets.subtitle')}</p>
        {error ? <p className="pg-error">{error}</p> : null}

        <MobileStackList>
          {wallets.map((w) => (
            <MobileStackCard key={w.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-left text-sm font-semibold">{displayWalletLabel(w.label, t)}</p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {w.isDefault ? (
                    <span className="pg-badge pg-badge-info">{t('wallets.default')}</span>
                  ) : null}
                  <span className="pg-badge pg-badge-muted">{walletStatus(w)}</span>
                </div>
              </div>
              <MobileStackFields>
                <MobileStackField label={t('wallets.address')} wide>
                  <span className="font-mono text-xs">{w.address}</span>
                </MobileStackField>
                <MobileStackField label={t('wallets.col.fees')} wide>
                  {feeSummary(w)}
                </MobileStackField>
              </MobileStackFields>
              {!w.isDefault && w.approvalStatus === 'APPROVED' ? (
                <button
                  type="button"
                  className="pg-btn pg-btn-secondary mt-2 text-[11px]"
                  disabled={loading}
                  onClick={() => setDefault(w.id)}
                >
                  {t('wallets.setDefault')}
                </button>
              ) : null}
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
                <th>{t('common.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id}>
                  <td className="font-medium">{displayWalletLabel(w.label, t)}</td>
                  <td className="font-mono text-xs sm:text-sm">{w.address}</td>
                  <td className="pg-muted text-xs">{feeSummary(w)}</td>
                  <td className="align-middle">
                    <div className="flex w-full flex-col items-center justify-center gap-1">
                      {w.isDefault ? (
                        <span className="pg-badge pg-badge-info">{t('wallets.default')}</span>
                      ) : null}
                      <span className="pg-badge pg-badge-muted">{walletStatus(w)}</span>
                    </div>
                  </td>
                  <td>
                    {!w.isDefault && w.approvalStatus === 'APPROVED' ? (
                      <button
                        type="button"
                        className="pg-btn pg-btn-secondary text-[11px]"
                        disabled={loading}
                        onClick={() => setDefault(w.id)}
                      >
                        {t('wallets.setDefault')}
                      </button>
                    ) : w.hqRegistered ? (
                      <span className="pg-muted text-xs">{t('wallets.hqLocked')}</span>
                    ) : (
                      <span className="pg-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && (
                <tr>
                  <td colSpan={5} className="pg-empty">
                    {t('wallets.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ContentCard title={t('wallets.addTitle')}>
          <p className="pg-hint mb-4">{t('wallets.extraHint')}</p>
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
            <button type="submit" disabled={loading} className="pg-btn pg-btn-primary disabled:opacity-50">
              {t('common.register')}
            </button>
          </form>
        </ContentCard>
      </div>
    </SensitiveOtpGate>
  );
}
