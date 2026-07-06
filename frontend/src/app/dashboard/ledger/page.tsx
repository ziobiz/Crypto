'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, LedgerSummary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

export default function LedgerPage() {
  const { user } = useAuth();
  const t = useT();
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);

  useEffect(() => {
    api.ledger(user?.organization?.id).then(setLedger).catch(console.error);
  }, [user]);

  if (!ledger) return <p className="pg-hint">{t('common.loading')}</p>;

  const typeLabel = (type: string) =>
    type === 'USDT' ? t('ledger.type.usdt') : type === 'ESCROW' ? t('ledger.type.escrow') : type;

  return (
    <div className="pg-stack">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="pg-stat">
          <p className="pg-stat-label">{t('dashboard.totalCommission')}</p>
          <p className="pg-stat-value">{formatCurrency(ledger.totalAmount, ledger.currency)}</p>
        </div>
        <div className="pg-stat">
          <p className="pg-stat-label">{t('dashboard.commissionCount')}</p>
          <p className="pg-stat-value">{ledger.count}</p>
        </div>
      </div>
      <div className="pg-card overflow-x-auto">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('ledger.col.settledAt')}</th>
              <th>{t('ledger.col.type')}</th>
              <th>{t('ledger.col.fee')}</th>
              <th>{t('ledger.col.rate')}</th>
              <th>{t('ledger.col.ticket')}</th>
            </tr>
          </thead>
          <tbody>
            {ledger.entries.map((e) => (
              <tr key={e.id}>
                <td className="text-gray-500">{formatDate(e.settledAt)}</td>
                <td>{typeLabel(e.ticketType)}</td>
                <td>{formatCurrency(e.amount, ledger.currency)}</td>
                <td>{e.ratePercent}%</td>
                <td>{e.ticketNo}</td>
              </tr>
            ))}
            {ledger.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
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
