'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, LedgerSummary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

const CURRENCY_ORDER = ['USDT', 'KRW', 'USD', 'JPY', 'CNY', 'THB'];

function sortCurrencies(currencies: string[]): string[] {
  return [...currencies].sort((a, b) => {
    const ai = CURRENCY_ORDER.indexOf(a);
    const bi = CURRENCY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function LedgerPage() {
  const { user } = useAuth();
  const t = useT();
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);

  useEffect(() => {
    api.ledger(user?.organization?.id).then(setLedger).catch(console.error);
  }, [user]);

  if (!ledger) return <p className="pg-hint">{t('common.loading')}</p>;

  const typeLabel = (type: string) =>
    type === 'USDT_PURCHASE' || type === 'USDT'
      ? t('ledger.type.usdt')
      : type === 'TRADE_ESCROW' || type === 'ESCROW'
        ? t('ledger.type.escrow')
        : type;

  const totalsByCurrency =
    ledger.totalsByCurrency ??
    (ledger.totalAmount > 0 ? { [ledger.currency]: ledger.totalAmount } : {});
  const byTicketType = ledger.byTicketType ?? {};
  const currencies = sortCurrencies(Object.keys(totalsByCurrency));
  const ticketTypes = Object.keys(byTicketType);

  return (
    <div className="pg-stack">
      <div>
        <p className="mb-2 text-[13px] font-bold text-gray-700">{t('ledger.byCurrency')}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currencies.length === 0 ? (
            <div className="pg-stat">
              <p className="pg-stat-label">{t('ledger.currency.usdt')}</p>
              <p className="pg-stat-value">{formatCurrency(0, 'USDT')}</p>
            </div>
          ) : (
            currencies.map((cur) => (
              <div key={cur} className="pg-stat">
                <p className="pg-stat-label">{t('ledger.currencyTotal', { currency: cur })}</p>
                <p className="pg-stat-value">{formatCurrency(totalsByCurrency[cur] ?? 0, cur)}</p>
              </div>
            ))
          )}
          <div className="pg-stat">
            <p className="pg-stat-label">{t('dashboard.commissionCount')}</p>
            <p className="pg-stat-value">{ledger.count}</p>
          </div>
        </div>
      </div>

      {ticketTypes.length > 0 && (
        <div className="pg-card pg-table-wrap">
          <p className="border-b border-gray-200 px-3 py-2 text-[13px] font-bold text-gray-700">
            {t('ledger.byType')}
          </p>
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('ledger.col.type')}</th>
                {currencies.map((cur) => (
                  <th key={cur}>{cur}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((tt) => (
                <tr key={tt}>
                  <td>{typeLabel(tt)}</td>
                  {currencies.map((cur) => (
                    <td key={cur}>
                      {byTicketType[tt]?.[cur]
                        ? formatCurrency(byTicketType[tt]![cur]!, cur)
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('ledger.col.settledAt')}</th>
              <th>{t('ledger.col.type')}</th>
              <th>{t('ledger.col.currency')}</th>
              <th>{t('ledger.col.fee')}</th>
              <th>{t('ledger.col.rate')}</th>
              <th>{t('ledger.col.ticket')}</th>
            </tr>
          </thead>
          <tbody>
            {ledger.entries.map((e) => (
              <tr key={e.id}>
                <td className="pg-muted">{formatDate(e.settledAt)}</td>
                <td>{typeLabel(e.ticketType)}</td>
                <td>{e.currency}</td>
                <td>{formatCurrency(e.amount, e.currency)}</td>
                <td>{e.ratePercent}%</td>
                <td>{e.ticketNo}</td>
              </tr>
            ))}
            {ledger.entries.length === 0 && (
              <tr>
                <td colSpan={6} className="pg-empty">
                  {t('ledger.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
