'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, EscrowTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

export default function EscrowListPage() {
  const { user } = useAuth();
  const t = useT();
  const [tickets, setTickets] = useState<EscrowTicket[]>([]);

  useEffect(() => {
    api.escrow.list().then(setTickets).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('escrow.title')}</h1>
        {user?.role === 'CUSTOMER' && (
          <Link href="/dashboard/escrow/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {t('escrow.new')}
          </Link>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.ticketNo')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('escrow.col.title')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.amount')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('usdt.col.status')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('escrow.col.createdAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/escrow/${ticket.id}`} className="font-medium text-blue-600 hover:underline">{ticket.ticketNo}</Link>
                </td>
                <td className="px-4 py-3">{ticket.title}</td>
                <td className="px-4 py-3">{formatCurrency(ticket.amount, ticket.currency)}</td>
                <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t('escrow.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
