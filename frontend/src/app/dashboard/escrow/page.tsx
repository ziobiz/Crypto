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
    <div className="pg-stack">
      <div className="flex items-center justify-end">
        {user?.role === 'CUSTOMER' && (
          <Link href="/dashboard/escrow/new" className="pg-btn pg-btn-primary">
            {t('escrow.new')}
          </Link>
        )}
      </div>
      <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('usdt.col.ticketNo')}</th>
              <th>{t('escrow.col.title')}</th>
              <th>{t('escrow.col.buyer')}</th>
              <th>{t('escrow.col.seller')}</th>
              <th>{t('usdt.col.amount')}</th>
              <th>{t('escrow.col.tier')}</th>
              <th>{t('usdt.col.status')}</th>
              <th>{t('escrow.col.createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Link href={`/dashboard/escrow/${ticket.id}`} className="pg-link">
                    {ticket.ticketNo}
                  </Link>
                </td>
                <td>{ticket.title}</td>
                <td className="pg-muted">{ticket.buyer.name}</td>
                <td className="pg-muted">{ticket.seller.name}</td>
                <td>{formatCurrency(ticket.amount, ticket.currency)}</td>
                <td>{t(`escrow.tier.${ticket.tradeTier}` as 'escrow.tier.PREMIUM')}</td>
                <td>
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="pg-muted">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="pg-empty">
                  {t('escrow.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
