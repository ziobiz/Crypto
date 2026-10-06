'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useT } from '@/context/LocaleProvider';
import { api, type TradeReceiptEmailLogDetail, type TradeReceiptEmailLogSummary, type TradeReceiptSendStatus } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { formatDate } from '@/lib/format';
import { displayTradeReceiptSubject } from '@/lib/trade-receipt-subject';
import { resolveHistoryActorName } from '@/lib/session-display';

export default function TradeReceiptsPage() {
  const t = useT();
  const { locale } = useLocale();
  const [rows, setRows] = useState<TradeReceiptEmailLogSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TradeReceiptSendStatus | ''>('');
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<TradeReceiptEmailLogDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(() => {
    api.tradeReceipts
      .list({
        page,
        pageSize: 50,
        status: status || undefined,
        q: appliedQ || undefined,
      })
      .then((r) => {
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [page, status, appliedQ, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    setError('');
    try {
      setDetail(await api.tradeReceipts.get(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoadingDetail(false);
    }
  }

  function statusLabel(s: TradeReceiptSendStatus) {
    return t(`receipt.status.${s}` as MessageKey);
  }

  function statusChip(s: TradeReceiptSendStatus) {
    const tone =
      s === 'SENT'
        ? 'pg-field-chip-emerald'
        : s === 'FAILED'
          ? 'pg-field-chip-red'
          : 'pg-field-chip-slate';
    return <span className={`pg-field-chip ${tone}`}>{statusLabel(s)}</span>;
  }

  return (
    <div className="pg-stack">
      <h1 className="pg-page-title">{t('receipt.title')}</h1>
      <p className="pg-hint">{t('receipt.hint')}</p>
      {error && <p className="pg-error">{error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        <label className="pg-field min-w-[10rem]">
          <span className="pg-label">{t('receipt.filter.status')}</span>
          <select
            className="pg-input"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as TradeReceiptSendStatus | '');
            }}
          >
            <option value="">{t('filter.all')}</option>
            <option value="SENT">{t('receipt.status.SENT')}</option>
            <option value="FAILED">{t('receipt.status.FAILED')}</option>
            <option value="SKIPPED">{t('receipt.status.SKIPPED')}</option>
          </select>
        </label>
        <label className="pg-field min-w-[14rem] flex-1">
          <span className="pg-label">{t('list.searchPlaceholder')}</span>
          <input
            className="pg-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setAppliedQ(q.trim());
              }
            }}
            placeholder={t('receipt.searchHint')}
          />
        </label>
        <button
          type="button"
          className="pg-btn pg-btn-primary"
          onClick={() => {
            setPage(1);
            setAppliedQ(q.trim());
          }}
        >
          {t('common.search')}
        </button>
      </div>

      <div className="pg-card pg-table-wrap overflow-x-auto">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('receipt.col.time')}</th>
              <th>{t('receipt.col.ticket')}</th>
              <th>{t('receipt.col.type')}</th>
              <th>{t('receipt.col.to')}</th>
              <th>{t('receipt.col.status')}</th>
              <th>{t('receipt.col.subject')}</th>
              <th>{t('common.manage')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="pg-empty">
                  {t('receipt.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-xs">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="font-mono text-xs">{row.ticketNo}</td>
                  <td className="text-xs">
                    {row.ticketType === 'TRADE_ESCROW'
                      ? t('receipt.type.escrow')
                      : t('receipt.type.usdt')}
                  </td>
                  <td className="text-xs">
                    <div>{resolveHistoryActorName(row.toName || '', t) || row.toName || '—'}</div>
                    <div className="text-[11px] text-slate-500">{row.toEmail}</div>
                  </td>
                  <td>{statusChip(row.status)}</td>
                  <td
                    className="max-w-[16rem] truncate text-left text-xs"
                    title={displayTradeReceiptSubject(row.subject, row.ticketNo, locale)}
                  >
                    {displayTradeReceiptSubject(row.subject, row.ticketNo, locale)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="pg-btn pg-btn-secondary text-[11px]"
                      disabled={loadingDetail}
                      onClick={() => openDetail(row.id)}
                    >
                      {t('receipt.view')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="pg-hint">
          {t('common.totalCount', { count: total })}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="pg-btn pg-btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('common.prev')}
          </button>
          <span className="pg-hint self-center">{page}</span>
          <button
            type="button"
            className="pg-btn pg-btn-secondary"
            disabled={page * 50 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </button>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">{t('receipt.detailTitle')}</h2>
                <p className="pg-hint text-xs">
                  {detail.ticketNo} · {statusLabel(detail.status)} · {formatDate(detail.createdAt)}
                </p>
              </div>
              <button type="button" className="pg-btn pg-btn-secondary" onClick={() => setDetail(null)}>
                {t('common.close')}
              </button>
            </div>
            <dl className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="pg-hint text-xs">{t('receipt.col.to')}</dt>
                <dd>
                  {resolveHistoryActorName(detail.toName || '', t) || detail.toName || '—'} /{' '}
                  {detail.toEmail}
                </dd>
              </div>
              <div>
                <dt className="pg-hint text-xs">{t('receipt.col.subject')}</dt>
                <dd>{displayTradeReceiptSubject(detail.subject, detail.ticketNo, locale)}</dd>
              </div>
              {detail.skipReason && (
                <div>
                  <dt className="pg-hint text-xs">{t('receipt.col.skipReason')}</dt>
                  <dd>{detail.skipReason}</dd>
                </div>
              )}
              {detail.errorMessage && (
                <div className="sm:col-span-2">
                  <dt className="pg-hint text-xs">{t('receipt.col.error')}</dt>
                  <dd className="text-red-700">{detail.errorMessage}</dd>
                </div>
              )}
            </dl>
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              {detail.bodyHtml ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-xs text-slate-800">{detail.bodyText}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
