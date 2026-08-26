'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtTicket } from '@/lib/api';
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

export default function UsdtListPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const kycOk = isKycApproved(user);
  const [tickets, setTickets] = useState<UsdtTicket[]>([]);

  useEffect(() => {
    api.usdt.list().then(setTickets).catch(console.error);
  }, []);

  const newBtn =
    user?.role === 'CUSTOMER' ? (
      kycOk ? (
        <Link href="/dashboard/usdt/new" className="pg-btn pg-btn-primary w-full sm:w-auto">
          {t('usdt.new')}
        </Link>
      ) : (
        <span className="pg-btn pg-btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto" title={t('kyc.requiredToTrade')}>
          {t('usdt.new')}
        </span>
      )
    ) : null;

  return (
    <div className="pg-stack">
      <div className="flex items-center justify-end">{newBtn}</div>

      <MobileStackList>
        {tickets.map((ticket) => (
          <MobileStackCard key={ticket.id} href={`/dashboard/usdt/${ticket.id}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="pg-link break-all text-left text-sm font-semibold">{ticket.ticketNo}</span>
              <StatusBadge status={ticket.status} kind="usdt" />
            </div>
            <MobileStackFields>
              <MobileStackField label={t('usdt.col.amount')}>
                {formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}
              </MobileStackField>
              <MobileStackField label={t('usdt.col.expected')}>
                {ticket.expectedUsdtAmount.toFixed(4)} USDT
              </MobileStackField>
              <MobileStackField label={t('usdt.col.expectedComplete')}>
                {ticket.expectedCompleteAt ? formatDate(ticket.expectedCompleteAt) : '—'}
              </MobileStackField>
              <MobileStackField label={t('usdt.col.date')}>{formatDate(ticket.createdAt)}</MobileStackField>
            </MobileStackFields>
          </MobileStackCard>
        ))}
        {tickets.length === 0 && <MobileStackEmpty>{t('usdt.empty')}</MobileStackEmpty>}
      </MobileStackList>

      <div className="pg-card pg-table-wrap hidden md:block">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('usdt.col.ticketNo')}</th>
              <th>{t('usdt.col.amount')}</th>
              <th>{t('usdt.col.expected')}</th>
              <th>{t('usdt.col.status')}</th>
              <th>{t('usdt.col.expectedComplete')}</th>
              <th>{t('usdt.col.date')}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                {...detailRowProps(t('table.dblclickHint'), () => router.push(`/dashboard/usdt/${ticket.id}`))}
              >
                <td>
                  <Link href={`/dashboard/usdt/${ticket.id}`} className="pg-link">
                    {ticket.ticketNo}
                  </Link>
                </td>
                <td>{formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}</td>
                <td>{ticket.expectedUsdtAmount.toFixed(4)} USDT</td>
                <td>
                  <StatusBadge status={ticket.status} kind="usdt" />
                </td>
                <td className="pg-muted">
                  {ticket.expectedCompleteAt ? formatDate(ticket.expectedCompleteAt) : '—'}
                </td>
                <td className="pg-muted">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="pg-empty">
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
