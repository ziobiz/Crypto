'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, type ProfitAnalysisRow } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { PageSizeBar } from '@/components/PageSizeBar';
import { SensitiveOtpGate, useSensitiveOtp } from '@/components/SensitiveOtpGate';
import {
  defaultTxFilter,
  TransactionFilterBar,
  type TransactionFilterState,
} from '@/components/TransactionFilterBar';
import { inYmdRange } from '@/lib/date-range';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/i18n/messages';

const PROFIT_PAGE_SIZES = [100, 200, 300, 400, 500, 1000] as const;

const PROFIT_STATUSES = [
  'QUOTE_PENDING',
  'QUOTE_CONFIRMED',
  'APPLICATION_COMPLETED',
  'CARD_PAYMENT_PENDING',
  'DEPOSIT_PROOF_PENDING',
  'ADMIN_REVIEWING',
  'TRANSFER_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

type QualFilter = 'ALL' | 'INDIVIDUAL' | 'CORPORATE' | 'SYNTH';

function profitDefaultFilter(): TransactionFilterState {
  return { ...defaultTxFilter(), dateField: 'all' };
}

function isSynth(row: ProfitAnalysisRow) {
  return row.tradeLane === 'SYNTH';
}

function canAccess(role?: string) {
  return role === 'SUPER_ADMIN' || role === 'ORGANIZER';
}

export default function ProfitAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !canAccess(user.role)) router.replace('/dashboard');
  }, [user, router]);

  return (
    <SensitiveOtpGate>
      <ProfitAnalysisInner />
    </SensitiveOtpGate>
  );
}

function ProfitAnalysisInner() {
  const t = useT();
  const { runWithOtp } = useSensitiveOtp();
  const [rows, setRows] = useState<ProfitAnalysisRow[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [draftAmount, setDraftAmount] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(100);
  const [filterDraft, setFilterDraft] = useState<TransactionFilterState>(profitDefaultFilter);
  const [applied, setApplied] = useState<TransactionFilterState>(profitDefaultFilter);
  const [qual, setQual] = useState<QualFilter>('ALL');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(() => {
    setLoadError(false);
    return runWithOtp(() => api.costAnalysis.profitList())
      .then((res) => {
        if (res.cancelled) return;
        setRows(Array.isArray(res.value) ? res.value : []);
      })
      .catch(() => {
        setRows([]);
        setLoadError(true);
      });
  }, [runWithOtp]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyRow(updated: ProfitAnalysisRow | undefined) {
    if (!updated) return;
    setRows((prev) => prev.map((r) => (r.ticketId === updated.ticketId ? updated : r)));
    setNoteDraft((d) => ({ ...d, [updated.ticketId]: updated.profitNote ?? '' }));
  }

  async function saveRow(ticketId: string) {
    const note = (noteDraft[ticketId] ?? rows.find((r) => r.ticketId === ticketId)?.profitNote ?? '').trim();
    const updatedNote = await api.costAnalysis.setNote(ticketId, note || null);
    applyRow(updatedNote);
    const amount = Number(draftAmount[ticketId]);
    if (Number.isFinite(amount) && amount >= 0) {
      const updatedBroker = await api.costAnalysis.setBroker(ticketId, amount);
      applyRow(updatedBroker);
    }
    setEditing((e) => ({ ...e, [ticketId]: false }));
  }

  async function deleteNote(ticketId: string) {
    if (!window.confirm(t('profit.noteDeleteConfirm'))) return;
    const updated = await api.costAnalysis.setNote(ticketId, null);
    applyRow(updated);
    setEditing((e) => ({ ...e, [ticketId]: false }));
  }

  const filtered = useMemo(() => {
    const q = applied.keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (qual === 'SYNTH' && !isSynth(row)) return false;
      if (qual === 'INDIVIDUAL' && (isSynth(row) || row.customerType === 'CORPORATE')) return false;
      if (qual === 'CORPORATE' && (isSynth(row) || row.customerType !== 'CORPORATE')) return false;
      if (applied.status && row.status !== applied.status) return false;
      if (applied.dateField !== 'all' && (applied.dateFrom || applied.dateTo)) {
        if (!inYmdRange(row.createdAt, applied.dateFrom, applied.dateTo)) return false;
      }
      if (!q) return true;
      const hay = [row.ticketNo, row.customerName, row.customerEmail].join(' ').toLowerCase();
      if (applied.searchField === 'ticketNo') return row.ticketNo.toLowerCase().includes(q);
      if (applied.searchField === 'customer') {
        return `${row.customerName} ${row.customerEmail}`.toLowerCase().includes(q);
      }
      return hay.includes(q);
    });
  }, [rows, applied, qual]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const diff = a.createdAt.localeCompare(b.createdAt);
      return sortDir === 'asc' ? diff : -diff;
    });
    return copy;
  }, [filtered, sortDir]);

  const pageRows =
    pageSize === 'all'
      ? sorted
      : sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <ContentCard title={t('nav.profitAnalysis')}>
          <p className="pg-hint mb-3">{t('profit.hint')}</p>
          {loadError ? <p className="pg-callout pg-callout-error mb-3 text-sm">{t('common.loadFailed')}</p> : null}
          <TransactionFilterBar
            value={filterDraft}
            onChange={setFilterDraft}
            onSearch={() => {
              setApplied(filterDraft);
              setPage(1);
            }}
            onReset={() => {
              const next = profitDefaultFilter();
              setFilterDraft(next);
              setApplied(next);
              setQual('ALL');
              setPage(1);
            }}
            onRefresh={() => void load()}
            sortDir={sortDir}
            onSortDir={(dir) => {
              setSortDir(dir);
              setPage(1);
            }}
            dateFieldOptions={[
              { value: 'all', labelKey: 'filter.date.all' },
              { value: 'createdAt', labelKey: 'filter.date.applied' },
            ]}
            searchFieldOptions={[
              { value: 'all', labelKey: 'filter.all' },
              { value: 'ticketNo', labelKey: 'usdt.col.ticketNo' },
              { value: 'customer', labelKey: 'usdt.col.customer' },
            ]}
            statusOptions={PROFIT_STATUSES.map((s) => ({
              value: s,
              labelKey: `status.${s}` as MessageKey,
            }))}
            qualification={{
              labelKey: 'usdt.col.qualification',
              value: qual,
              onChange: (next) => {
                setQual(next as QualFilter);
                setPage(1);
              },
              options: [
                { value: 'ALL', label: t('filter.all') },
                { value: 'INDIVIDUAL', label: t('usdt.qual.individual') },
                { value: 'CORPORATE', label: t('usdt.qual.corporate') },
                { value: 'SYNTH', label: t('usdt.qual.synth') },
              ],
            }}
          />
          <div className="pg-card pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('usdt.col.ticketNo')}</th>
                  <th>{t('simLogs.customer')}</th>
                  <th>{t('simLogs.date')}</th>
                  <th>{t('profit.expected')}</th>
                  <th>{t('profit.actual')}</th>
                  <th>{t('profit.broker')}</th>
                  <th>{t('profit.source')}</th>
                  <th>{t('profit.result')}</th>
                  <th>{t('profit.note')}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={9} className="pg-hint">{t('profit.empty')}</td></tr>
                ) : (
                  pageRows.map((row) => {
                    const open = editing[row.ticketId] === true;
                    return (
                    <tr key={row.ticketId}>
                      <td>
                        <Link href={`/dashboard/usdt/${row.ticketId}`} className="pg-link">{row.ticketNo}</Link>
                      </td>
                      <td>
                        {row.customerName}
                        <div className="text-xs text-slate-500">{row.customerEmail}</div>
                      </td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td className="font-semibold text-red-600">{row.expectedUsdtAmount.toFixed(4)}</td>
                      <td className="font-mono text-sm">
                        {row.actualUsdtAmount != null ? row.actualUsdtAmount.toFixed(4) : '—'}
                      </td>
                      <td>
                        <input
                          className="pg-input w-28"
                          readOnly={!open}
                          value={draftAmount[row.ticketId] ?? (row.brokerUsdtAmount != null ? String(row.brokerUsdtAmount) : '')}
                          onChange={(e) => setDraftAmount((d) => ({ ...d, [row.ticketId]: e.target.value }))}
                        />
                      </td>
                      <td className="text-xs text-slate-600">
                        {row.profitSource === 'manual'
                          ? t('profit.source.manual')
                          : row.profitSource === 'auto'
                            ? t('profit.source.auto')
                            : '—'}
                      </td>
                      <td className={row.profitUsdt == null ? '' : row.profitUsdt >= 0 ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                        {row.profitUsdt == null ? '—' : row.profitUsdt.toFixed(4)}
                      </td>
                      <td>
                        <div className="flex flex-col items-stretch gap-1">
                          <input
                            className="pg-input w-40"
                            readOnly={!open}
                            value={noteDraft[row.ticketId] ?? row.profitNote ?? ''}
                            onChange={(e) => setNoteDraft((d) => ({ ...d, [row.ticketId]: e.target.value }))}
                          />
                          <div className="flex flex-wrap justify-center gap-1">
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary"
                              onClick={() => setEditing((e) => ({ ...e, [row.ticketId]: true }))}
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary"
                              onClick={() => deleteNote(row.ticketId)}
                            >
                              {t('common.delete')}
                            </button>
                            <button
                              type="button"
                              className="pg-btn pg-btn-primary"
                              onClick={() => saveRow(row.ticketId)}
                            >
                              {t('common.save')}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PageSizeBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            sizes={PROFIT_PAGE_SIZES}
            onPageSize={setPageSize}
            onPage={setPage}
          />
        </ContentCard>
  );
}
