'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import {
  defaultTxFilter,
  TransactionFilterBar,
  type TransactionFilterState,
} from '@/components/TransactionFilterBar';
import { membershipAdminApi, type MembershipAdminOrderRow } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { PageSizeBar } from '@/components/PageSizeBar';

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED'] as const;
const PAY_MEANS = ['', 'CARD', 'CRYPTO'] as const;
const CRYPTO_ASSETS = ['', 'USDT', 'USDC', 'EURC'] as const;
const SUCCESS_STATUSES = new Set(['PAID', 'PENDING']);

type ExtraFilter = { payMeans: string; cryptoAsset: string };

const EMPTY_EXTRA: ExtraFilter = { payMeans: '', cryptoAsset: '' };

function remarksText(
  row: MembershipAdminOrderRow,
  t: (key: MessageKey, vars?: Record<string, string>) => string,
): string {
  const parts: string[] = [];
  if (!SUCCESS_STATUSES.has(row.status) && row.failReason) {
    const key = `membershipAdmin.failReason.${row.failReason}` as MessageKey;
    const labeled = t(key);
    parts.push(labeled === key ? row.failReason : labeled);
  }
  if (row.adminNote?.trim()) {
    parts.push(row.adminNote.trim());
  }
  if (!SUCCESS_STATUSES.has(row.status) && !parts.length && row.status) {
    parts.push(t(`membershipAdmin.status.${row.status}` as MessageKey));
  }
  return parts.length ? parts.join(' · ') : '—';
}

export default function MembershipAdminPaymentsPage() {
  const t = useT();
  const [draft, setDraft] = useState<TransactionFilterState>(defaultTxFilter);
  const [applied, setApplied] = useState<TransactionFilterState>(defaultTxFilter);
  const [draftExtra, setDraftExtra] = useState<ExtraFilter>(EMPTY_EXTRA);
  const [appliedExtra, setAppliedExtra] = useState<ExtraFilter>(EMPTY_EXTRA);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<MembershipAdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await membershipAdminApi.listOrders({
        page,
        limit,
        dateField: applied.dateField === 'paidAt' ? 'paidAt' : 'createdAt',
        dateFrom: applied.dateFrom || undefined,
        dateTo: applied.dateTo || undefined,
        status: applied.status || undefined,
        payMeans: appliedExtra.payMeans || undefined,
        cryptoAsset: appliedExtra.cryptoAsset || undefined,
        searchField: applied.searchField || undefined,
        keyword: applied.keyword || undefined,
        sortDir,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [applied, appliedExtra, limit, page, sortDir, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <p className="pg-hint text-sm">{t('membershipAdmin.payments.desc')}</p>
      <TransactionFilterBar
        value={draft}
        onChange={setDraft}
        onSearch={() => {
          setApplied(draft);
          setAppliedExtra(draftExtra);
          setPage(1);
        }}
        onReset={() => {
          const next = defaultTxFilter();
          setDraft(next);
          setApplied(next);
          setDraftExtra(EMPTY_EXTRA);
          setAppliedExtra(EMPTY_EXTRA);
          setPage(1);
        }}
        onRefresh={load}
        sortDir={sortDir}
        onSortDir={(dir) => {
          setSortDir(dir);
          setPage(1);
        }}
        dateFieldOptions={[
          { value: 'createdAt', labelKey: 'membershipAdmin.filter.createdAt' },
          { value: 'paidAt', labelKey: 'membershipAdmin.filter.paidAt' },
        ]}
        searchFieldOptions={[
          { value: 'all', labelKey: 'filter.all' },
          { value: 'orderNo', labelKey: 'membershipAdmin.col.orderNo' },
          { value: 'customer', labelKey: 'membershipAdmin.col.customer' },
        ]}
        statusOptions={STATUSES.map((s) => ({
          value: s,
          labelKey: `membershipAdmin.status.${s}` as MessageKey,
        }))}
        afterKeyword={
          <>
            <label className="min-w-[8rem]">
              <span className="pg-label">{t('membershipAdmin.col.payMeans')}</span>
              <select
                className="pg-select pg-tx-field mt-0.5"
                value={draftExtra.payMeans}
                onChange={(e) =>
                  setDraftExtra((prev) => ({ ...prev, payMeans: e.target.value }))
                }
              >
                <option value="">{t('membershipAdmin.filter.payMeansAll')}</option>
                {PAY_MEANS.filter(Boolean).map((m) => (
                  <option key={m} value={m}>
                    {t(`membershipAdmin.payMeans.${m}` as MessageKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[8rem]">
              <span className="pg-label">{t('membershipAdmin.col.crypto')}</span>
              <select
                className="pg-select pg-tx-field mt-0.5"
                value={draftExtra.cryptoAsset}
                onChange={(e) =>
                  setDraftExtra((prev) => ({ ...prev, cryptoAsset: e.target.value }))
                }
              >
                <option value="">{t('membershipAdmin.filter.cryptoAll')}</option>
                {CRYPTO_ASSETS.filter(Boolean).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <p className="pg-hint">{t('hq.loading')}</p>
      ) : (
        <div className="pg-card pg-table-wrap overflow-x-auto">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('membershipAdmin.col.orderNo')}</th>
                <th>{t('membershipAdmin.col.customer')}</th>
                <th>{t('membershipAdmin.col.grade')}</th>
                <th>{t('membershipAdmin.col.amount')}</th>
                <th>{t('membershipAdmin.col.payMeans')}</th>
                <th>{t('membershipAdmin.col.crypto')}</th>
                <th>{t('membershipAdmin.col.status')}</th>
                <th>{t('membershipAdmin.col.remarks')}</th>
                <th>{t('membershipAdmin.col.period')}</th>
                <th>{t('membershipAdmin.col.createdAt')}</th>
                <th>{t('membershipAdmin.col.paidAt')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center text-sm text-slate-500">
                    {t('membershipAdmin.payments.empty')}
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const remarks = remarksText(row, t);
                  return (
                  <tr key={row.id}>
                    <td>
                      <Link
                        className="pg-link text-xs font-semibold"
                        href={`/dashboard/membership-admin/payments/${encodeURIComponent(row.orderNo)}`}
                      >
                        {row.orderNo}
                      </Link>
                    </td>
                    <td className="text-xs">
                      <div>{row.customer?.name || '—'}</div>
                      <div className="text-slate-500">{row.customer?.email || ''}</div>
                    </td>
                    <td className="text-xs font-medium">{row.displayCode}</td>
                    <td className="text-xs font-mono">
                      {row.amount} {row.currency}
                    </td>
                    <td className="text-xs">
                      {t(`membershipAdmin.payMeans.${row.payMeans}` as MessageKey)}
                    </td>
                    <td className="text-xs font-mono">
                      {row.payMeans === 'CRYPTO'
                        ? [row.cryptoAsset, row.cryptoNetwork].filter(Boolean).join(' / ') || '—'
                        : '—'}
                    </td>
                    <td className="text-xs">
                      {t(`membershipAdmin.status.${row.status}` as MessageKey)}
                    </td>
                    <td
                      className="text-xs max-w-[14rem] whitespace-normal break-words text-slate-700"
                      title={remarks}
                    >
                      {remarks}
                    </td>
                    <td className="text-xs">
                      {t('paidMembership.periodLabel', { days: String(row.periodDays) })}
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      {row.paidAt ? new Date(row.paidAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <PageSizeBar
        page={page}
        pageSize={limit}
        total={total}
        onPage={setPage}
        onPageSize={(n) => {
          if (n === 'all') {
            setLimit(Math.max(total, 1));
          } else {
            setLimit(n);
          }
          setPage(1);
        }}
      />
    </div>
  );
}
