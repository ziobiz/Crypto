'use client';

import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type HqPgSettlementWallet,
} from '@/lib/api';
import {
  DEFAULT_NETWORK_BY_ASSET,
  WALLET_RECEIVE_ASSETS_UI_ORDER,
  defaultNetworkForAsset,
  networksForAsset,
  type WalletReceiveAsset,
} from '@/constants/wallet-networks';
import { validateWalletAddressFormat } from '@/lib/wallet-address';

type Draft = {
  asset: WalletReceiveAsset;
  network: string;
  address: string;
  label: string;
  memo: string;
};

const EMPTY_DRAFT = (): Draft => ({
  asset: 'USDC',
  network: DEFAULT_NETWORK_BY_ASSET.USDC,
  address: '',
  label: '',
  memo: '',
});

export function PgSettlementWalletsEditor() {
  const t = useT();
  const [items, setItems] = useState<HqPgSettlementWallet[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hqPolicyApi.getPgSettlementWallets();
      setItems(res.config.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function onAssetChange(asset: WalletReceiveAsset) {
    setDraft((d) => ({
      ...d,
      asset,
      network: defaultNetworkForAsset(asset),
    }));
  }

  async function onAdd() {
    setMsg('');
    setError('');
    const addrCheck = validateWalletAddressFormat(draft.network, draft.address);
    if (!addrCheck.ok) {
      setError(t('hq.accounts.pgWallet.addressInvalid'));
      return;
    }
    setSaving(true);
    try {
      const res = await hqPolicyApi.addPgSettlementWallet({
        asset: draft.asset,
        network: draft.network,
        address: draft.address.trim(),
        label: draft.label.trim() || undefined,
        memo: draft.memo.trim() || undefined,
      });
      setItems(res.config.items ?? []);
      setDraft(EMPTY_DRAFT());
      setMsg(t('hq.accounts.pgWallet.added'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(id: string) {
    if (!window.confirm(t('hq.accounts.pgWallet.removeConfirm'))) return;
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const res = await hqPolicyApi.removePgSettlementWallet(id);
      setItems(res.config.items ?? []);
      setMsg(t('hq.accounts.pgWallet.removed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="pg-hint">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="pg-hint">{t('hq.accounts.pgWallet.hint')}</p>
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        {t('hq.accounts.pgWallet.noIntegration')}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        <label className="block">
          <span className="pg-label">{t('hq.accounts.pgWallet.asset')}</span>
          <select
            className="pg-input mt-1 w-full"
            value={draft.asset}
            onChange={(e) => onAssetChange(e.target.value as WalletReceiveAsset)}
            disabled={saving}
          >
            {WALLET_RECEIVE_ASSETS_UI_ORDER.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="pg-label">{t('hq.accounts.pgWallet.network')}</span>
          <select
            className="pg-input mt-1 w-full"
            value={draft.network}
            onChange={(e) => setDraft((d) => ({ ...d, network: e.target.value }))}
            disabled={saving}
          >
            {networksForAsset(draft.asset).map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="pg-label">{t('hq.accounts.pgWallet.label')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder={t('hq.accounts.pgWallet.labelPh')}
            maxLength={80}
            disabled={saving}
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="pg-label">{t('hq.accounts.pgWallet.address')}</span>
          <input
            className="pg-input mt-1 w-full font-mono text-sm"
            value={draft.address}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            placeholder={t('hq.accounts.pgWallet.addressPh')}
            disabled={saving}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="pg-label">{t('hq.accounts.pgWallet.memo')}</span>
          <input
            className="pg-input mt-1 w-full"
            value={draft.memo}
            onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
            placeholder={t('hq.accounts.pgWallet.memoPh')}
            maxLength={200}
            disabled={saving}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="pg-btn pg-btn-primary disabled:opacity-50"
          onClick={() => void onAdd()}
          disabled={saving || !draft.address.trim()}
        >
          {saving ? t('common.saving') : t('hq.accounts.pgWallet.add')}
        </button>
        {msg && <p className="pg-hint text-emerald-700">{msg}</p>}
        {error && <p className="pg-hint text-red-600">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full text-center text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium text-center">{t('hq.accounts.pgWallet.colLabel')}</th>
              <th className="px-3 py-2 font-medium text-center">{t('hq.accounts.pgWallet.asset')}</th>
              <th className="px-3 py-2 font-medium text-center">{t('hq.accounts.pgWallet.network')}</th>
              <th className="px-3 py-2 font-medium text-center">{t('hq.accounts.pgWallet.address')}</th>
              <th className="px-3 py-2 font-medium text-center">{t('hq.accounts.pgWallet.memo')}</th>
              <th className="px-3 py-2 font-medium text-center w-20" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  {t('hq.accounts.pgWallet.empty')}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-middle">
                  <td className="px-3 py-2 text-center text-slate-800">{row.label || '—'}</td>
                  <td className="px-3 py-2 text-center font-medium">{row.asset}</td>
                  <td className="px-3 py-2 text-center">{row.network}</td>
                  <td className="px-3 py-2 text-center font-mono text-xs break-all max-w-xs">
                    {row.address}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600 text-xs max-w-[12rem]">
                    {row.memo || '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      onClick={() => void onRemove(row.id)}
                      disabled={saving}
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
