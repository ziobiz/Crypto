'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useAuth } from '@/context/AuthProvider';
import { api, ApiError, Wallet } from '@/lib/api';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';
import { ContentCard } from '@/components/layout/ContentCard';
import { CopyButton } from '@/components/CopyButton';
import { displayWalletLabel } from '@/lib/wallet-label';
import { SensitiveOtpGate, useSensitiveOtp } from '@/components/SensitiveOtpGate';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
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

function walletErrorMessage(err: unknown, t: (key: 'wallets.err.limit' | 'wallets.err.duplicate' | 'wallets.err.inProgress' | 'wallets.err.last' | 'wallets.err.deletePending' | 'common.saveFailed') => string) {
  if (err instanceof ApiError) {
    if (err.code === 'WALLET_LIMIT') return t('wallets.err.limit');
    if (err.code === 'WALLET_DUPLICATE') return t('wallets.err.duplicate');
    if (err.code === 'WALLET_IN_PROGRESS') return t('wallets.err.inProgress');
    if (err.code === 'WALLET_LAST') return t('wallets.err.last');
    if (err.code === 'WALLET_DELETE_PENDING') return t('wallets.err.deletePending');
    return err.message;
  }
  return t('common.saveFailed');
}

function WalletsBody() {
  const t = useT();
  const { user } = useAuth();
  const { runWithFreshOtp } = useSensitiveOtp();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<{ id: string; address: string; network: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function walletStatus(w: Wallet) {
    if (w.deleteRequestedAt) return t('wallets.deleteRequested');
    if (w.approvalStatus === 'PENDING') return t('wallets.pending');
    if (w.approvalStatus === 'REJECTED') return t('wallets.rejected');
    if (w.hqRegistered) return t('wallets.hqRegistered');
    return t('wallets.approved');
  }

  const load = () => api.wallets.list().then(setWallets).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    requestConfirm({
      title: t('wallets.confirmRegisterTitle'),
      step1: t('wallets.confirmRegister1'),
      step2: t('wallets.confirmRegister2'),
      confirmLabel: t('common.register'),
      onConfirm: async () => {
        setLoading(true);
        try {
          const result = await runWithFreshOtp(() =>
            api.wallets.create({
              label: form.label || undefined,
              address: form.address,
              network: form.network,
              isDefault: false,
            }),
          );
          if (result.cancelled) return;
          setForm(emptyForm);
          await load();
        } catch (err) {
          setError(walletErrorMessage(err, t));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  function submitAddressChange() {
    if (!editing) return;
    const draft = editing;
    setError('');
    requestConfirm({
      title: t('wallets.confirmChangeTitle'),
      step1: t('wallets.confirmChange1'),
      step2: t('wallets.confirmChange2'),
      confirmLabel: t('wallets.changeAddress'),
      onConfirm: async () => {
        setLoading(true);
        try {
          const result = await runWithFreshOtp(() =>
            api.wallets.update(draft.id, { address: draft.address, network: draft.network }),
          );
          if (result.cancelled) return;
          setEditing(null);
          await load();
        } catch (err) {
          setError(walletErrorMessage(err, t));
        } finally {
          setLoading(false);
        }
      },
    });
  }

  function submitDeleteRequest(id: string) {
    setError('');
    requestConfirm({
      title: t('wallets.confirmDeleteTitle'),
      step1: t('wallets.confirmDelete1'),
      step2: t('wallets.confirmDelete2'),
      confirmLabel: t('wallets.requestDelete'),
      onConfirm: async () => {
        setLoading(true);
        try {
          const result = await runWithFreshOtp(() => api.wallets.requestDelete(id));
          if (result.cancelled) return;
          await load();
        } catch (err) {
          setError(walletErrorMessage(err, t));
        } finally {
          setLoading(false);
        }
      },
    });
  }

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

  function renderWalletActions(w: Wallet) {
    return (
      <div className="mt-2 flex flex-col items-start gap-1">
        {!w.isDefault && w.approvalStatus === 'APPROVED' && !w.deleteRequestedAt ? (
          <button
            type="button"
            className="pg-btn pg-btn-secondary text-[11px]"
            disabled={loading}
            onClick={() => setDefault(w.id)}
          >
            {t('wallets.setDefault')}
          </button>
        ) : null}
        {!w.deleteRequestedAt ? (
          <button
            type="button"
            className="pg-btn pg-btn-secondary text-[11px]"
            disabled={loading}
            onClick={() => setEditing({ id: w.id, address: w.address, network: w.network })}
          >
            {t('wallets.changeAddress')}
          </button>
        ) : null}
        {!w.deleteRequestedAt && wallets.length > 1 ? (
          <button
            type="button"
            className="pg-btn pg-btn-secondary text-[11px] text-red-600"
            disabled={loading}
            onClick={() => submitDeleteRequest(w.id)}
          >
            {t('wallets.requestDelete')}
          </button>
        ) : null}
        {editing?.id === w.id ? (
          <div className="mt-1 w-full space-y-1">
            <input
              value={editing.address}
              onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              className="pg-input w-full font-mono text-xs"
            />
            <select
              value={editing.network}
              onChange={(e) => setEditing({ ...editing, network: e.target.value })}
              className="pg-input w-full text-xs"
            >
              {WALLET_NETWORKS.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <button type="button" className="pg-btn pg-btn-primary text-[11px]" disabled={loading} onClick={submitAddressChange}>
                {t('common.save')}
              </button>
              <button type="button" className="pg-btn pg-btn-secondary text-[11px]" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
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
    <>
      <div className="pg-stack">
        <p className="pg-hint">{t('wallets.subtitle')}</p>
        <p className="pg-hint">{t('wallets.rulesHint')}</p>
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
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs break-all">{w.address}</span>
                    <CopyButton
                      text={w.address}
                      label={t('wallets.copyAddress')}
                      copiedLabel={t('common.copied')}
                    />
                  </span>
                </MobileStackField>
                <MobileStackField label={t('wallets.col.fees')} wide>
                  {feeSummary(w)}
                </MobileStackField>
              </MobileStackFields>
              {renderWalletActions(w)}
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
                  <td className="font-mono text-xs sm:text-sm">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="break-all">{w.address}</span>
                      <CopyButton
                        text={w.address}
                        label={t('wallets.copyAddress')}
                        copiedLabel={t('common.copied')}
                      />
                    </span>
                  </td>
                  <td className="pg-muted text-xs">{feeSummary(w)}</td>
                  <td className="align-middle">
                    <div className="flex w-full flex-col items-center justify-center gap-1">
                      {w.isDefault ? (
                        <span className="pg-badge pg-badge-info">{t('wallets.default')}</span>
                      ) : null}
                      <span className="pg-badge pg-badge-muted">{walletStatus(w)}</span>
                    </div>
                  </td>
                  <td>{renderWalletActions(w)}</td>
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

        {wallets.length >= 5 ? (
          <p className="pg-hint">{t('wallets.limitReached')}</p>
        ) : (
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
        )}
      </div>
      {doubleConfirmDialog}
    </>
  );
}

export default function WalletsPage() {
  return (
    <SensitiveOtpGate>
      <WalletsBody />
    </SensitiveOtpGate>
  );
}
