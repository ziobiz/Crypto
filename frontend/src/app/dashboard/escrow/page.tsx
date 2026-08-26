'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, EscrowTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { isKycApproved } from '@/lib/kyc';
import { detailRowProps } from '@/lib/table-row-detail';
import {
  MobileStackCard,
  MobileStackEmpty,
  MobileStackField,
  MobileStackFields,
  MobileStackList,
} from '@/components/layout/MobileStackList';

export default function EscrowListPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const kycOk = isKycApproved(user);
  const [tickets, setTickets] = useState<EscrowTicket[]>([]);

  useEffect(() => {
    api.escrow.list().then(setTickets).catch(console.error);
  }, []);

  const newBtn =
    user?.role === 'CUSTOMER' ? (
      kycOk ? (
        <Link href="/dashboard/escrow/new" className="pg-btn pg-btn-primary w-full sm:w-auto">
          {t('escrow.new')}
        </Link>
      ) : (
        <span className="pg-btn pg-btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto" title={t('kyc.requiredToTrade')}>
          {t('escrow.new')}
        </span>
      )
    ) : null;

  return (
    <div className="pg-stack">
      <div className="flex items-center justify-end">{newBtn}</div>

      <MobileStackList>
        {tickets.map((ticket) => (
          <MobileStackCard key={ticket.id} href={`/dashboard/escrow/${ticket.id}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="pg-link break-all text-left text-sm font-semibold">{ticket.ticketNo}</span>
              <StatusBadge status={ticket.status} kind="escrow" />
            </div>
            <p className="mt-1 text-left text-sm font-medium">{ticket.title}</p>
            <MobileStackFields>
              <MobileStackField label={t('escrow.col.buyer')}>{ticket.buyer.name}</MobileStackField>
              <MobileStackField label={t('escrow.col.seller')}>{ticket.seller.name}</MobileStackField>
              <MobileStackField label={t('usdt.col.amount')}>
                {formatCurrency(ticket.amount, ticket.currency)}
              </MobileStackField>
              <MobileStackField label={t('escrow.col.tier')}>
                {t(`escrow.tier.${ticket.tradeTier}` as 'escrow.tier.PREMIUM')}
              </MobileStackField>
              <MobileStackField label={t('escrow.col.createdAt')}>{formatDate(ticket.createdAt)}</MobileStackField>
              <MobileStackField label={t('usdt.col.expectedComplete')}>
                {ticket.status === 'ESCROW_COMPLETED' && ticket.expectedCompleteAt
                  ? formatDate(ticket.expectedCompleteAt)
                  : '—'}
              </MobileStackField>
            </MobileStackFields>
          </MobileStackCard>
        ))}
        {tickets.length === 0 && <MobileStackEmpty>{t('escrow.empty')}</MobileStackEmpty>}
      </MobileStackList>

      <div className="pg-card pg-table-wrap hidden md:block">
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
              <th>{t('usdt.col.expectedComplete')}</th>
              <th>{t('escrow.col.createdAt')}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                {...detailRowProps(t('table.dblclickHint'), () => router.push(`/dashboard/escrow/${ticket.id}`))}
              >
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
                  <StatusBadge status={ticket.status} kind="escrow" />
                </td>
                <td className="pg-muted">
                  {ticket.status === 'ESCROW_COMPLETED' && ticket.expectedCompleteAt
                    ? formatDate(ticket.expectedCompleteAt)
                    : '—'}
                </td>
                <td className="pg-muted">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={9} className="pg-empty">
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
