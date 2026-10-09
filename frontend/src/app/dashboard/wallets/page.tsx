'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useAuth } from '@/context/AuthProvider';
import { api, ApiError, Wallet, type SettlementAsset } from '@/lib/api';
import {
  defaultNetworkForAsset,
  networksForAsset,
} from '@/constants/wallet-networks';
import { ContentCard } from '@/components/layout/ContentCard';
import { CopyButton } from '@/components/CopyButton';
import { displayWalletLabel, displayWalletTitle } from '@/lib/wallet-label';
import { validateWalletAddressFormat } from '@/lib/wallet-address';
import { SensitiveOtpGate, useSensitiveOtp } from '@/components/SensitiveOtpGate';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  MobileStackCard,
  MobileStackEmpty,
  MobileStackField,
  MobileStackFields,
  MobileStackList,
} from '@/components/layout/MobileStackList';

import { SETTLEMENT_ASSETS_UI_ORDER } from '@/constants/ui-display-order';

const MAX_WALLETS_PER_ASSET = 6;
/** USDC 먼저, USDT 다음 (관리자 UI 통일 규칙) */
const ASSET_TABS: SettlementAsset[] = [...SETTLEMENT_ASSETS_UI_ORDER];

function emptyForm(asset: SettlementAsset = 'USDC') {
  return {
    label: '',
    address: '',
    network: defaultNetworkForAsset(asset),
    assetType: asset,
  };
}

function walletErrorMessage(
  err: unknown,
  t: (
    key:
      | 'wallets.err.limit'
      | 'wallets.err.duplicate'
      | 'wallets.err.inProgress'
      | 'wallets.err.last'
      | 'wallets.err.deletePending'
      | 'wallets.err.nicknameRequired'
      | 'wallets.err.networkAsset'
      | 'wallets.err.addressInvalid'
      | 'wallets.err.assetLocked'
      | 'common.saveFailed',
  ) => string,
) {
  if (err instanceof ApiError) {
    if (err.code === 'WALLET_LIMIT') return t('wallets.err.limit');
    if (err.code === 'WALLET_DUPLICATE') return t('wallets.err.duplicate');
    if (err.code === 'WALLET_IN_PROGRESS') return t('wallets.err.inProgress');
    if (err.code === 'WALLET_LAST') return t('wallets.err.last');
    if (err.code === 'WALLET_DELETE_PENDING') return t('wallets.err.deletePending');
    if (err.code === 'WALLET_NICKNAME_REQUIRED') return t('wallets.err.nicknameRequired');
    if (err.code === 'WALLET_NETWORK_ASSET') return t('wallets.err.networkAsset');
    if (err.code === 'WALLET_ADDRESS_INVALID') return t('wallets.err.addressInvalid');
    if (err.code === 'WALLET_ASSET_LOCKED') return t('wallets.err.assetLocked');
    return err.message;
  }
  return t('common.saveFailed');
}

type EditDraft = {
  id: string;
  label: string;
  address: string;
  network: string;
  assetType: SettlementAsset;
};

function tabClass(asset: SettlementAsset, active: boolean) {
  if (asset === 'USDC') {
    return active
      ? 'rounded-md px-3 py-1.5 text-xs font-bold bg-sky-600 text-white shadow-sm'
      : 'rounded-md px-3 py-1.5 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100';
  }
  return active
    ? 'rounded-md px-3 py-1.5 text-xs font-bold bg-rose-600 text-white shadow-sm'
    : 'rounded-md px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100';
}

function WalletsBody() {
  const t = useT();
  const { user } = useAuth();
  const { runWithFreshOtp } = useSensitiveOtp();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const settlementAsset: SettlementAsset =
    user?.sessionPolicy?.settlementAsset === 'USDT' ? 'USDT' : 'USDC';
  const [assetTab, setAssetTab] = useState<SettlementAsset>(settlementAsset);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState(() => emptyForm(settlementAsset));
  const [editModal, setEditModal] = useState<EditDraft | null>(null);
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
  useEffect(() => {
    setAssetTab(settlementAsset);
    setForm((prev) => {
      if (prev.label || prev.address) return prev;
      return emptyForm(settlementAsset);
    });
  }, [settlementAsset]);

  const tabWallets = useMemo(
    () => wallets.filter((w) => (w.assetType ?? 'USDT') === assetTab),
    [wallets, assetTab],
  );
  const countByAsset = useMemo(() => {
    const usdt = wallets.filter((w) => (w.assetType ?? 'USDT') === 'USDT').length;
    const usdc = wallets.filter((w) => (w.assetType ?? 'USDT') === 'USDC').length;
    return { USDT: usdt, USDC: usdc };
  }, [wallets]);
  const tabAtLimit = tabWallets.length >= MAX_WALLETS_PER_ASSET;

  function switchTab(next: SettlementAsset) {
    setAssetTab(next);
    setEditModal(null);
    setError('');
    setForm((prev) => {
      if (prev.label || prev.address) {
        return { ...prev, assetType: next, network: defaultNetworkForAsset(next) };
      }
      return emptyForm(next);
    });
  }

  function openEdit(w: Wallet) {
    if (w.deleteRequestedAt) return;
    setError('');
    setEditModal({
      id: w.id,
      label:
        displayWalletLabel(w.label, t) === t('wallets.systemDefaultLabel')
          ? ''
          : (w.label ?? ''),
      address: w.address,
      network: w.network,
      assetType: (w.assetType ?? 'USDT') as SettlementAsset,
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nick = form.label.trim();
    if (!nick) {
      setError(t('wallets.err.nicknameRequired'));
      return;
    }
    const addrCheck = validateWalletAddressFormat(form.network, form.address);
    if (!addrCheck.ok) {
      setError(t('wallets.err.addressInvalid'));
      return;
    }
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
              label: nick,
              address: form.address.trim(),
              network: form.network,
              assetType: assetTab,
              isDefault: false,
            }),
          );
          if (result.cancelled) return;
          setForm(emptyForm(assetTab));
          await load();
        } catch (err) {
          setError(walletErrorMessage(err, t));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  function submitEditModal() {
    if (!editModal) return;
    const nick = editModal.label.trim();
    if (!nick) {
      setError(t('wallets.err.nicknameRequired'));
      return;
    }
    const addrCheck = validateWalletAddressFormat(editModal.network, editModal.address);
    if (!addrCheck.ok) {
      setError(t('wallets.err.addressInvalid'));
      return;
    }
    const draft = { ...editModal, label: nick, address: editModal.address.trim() };
    setError('');
    requestConfirm({
      title: t('wallets.confirmChangeTitle'),
      step1: t('wallets.confirmChange1'),
      step2: t('wallets.confirmChange2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setLoading(true);
        try {
          const result = await runWithFreshOtp(async () => {
            await api.wallets.updateNickname(draft.id, draft.label);
            await api.wallets.update(draft.id, {
              address: draft.address,
              network: draft.network,
            });
          });
          if (result.cancelled) return;
          setEditModal(null);
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

  function renderManageActions(w: Wallet) {
    const asset = (w.assetType ?? 'USDT') as SettlementAsset;
    const sameAssetCount = wallets.filter((x) => (x.assetType ?? 'USDT') === asset).length;
    const canEdit = !w.deleteRequestedAt;
    /** 자산별 지갑이 1개면 자동 대표 — 수동 지정 불필요 */
    const canDefault =
      sameAssetCount > 1 &&
      !w.isDefault &&
      w.approvalStatus === 'APPROVED' &&
      !w.deleteRequestedAt;
    const canDelete = !w.deleteRequestedAt && sameAssetCount > 1;

    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          className="pg-btn pg-btn-secondary text-[11px] whitespace-nowrap"
          disabled={loading || !canEdit}
          onClick={(e) => {
            e.stopPropagation();
            openEdit(w);
          }}
        >
          {t('wallets.action.edit')}
        </button>
        <button
          type="button"
          className="pg-btn pg-btn-secondary text-[11px] whitespace-nowrap text-red-600"
          disabled={loading || !canDelete}
          onClick={(e) => {
            e.stopPropagation();
            submitDeleteRequest(w.id);
          }}
        >
          {t('wallets.action.deleteRequest')}
        </button>
        <button
          type="button"
          className="pg-btn pg-btn-secondary text-[11px] whitespace-nowrap"
          disabled={loading || !canDefault}
          onClick={(e) => {
            e.stopPropagation();
            void setDefault(w.id);
          }}
        >
          {t('wallets.action.setDefault')}
        </button>
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
        <p className="pg-hint">{t('wallets.nicknameHint')}</p>
        <p className="pg-hint">{t('wallets.setDefaultHint')}</p>
        <p className="pg-hint">{t('wallets.doubleClickHint')}</p>
        <p className="pg-hint">{t('wallets.rulesHint')}</p>
        {error ? <p className="pg-error">{error}</p> : null}

        <div className="pg-segment-bar" role="tablist" aria-label={t('wallets.assetTabs')}>
          {ASSET_TABS.map((asset) => (
            <button
              key={asset}
              type="button"
              role="tab"
              aria-selected={assetTab === asset}
              onClick={() => switchTab(asset)}
              className={tabClass(asset, assetTab === asset)}
            >
              {asset} ({countByAsset[asset]})
            </button>
          ))}
        </div>
        <p className="pg-hint">{t('wallets.tabHint', { asset: assetTab })}</p>

        <MobileStackList>
          {tabWallets.map((w) => (
            <div
              key={w.id}
              className={w.deleteRequestedAt ? undefined : 'cursor-pointer'}
              onDoubleClick={() => openEdit(w)}
            >
              <MobileStackCard>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold">{displayWalletTitle(w, t)}</p>
                    <p className="pg-muted text-[11px]">
                      {t('wallets.col.network')}: {w.network} · {t('wallets.col.asset')}:{' '}
                      {w.assetType ?? 'USDT'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {w.isDefault ? (
                      <span className="pg-badge pg-badge-info">
                        {t('wallets.defaultForAsset', { asset: w.assetType ?? 'USDT' })}
                      </span>
                    ) : null}
                    <span className="pg-badge pg-badge-muted">{walletStatus(w)}</span>
                  </div>
                </div>
                <MobileStackFields>
                  <MobileStackField label={t('wallets.address')} wide>
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-xs">{w.address}</span>
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
                <div className="flex justify-center" onDoubleClick={(e) => e.stopPropagation()}>
                  {renderManageActions(w)}
                </div>
              </MobileStackCard>
            </div>
          ))}
          {tabWallets.length === 0 && (
            <MobileStackEmpty>{t('wallets.emptyAsset', { asset: assetTab })}</MobileStackEmpty>
          )}
        </MobileStackList>

        <div className="pg-card pg-table-wrap hidden md:block">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('wallets.label')}</th>
                <th>{t('wallets.col.network')}</th>
                <th>{t('wallets.col.asset')}</th>
                <th>{t('wallets.address')}</th>
                <th>{t('wallets.col.fees')}</th>
                <th>{t('wallets.col.status')}</th>
                <th className="text-center">{t('common.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {tabWallets.map((w) => (
                <tr
                  key={w.id}
                  className={w.deleteRequestedAt ? undefined : 'cursor-pointer'}
                  onDoubleClick={() => openEdit(w)}
                  title={w.deleteRequestedAt ? undefined : t('wallets.doubleClickHint')}
                >
                  <td className="font-medium">{displayWalletLabel(w.label, t)}</td>
                  <td className="whitespace-nowrap text-xs font-semibold">{w.network}</td>
                  <td className="whitespace-nowrap text-xs font-semibold">{w.assetType ?? 'USDT'}</td>
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
                        <span className="pg-badge pg-badge-info">
                          {t('wallets.defaultForAsset', { asset: w.assetType ?? 'USDT' })}
                        </span>
                      ) : null}
                      <span className="pg-badge pg-badge-muted">{walletStatus(w)}</span>
                    </div>
                  </td>
                  <td className="text-center align-middle" onDoubleClick={(e) => e.stopPropagation()}>
                    {renderManageActions(w)}
                  </td>
                </tr>
              ))}
              {tabWallets.length === 0 && (
                <tr>
                  <td colSpan={7} className="pg-empty">
                    {t('wallets.emptyAsset', { asset: assetTab })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {tabAtLimit ? (
          <p className="pg-hint">{t('wallets.limitReachedAsset', { asset: assetTab })}</p>
        ) : (
          <ContentCard title={t('wallets.addTitleAsset', { asset: assetTab })}>
            <p className="pg-hint mb-4">{t('wallets.extraHint')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="pg-label">
                    {t('wallets.label')} <span className="text-red-600">*</span>
                  </span>
                  <input
                    placeholder={t('wallets.labelPlaceholder')}
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="pg-input mt-1 w-full"
                    maxLength={40}
                    required
                  />
                  <p className="pg-hint mt-1 text-[11px]">{t('wallets.labelHint')}</p>
                </label>
                <label className="block">
                  <span className="pg-label">{t('wallets.col.asset')}</span>
                  <input
                    value={assetTab}
                    readOnly
                    className="pg-input mt-1 w-full bg-slate-50 font-semibold"
                  />
                  <p className="pg-hint mt-1 text-[11px]">{t('wallets.assetFixedHint')}</p>
                </label>
                <label className="block">
                  <span className="pg-label">{t('wallets.col.network')}</span>
                  <select
                    value={form.network}
                    onChange={(e) => setForm({ ...form, network: e.target.value })}
                    className="pg-input mt-1 w-full"
                  >
                    {networksForAsset(assetTab).map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <p className="pg-hint mt-1 text-[11px]">
                    {assetTab === 'USDC'
                      ? t('wallets.networkHintUsdc')
                      : t('wallets.networkHintUsdt')}
                  </p>
                </label>
                <label className="block sm:col-span-2">
                  <span className="pg-label">
                    {t('wallets.address')} ({assetTab})
                  </span>
                  <input
                    placeholder={t('wallets.addressPlaceholder', { asset: assetTab })}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="pg-input mt-1 w-full font-mono text-sm"
                    required
                  />
                  <p className="pg-hint mt-1 text-[11px]">{t('wallets.addressFormatHint')}</p>
                </label>
              </div>
              <button type="submit" disabled={loading} className="pg-btn pg-btn-primary disabled:opacity-50">
                {t('common.register')}
              </button>
            </form>
          </ContentCard>
        )}
      </div>

      {editModal ? (
        <div
          className="pg-modal-overlay"
          role="presentation"
          onClick={() => !loading && setEditModal(null)}
        >
          <div
            className="pg-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pg-modal-head">
              <h2 id="wallet-edit-title" className="pg-modal-title">
                {t('wallets.editModalTitle')}
              </h2>
              <p className="pg-modal-sub">{t('wallets.editModalSub')}</p>
            </div>
            <div className="pg-modal-body">
              <label className="block">
                <span className="pg-label">
                  {t('wallets.label')} <span className="text-red-600">*</span>
                </span>
                <input
                  value={editModal.label}
                  onChange={(e) => setEditModal({ ...editModal, label: e.target.value })}
                  className="pg-input mt-1 w-full"
                  maxLength={40}
                  placeholder={t('wallets.labelPlaceholder')}
                />
              </label>
              <label className="block">
                <span className="pg-label">{t('wallets.col.asset')}</span>
                <input
                  value={editModal.assetType}
                  readOnly
                  className="pg-input mt-1 w-full bg-slate-50 font-semibold"
                />
                <p className="pg-hint mt-1 text-[11px]">{t('wallets.assetLockedHint')}</p>
              </label>
              <label className="block">
                <span className="pg-label">{t('wallets.col.network')}</span>
                <select
                  value={editModal.network}
                  onChange={(e) => setEditModal({ ...editModal, network: e.target.value })}
                  className="pg-input mt-1 w-full"
                >
                  {networksForAsset(editModal.assetType).map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <p className="pg-hint mt-1 text-[11px]">
                  {editModal.assetType === 'USDC'
                    ? t('wallets.networkHintUsdc')
                    : t('wallets.networkHintUsdt')}
                </p>
              </label>
              <label className="block">
                <span className="pg-label">
                  {t('wallets.address')} ({editModal.assetType})
                </span>
                <input
                  value={editModal.address}
                  onChange={(e) => setEditModal({ ...editModal, address: e.target.value })}
                  className="pg-input mt-1 w-full font-mono text-sm"
                />
                <p className="pg-hint mt-1 text-[11px]">{t('wallets.addressFormatHint')}</p>
              </label>
            </div>
            <div className="pg-modal-foot">
              <button
                type="button"
                className="pg-btn pg-btn-secondary"
                disabled={loading}
                onClick={() => setEditModal(null)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="pg-btn pg-btn-primary"
                disabled={loading}
                onClick={submitEditModal}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
