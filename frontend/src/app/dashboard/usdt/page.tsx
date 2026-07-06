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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('usdt.title')}</h1>
        {user?.role === 'CUSTOMER' && (
          <Link href="/dashboard/usdt/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {t('usdt.new')}
          </Link>
        )}
      </div>
      <div className="table-scroll mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.ticketNo')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.amount')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.expected')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.status')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/usdt/${ticket.id}`} className="font-medium text-blue-600 hover:underline">
                    {ticket.ticketNo}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}</td>
                <td className="px-4 py-3">{ticket.expectedUsdtAmount.toFixed(4)} USDT</td>
                <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t('usdt.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
