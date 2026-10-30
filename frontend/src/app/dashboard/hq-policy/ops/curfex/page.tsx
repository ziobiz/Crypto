'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi } from '@/lib/api';

type Overview = Awaited<ReturnType<typeof hqPolicyApi.getCurfexAdminOverview>>;
type Issuance = Awaited<ReturnType<typeof hqPolicyApi.listCurfexIssuances>>['items'][number];

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function money(amount: number | null | undefined, currency: string) {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return `${currency} ${amount.toLocaleString()}`;
}

export default function HqCurfexIssuanceAdminPage() {
  const t = useT();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [items, setItems] = useState<Issuance[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, list] = await Promise.all([
        hqPolicyApi.getCurfexAdminOverview(),
        hqPolicyApi.listCurfexIssuances({
          q: q.trim() || undefined,
          status: status || undefined,
          take: 200,
        }),
      ]);
      setOverview(ov);
      setItems(list.items);
      setTotal(list.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [q, status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshOne(ticketId: string) {
    setBusyId(ticketId);
    setMsg('');
    try {
      const r = await hqPolicyApi.refreshCurfexIssuance(ticketId);
      setMsg(
        r.applied
          ? t('hq.curfexAdmin.refreshApplied', { status: r.statusCode || '' })
          : t('hq.curfexAdmin.refreshOk', { status: r.statusCode || '' }),
      );
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setBusyId('');
    }
  }

  const cfg = overview?.config;
  const wallet = overview?.wallet;

  return (
    <div className="pg-stack space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{t('hq.curfexAdmin.title')}</h1>
          <p className="mt-1 text-[13px] text-gray-600">{t('hq.curfexAdmin.desc')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/hq-policy/ops/payment" className="pg-btn pg-btn-secondary text-xs">
            {t('hq.curfexAdmin.openSettings')}
          </Link>
          <button type="button" className="pg-btn pg-btn-secondary text-xs" onClick={() => void load()} disabled={loading}>
            {t('hq.curfexAdmin.reload')}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <section className="grid gap-3 md:grid-cols-2">
        <div className="pg-card">
          <div className="pg-card-head">{t('hq.curfexAdmin.statusTitle')}</div>
          <div className="pg-card-body space-y-1 text-[12px] text-slate-800">
            <p>
              {t('hq.curfexAdmin.enabled')}:{' '}
              <strong>{cfg?.enabled ? t('hq.services.active') : t('hq.services.inactive')}</strong>
            </p>
            <p>
              {t('hq.curfexAdmin.env')}:{' '}
              <strong>
                {cfg?.localMock
                  ? t('hq.curfexAdmin.envLocalMock')
                  : cfg?.nonLive
                    ? t('hq.curfexAdmin.envUat')
                    : t('hq.curfexAdmin.envLive')}
              </strong>
            </p>
            <p>
              {t('hq.curfex.apiBaseUrl')}: <span className="font-mono text-[11px]">{cfg?.apiBaseUrl || '—'}</span>
            </p>
            <p>
              {t('hq.curfex.walletName')}: <strong>{cfg?.walletName || '—'}</strong>
            </p>
            <p>
              {t('hq.curfex.currencies')}: {(cfg?.currencies || []).join(', ') || '—'}
            </p>
            <p>
              {t('hq.curfexAdmin.credentials')}:{' '}
              {cfg?.hasCredentials ? t('hq.curfexAdmin.credentialsOk') : t('hq.curfexAdmin.credentialsMissing')}
            </p>
            <p>
              {t('hq.curfexAdmin.webhook')}:{' '}
              {cfg?.hasWebhookSecret ? t('hq.curfexAdmin.webhookSecured') : t('hq.curfexAdmin.webhookOpen')}
            </p>
            <p className="break-all font-mono text-[11px] text-slate-600">{overview?.webhookUrl}</p>
            <p className="text-[11px] text-slate-500">
              {t('hq.curfexAdmin.defaults', {
                corporate: cfg?.defaultCollectionModeCorporate || 'FIXED',
                individual: cfg?.defaultCollectionModeIndividual || 'DIRECT',
              })}
            </p>
          </div>
        </div>

        <div className="pg-card">
          <div className="pg-card-head">{t('hq.curfexAdmin.walletTitle')}</div>
          <div className="pg-card-body space-y-1 text-[12px] text-slate-800">
            {overview?.walletError && <p className="text-red-600">{overview.walletError}</p>}
            {!wallet && !overview?.walletError && (
              <p className="pg-hint">{t('hq.curfexAdmin.walletEmpty')}</p>
            )}
            {wallet && (
              <>
                <p>
                  {t('hq.curfexAdmin.walletName')}: <strong>{wallet.walletName}</strong>
                </p>
                <p>
                  {t('hq.curfexAdmin.walletStatus')}: <strong>{wallet.statusCode}</strong> / {wallet.currency}
                </p>
                <p>
                  {t('hq.curfexAdmin.walletCollected')}:{' '}
                  {wallet.paymentsCollected != null ? wallet.paymentsCollected.toLocaleString() : '—'}
                </p>
                <p>
                  {t('hq.curfexAdmin.walletPending')}:{' '}
                  {wallet.paymentsPending != null ? wallet.paymentsPending.toLocaleString() : '—'}
                </p>
                <p>
                  {t('hq.curfexAdmin.walletAvailable')}:{' '}
                  {wallet.fundsAvailableForSettlement != null
                    ? wallet.fundsAvailableForSettlement.toLocaleString()
                    : '—'}
                </p>
                <p>
                  {t('hq.curfexAdmin.walletSettlement')}: {wallet.settlementInterval || '—'}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="pg-card">
        <div className="pg-card-head flex flex-wrap items-center justify-between gap-2">
          <span>
            {t('hq.curfexAdmin.listTitle')} ({total})
          </span>
        </div>
        <div className="pg-card-body space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="pg-label">{t('common.search')}</span>
              <input
                className="pg-input mt-1 w-56 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('hq.curfexAdmin.searchPlaceholder')}
              />
            </label>
            <label className="block">
              <span className="pg-label">{t('hq.curfexAdmin.curfexStatus')}</span>
              <select
                className="pg-input mt-1 w-48 text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">{t('filter.all')}</option>
                <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
                <option value="AWAITING_DECISION">AWAITING_DECISION</option>
                <option value="PAID">PAID</option>
                <option value="APPROVED">APPROVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
            <button type="button" className="pg-btn pg-btn-primary text-xs" onClick={() => void load()} disabled={loading}>
              {t('common.search')}
            </button>
          </div>

          <div className="pg-table-wrap overflow-x-auto">
            <table className="pg-table text-[11px]">
              <thead>
                <tr>
                  <th>{t('hq.curfexAdmin.col.ticket')}</th>
                  <th>{t('hq.curfexAdmin.col.customer')}</th>
                  <th>{t('hq.curfexAdmin.col.ref')}</th>
                  <th>{t('hq.curfexAdmin.col.amount')}</th>
                  <th>{t('hq.curfexAdmin.col.account')}</th>
                  <th>{t('hq.curfexAdmin.col.curfexStatus')}</th>
                  <th>{t('hq.curfexAdmin.col.lane')}</th>
                  <th>{t('hq.curfexAdmin.col.created')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="pg-hint py-6">
                      {loading ? t('common.loading') : t('hq.curfexAdmin.empty')}
                    </td>
                  </tr>
                )}
                {items.map((row) => (
                  <tr key={row.ticketId}>
                    <td>
                      <Link className="font-semibold text-sky-800 underline" href={`/dashboard/usdt/${row.ticketId}`}>
                        {row.ticketNo}
                      </Link>
                      <div className="text-slate-500">{row.purchaseStatus}</div>
                    </td>
                    <td>
                      <div>{row.customerName || '—'}</div>
                      <div className="text-slate-500">{row.customerEmail}</div>
                      <div className="text-slate-500">{row.customerType}</div>
                    </td>
                    <td className="font-mono">{row.curfexRefNo || '—'}</td>
                    <td>
                      {money(row.confirmedFiatAmount ?? row.fiatAmount, row.fiatCurrency)}
                    </td>
                    <td className="whitespace-nowrap">
                      {row.collectionAccount ? (
                        <>
                          <div>{row.collectionAccount.bankName}</div>
                          <div>
                            {row.collectionAccount.branchCode} {row.collectionAccount.branchName}
                          </div>
                          <div>
                            {row.collectionAccount.accountType} {row.collectionAccount.accountNo}
                          </div>
                          <div className="text-slate-500">{row.collectionAccount.accountName}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div>{row.curfexStatusCode || '—'}</div>
                      {row.curfexDepositDetectedAt && (
                        <div className="text-emerald-700">
                          {t('hq.curfexAdmin.depositedAt')}: {fmtWhen(row.curfexDepositDetectedAt)}
                        </div>
                      )}
                    </td>
                    <td>{row.tradeLane === 'SYNTH' ? 'SINTH' : row.tradeLane}</td>
                    <td>
                      <div>{fmtWhen(row.createdAt)}</div>
                      <div className="text-slate-500">
                        {t('hq.curfexAdmin.deadline')}: {fmtWhen(row.depositDeadlineAt)}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pg-btn pg-btn-secondary text-[10px]"
                        disabled={busyId === row.ticketId || !row.curfexRefNo}
                        onClick={() => void refreshOne(row.ticketId)}
                      >
                        {busyId === row.ticketId ? t('common.saving') : t('hq.curfexAdmin.refreshStatus')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
