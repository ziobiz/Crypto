'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

export default function UsdtListPage() {
  const { user } = useAuth();
  const t = useT();
  const [tickets, setTickets] = useState<UsdtTicket[]>([]);

  useEffect(() => {
    api.usdt.list().then(setTickets).catch(console.error);
  }, []);

  return (
    <div className="pg-stack">
      <div className="flex items-center justify-end">
        {user?.role === 'CUSTOMER' && (
          <Link href="/dashboard/usdt/new" className="pg-btn pg-btn-primary">
            {t('usdt.new')}
          </Link>
        )}
      </div>
      <div className="pg-card overflow-x-auto">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('usdt.col.ticketNo')}</th>
              <th>{t('usdt.col.amount')}</th>
              <th>{t('usdt.col.expected')}</th>
              <th>{t('usdt.col.status')}</th>
              <th>{t('usdt.col.date')}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link href={`/dashboard/usdt/${ticket.id}`} className="font-medium text-blue-600 hover:underline">
                    {ticket.ticketNo}
                  </Link>
                </td>
                <td>{formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}</td>
                <td>{ticket.expectedUsdtAmount.toFixed(4)} USDT</td>
                <td>
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="text-gray-500">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  {t('usdt.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
