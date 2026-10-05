'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, ApiError } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { rangeForQuick } from '@/lib/date-range';
import { toPublicInvoiceNo } from '@/lib/invoice-brand';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';

type Kind = 'live' | 'official' | 'simulator';

function titleKey(kind: Kind) {
  if (kind === 'official') return 'invoices.officialTitle' as const;
  if (kind === 'simulator') return 'invoices.simulatorTitle' as const;
  return 'invoices.liveTitle' as const;
}

function hintKey(kind: Kind) {
  if (kind === 'official') return 'invoices.officialHint' as const;
  if (kind === 'simulator') return 'invoices.simulatorHint' as const;
  return 'invoices.liveHint' as const;
}

type Row = {
  id: string;
  invoice_no: string;
  status: string;
  issued_at: string;
  currency: string;
  amount: string | number;
  ticket_no?: string | null;
  invoice_kind?: string;
};

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtMoney(amount: string | number, currency: string) {
  const n = Number(amount);
  const num = Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(amount);
  return `${num} ${currency}`;
}

function defaultInvoiceRange() {
  return rangeForQuick('week1');
}

export function InvoiceListPage({ kind }: { kind: Kind }) {
  const t = useT();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const initial = defaultInvoiceRange();
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const isMerchant =
    user?.role === 'CUSTOMER' || user?.role === 'CUSTOMER_OPERATOR';

  useEffect(() => {
    if (authLoading) return;
    if (isMerchant) router.replace('/dashboard');
  }, [authLoading, isMerchant, router]);

  async function load(range = { from, to }) {
    setLoading(true);
    setError('');
    try {
      const data = await api.invoices.list(kind, range);
      setRows(data.items || []);
    } catch (e) {
      setRows([]);
      setError(e instanceof ApiError ? e.message : t('invoices.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  function onDelete(row: Row) {
    const no = toPublicInvoiceNo(row.invoice_no);
    requestConfirm({
      title: t('invoices.deleteTitle'),
      step1: t('invoices.deleteStep1', { no }),
      step2: t('invoices.deleteStep2', { no }),
      confirmLabel: t('invoices.delete'),
      onConfirm: async () => {
        setDeletingId(row.id);
        setError('');
        try {
          await api.invoices.delete(row.id, kind);
          setRows((prev) => prev.filter((r) => r.id !== row.id));
        } catch (e) {
          setError(e instanceof ApiError ? e.message : t('invoices.deleteFailed'));
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  async function onPreview(row: Row) {
    setPreviewingId(row.id);
    setError('');
    try {
      await api.invoices.previewPdf(row.id, kind);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'POPUP_BLOCKED') {
        setError(t('invoices.previewBlocked'));
      } else {
        setError(e instanceof Error ? e.message : t('invoices.previewFailed'));
      }
    } finally {
      setPreviewingId(null);
    }
  }

  useEffect(() => {
    if (authLoading || isMerchant) return;
    const range = defaultInvoiceRange();
    setFrom(range.from);
    setTo(range.to);
    void load(range);
    // initial load for this kind only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, authLoading, isMerchant]);

  if (authLoading || isMerchant) {
    return (
      <ContentCard title={t(titleKey(kind))}>
        <p className="pg-hint">{t('common.loading')}</p>
      </ContentCard>
    );
  }

  return (
    <ContentCard title={t(titleKey(kind))}>
      {doubleConfirmDialog}
      <p className="pg-hint mb-3">{t(hintKey(kind))}</p>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-xs">
          {t('invoices.from')}
          <input
            className="pg-input"
            type="date"
            lang="en"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs">
          {t('invoices.to')}
          <input
            className="pg-input"
            type="date"
            lang="en"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button type="button" className="pg-btn pg-btn-primary" disabled={loading} onClick={() => void load()}>
          {t('invoices.search')}
        </button>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('invoices.col.issued')}</th>
              <th>{t('invoices.col.no')}</th>
              <th>{t('invoices.col.ticket')}</th>
              <th>{t('invoices.col.amount')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="pg-hint">
                  {loading ? t('common.loading') : t('invoices.empty')}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="text-xs">{fmtWhen(row.issued_at)}</td>
                <td className="font-mono text-xs">{toPublicInvoiceNo(row.invoice_no)}</td>
                <td className="text-xs">{row.ticket_no && !row.ticket_no.startsWith('SIM-') ? row.ticket_no : '—'}</td>
                <td className="text-xs">{fmtMoney(row.amount, row.currency)}</td>
                <td className="whitespace-nowrap">
                  <button
                    type="button"
                    className="pg-btn"
                    disabled={previewingId === row.id}
                    onClick={() => void onPreview(row)}
                  >
                    {previewingId === row.id ? t('common.loading') : t('invoices.preview')}
                  </button>{' '}
                  <button
                    type="button"
                    className="pg-btn"
                    onClick={() =>
                      void api.invoices
                        .downloadPdf(row.id, toPublicInvoiceNo(row.invoice_no), kind)
                        .catch((e) => setError(e instanceof Error ? e.message : t('invoices.loadFailed')))
                    }
                  >
                    {t('invoices.pdf')}
                  </button>{' '}
                  <button
                    type="button"
                    className="pg-btn pg-btn-danger"
                    disabled={deletingId === row.id}
                    onClick={() => onDelete(row)}
                  >
                    {deletingId === row.id ? t('common.loading') : t('invoices.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentCard>
  );
}
