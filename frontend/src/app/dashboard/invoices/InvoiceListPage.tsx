'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { api, ApiError } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';

type Kind = 'live' | 'simulator';

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

export function InvoiceListPage({ kind }: { kind: Kind }) {
  const t = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    void load({ from: '', to: '' });
    // initial load for this kind only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <ContentCard title={kind === 'live' ? t('invoices.liveTitle') : t('invoices.simulatorTitle')}>
      <p className="pg-hint mb-3">
        {kind === 'live' ? t('invoices.liveHint') : t('invoices.simulatorHint')}
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-xs">
          {t('invoices.from')}
          <input className="pg-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs">
          {t('invoices.to')}
          <input className="pg-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
                <td className="font-mono text-xs">{row.invoice_no}</td>
                <td className="text-xs">{row.ticket_no && !row.ticket_no.startsWith('SIM-') ? row.ticket_no : '—'}</td>
                <td className="text-xs">{fmtMoney(row.amount, row.currency)}</td>
                <td>
                  <button
                    type="button"
                    className="pg-btn"
                    onClick={() => void api.invoices.downloadPdf(row.id, row.invoice_no).catch((e) => setError(e instanceof Error ? e.message : t('invoices.loadFailed')))}
                  >
                    {t('invoices.pdf')}
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
