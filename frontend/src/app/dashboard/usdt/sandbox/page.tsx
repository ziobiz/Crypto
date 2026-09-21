'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, ApiError, UsdtTicket } from '@/lib/api';
import { StatusBadge, buildUsdtStatusContext } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { DualTimezoneDate } from '@/components/DualTimezoneDate';
import { useReferenceTimeState } from '@/components/ReferenceClocks';

function isOperator(role?: string) {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ORGANIZER' ||
    role === 'SETTLEMENT_ADMIN' ||
    role === 'ORG_STAFF'
  );
}

export default function UsdtSandboxInvoicePage() {
  const { user } = useAuth();
  const t = useT();
  const admin = isOperator(user?.role);
  const { country, baseTimezone, serviceTimezone } = useReferenceTimeState();
  const [tickets, setTickets] = useState<UsdtTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txById, setTxById] = useState<Record<string, string>>({});
  const [usdtById, setUsdtById] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api.usdt.list().then(setTickets).catch(console.error);
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  const ready = useMemo(
    () => tickets.filter((row) => row.status === 'TRANSFER_IN_PROGRESS'),
    [tickets],
  );
  const sandboxDone = useMemo(
    () =>
      tickets.filter(
        (row) =>
          row.status === 'COMPLETED' &&
          (row.sandboxInvoice || row.adminNote?.includes('[SANDBOX]')),
      ),
    [tickets],
  );

  async function completeSandbox(ticket: UsdtTicket) {
    const txId = (txById[ticket.id] || '').trim();
    if (!txId) {
      setError(t('usdt.sandbox.needTxid'));
      return;
    }
    const raw = (usdtById[ticket.id] || '').trim();
    const actualUsdtAmount = raw ? Number(raw) : undefined;
    if (actualUsdtAmount != null && !Number.isFinite(actualUsdtAmount)) {
      setError(t('usdt.sandbox.invalidUsdt'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.usdt.updateStatus(ticket.id, {
        status: 'COMPLETED',
        usdtTxId: txId,
        actualUsdtAmount,
        amountConfirmAcknowledged: true,
        sandboxInvoice: true,
        adminNote: '[SANDBOX]',
      });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!admin) {
    return (
      <div className="pg-card">
        <div className="pg-card-body">
          <p className="pg-hint">{t('usdt.sandbox.operatorsOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pg-card">
        <div className="pg-card-head">{t('usdt.sandbox.title')}</div>
        <div className="pg-card-body space-y-2">
          <p className="text-sm">{t('usdt.sandbox.intro')}</p>
          <p className="pg-hint text-xs">{t('usdt.sandbox.introHint')}</p>
          <p className="text-xs">
            <Link href="/dashboard/usdt" className="pg-link">
              {t('usdt.sandbox.backLive')}
            </Link>
            {' · '}
            <a
              href="https://invoice.icopay.net/admin/"
              target="_blank"
              rel="noreferrer"
              className="pg-link"
            >
              {t('usdt.sandbox.openInvoice')}
            </a>
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('usdt.sandbox.readyTitle')}</div>
        <div className="pg-card-body overflow-x-auto">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('usdt.col.ticketNo')}</th>
                <th>{t('usdt.col.customer')}</th>
                <th>{t('usdt.col.amount')}</th>
                <th>{t('usdt.col.status')}</th>
                <th>TXID</th>
                <th>{t('usdt.detail.actualUsdt')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ready.length === 0 && (
                <tr>
                  <td colSpan={7} className="pg-hint">
                    {t('usdt.sandbox.readyEmpty')}
                  </td>
                </tr>
              )}
              {ready.map((row) => {
                const usdtCtx = buildUsdtStatusContext(row);
                return (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/dashboard/usdt/${row.id}`} className="pg-link font-mono text-xs">
                        {row.ticketNo}
                      </Link>
                    </td>
                    <td className="text-xs">
                      {row.customer?.user?.name || '—'}
                      <div className="pg-hint">{row.customer?.user?.email}</div>
                    </td>
                    <td className="text-xs">
                      {formatCurrency(row.fiatAmount, row.fiatCurrency)}
                    </td>
                    <td>
                      <StatusBadge status={row.status} kind="usdt" usdtContext={usdtCtx} />
                    </td>
                    <td>
                      <input
                        className="pg-input"
                        value={txById[row.id] || ''}
                        onChange={(e) =>
                          setTxById((m) => ({ ...m, [row.id]: e.target.value }))
                        }
                        placeholder="USDT TXID"
                      />
                    </td>
                    <td>
                      <input
                        className="pg-input"
                        value={usdtById[row.id] || ''}
                        onChange={(e) =>
                          setUsdtById((m) => ({ ...m, [row.id]: e.target.value }))
                        }
                        placeholder={t('usdt.detail.actualUsdt')}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pg-btn pg-btn-primary whitespace-nowrap"
                        disabled={loading}
                        onClick={() => completeSandbox(row)}
                      >
                        {t('usdt.sandbox.complete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('usdt.sandbox.doneTitle')}</div>
        <div className="pg-card-body overflow-x-auto">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('usdt.col.ticketNo')}</th>
                <th>{t('usdt.col.amount')}</th>
                <th>{t('usdt.col.status')}</th>
                <th>{t('usdt.col.date')}</th>
              </tr>
            </thead>
            <tbody>
              {sandboxDone.length === 0 && (
                <tr>
                  <td colSpan={4} className="pg-hint">
                    {t('usdt.sandbox.doneEmpty')}
                  </td>
                </tr>
              )}
              {sandboxDone.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/dashboard/usdt/${row.id}`} className="pg-link font-mono text-xs">
                      {row.ticketNo}
                    </Link>
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      SANDBOX
                    </span>
                  </td>
                  <td className="text-xs">{formatCurrency(row.fiatAmount, row.fiatCurrency)}</td>
                  <td>
                    <StatusBadge
                      status={row.status}
                      kind="usdt"
                      usdtContext={buildUsdtStatusContext(row)}
                    />
                  </td>
                  <td className="text-xs">
                    <DualTimezoneDate
                      value={row.createdAt}
                      country={country}
                      baseTimezone={baseTimezone}
                      serviceTimezone={serviceTimezone}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
