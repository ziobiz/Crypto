'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, EscrowTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { PageSizeBar } from '@/components/PageSizeBar';
import { SortableTh } from '@/components/ListTableControls';
import {
  EMPTY_TX_FILTER,
  AggregateSummaryBar,
  TransactionFilterBar,
  type TransactionFilterState,
} from '@/components/TransactionFilterBar';
import { ReferenceClocks, useReferenceTimeState } from '@/components/ReferenceClocks';
import { DualTimezoneDate, formatDualTimezonePlain } from '@/components/DualTimezoneDate';
import type { ServiceCountryKey } from '@/lib/reference-time';
import { compareValues, type SortDir } from '@/lib/client-table';
import { inYmdRange } from '@/lib/date-range';
import { downloadExcelCsv, formatPerson } from '@/lib/excel-csv';
import { summarizeEscrowTickets } from '@/lib/ledger-summary';
import { formatCurrency } from '@/lib/format';
import { isKycApproved } from '@/lib/kyc';
import { detailRowProps } from '@/lib/table-row-detail';
import type { MessageKey } from '@/i18n/messages';
import {
  MobileStackCard,
  MobileStackEmpty,
  MobileStackField,
  MobileStackFields,
  MobileStackList,
} from '@/components/layout/MobileStackList';

const ESCROW_STATUSES = [
  'ESCROW_CREATED',
  'CONTRACT_CONFIRMED',
  'BUYER_DEPOSIT_PROOF',
  'ADMIN_DEPOSIT_CONFIRMED',
  'SELLER_FULFILLMENT_PROOF',
  'BUYER_FINAL_APPROVAL',
  'PAYOUT_SCHEDULED',
  'ESCROW_COMPLETED',
  'VOIDED',
  'CANCELLED',
  'DISPUTED',
] as const;

function ticketDate(row: EscrowTicket, field: string): string | null {
  if (field === 'expectedCompleteAt') return row.expectedCompleteAt ?? null;
  return row.createdAt;
}

function matchKeyword(row: EscrowTicket, field: string, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const hay: Record<string, Array<string | number | null | undefined>> = {
    all: [
      row.ticketNo,
      row.title,
      row.currency,
      row.status,
      row.tradeTier,
      row.buyer?.name,
      row.buyer?.email,
      row.seller?.name,
      row.seller?.email,
      String(row.amount),
    ],
    ticketNo: [row.ticketNo],
    title: [row.title],
    buyer: [row.buyer?.name, row.buyer?.email],
    seller: [row.seller?.name, row.seller?.email],
    currency: [row.currency],
  };
  const list = hay[field] ?? hay.all;
  return list.some((v) => String(v ?? '').toLowerCase().includes(q));
}

export default function EscrowListPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const kycOk = isKycApproved(user);
  const { country, setServiceCountry, baseTimezone, serviceTimezone } = useReferenceTimeState();
  const [tickets, setTickets] = useState<EscrowTicket[]>([]);
  const [draft, setDraft] = useState<TransactionFilterState>(EMPTY_TX_FILTER);
  const [applied, setApplied] = useState<TransactionFilterState>(EMPTY_TX_FILTER);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  const load = useCallback(() => {
    api.escrow.list().then(setTickets).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    return tickets.filter((row) => {
      if (applied.status && row.status !== applied.status) return false;
      if (applied.dateFrom || applied.dateTo) {
        if (!inYmdRange(ticketDate(row, applied.dateField), applied.dateFrom, applied.dateTo)) {
          return false;
        }
      }
      return matchKeyword(row, applied.searchField, applied.keyword);
    });
  }, [tickets, applied]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const get = (row: EscrowTicket): unknown => {
        switch (sortKey) {
          case 'ticketNo':
            return row.ticketNo;
          case 'title':
            return row.title;
          case 'buyer':
            return row.buyer?.name ?? '';
          case 'seller':
            return row.seller?.name ?? '';
          case 'amount':
            return row.amount;
          case 'currency':
            return row.currency;
          case 'tier':
            return row.tradeTier;
          case 'attachments':
            return row.attachments?.length ?? 0;
          case 'status':
            return row.status;
          case 'expectedComplete':
            return row.expectedCompleteAt ?? '';
          case 'createdAt':
          default:
            return row.createdAt;
        }
      };
      return compareValues(get(a), get(b), sortDir);
    });
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const pageRows =
    pageSize === 'all'
      ? sorted
      : sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const aggregate = useMemo(() => summarizeEscrowTickets(filtered), [filtered]);

  function exportExcel() {
    downloadExcelCsv(
      `trade-escrow-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t('usdt.col.ticketNo'),
        t('escrow.col.title'),
        t('escrow.col.buyer'),
        t('escrow.col.seller'),
        t('usdt.col.currency'),
        t('usdt.col.amount'),
        t('escrow.col.tier'),
        t('usdt.col.attachments'),
        t('usdt.col.status'),
        t('usdt.col.expectedComplete'),
        t('escrow.col.createdAt'),
      ],
      sorted.map((row) => [
        row.ticketNo,
        row.title,
        formatPerson(row.buyer?.name, row.buyer?.email),
        formatPerson(row.seller?.name, row.seller?.email),
        row.currency,
        row.amount,
        row.tradeTier,
        row.attachments?.length ?? 0,
        row.status,
        row.expectedCompleteAt
          ? formatDualTimezonePlain(row.expectedCompleteAt, baseTimezone, serviceTimezone, country)
          : '',
        formatDualTimezonePlain(row.createdAt, baseTimezone, serviceTimezone, country),
      ]),
    );
  }

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ReferenceClocks compact baseTimezone={baseTimezone} serviceTimezone={serviceTimezone} country={country} />
        <div className="flex flex-wrap items-center justify-end gap-2">{newBtn}</div>
      </div>

      <TransactionFilterBar
        value={draft}
        onChange={setDraft}
        onSearch={() => {
          setApplied(draft);
          setPage(1);
        }}
        onReset={() => {
          setDraft(EMPTY_TX_FILTER);
          setApplied(EMPTY_TX_FILTER);
          setPage(1);
        }}
        onRefresh={load}
        onExcel={exportExcel}
        sortDir={sortDir}
        onSortDir={(dir) => {
          setSortDir(dir);
          setSortKey('createdAt');
          setPage(1);
        }}
        hqCountry={country}
        onHqCountryChange={(c) => setServiceCountry(c as ServiceCountryKey)}
        dateFieldOptions={[
          { value: 'createdAt', labelKey: 'filter.date.applied' },
          { value: 'expectedCompleteAt', labelKey: 'filter.date.expected' },
        ]}
        searchFieldOptions={[
          { value: 'all', labelKey: 'filter.all' },
          { value: 'ticketNo', labelKey: 'usdt.col.ticketNo' },
          { value: 'title', labelKey: 'escrow.col.title' },
          { value: 'buyer', labelKey: 'escrow.col.buyer' },
          { value: 'seller', labelKey: 'escrow.col.seller' },
          { value: 'currency', labelKey: 'usdt.col.currency' },
        ]}
        statusOptions={ESCROW_STATUSES.map((s) => ({
          value: s,
          labelKey: `status.${s}` as MessageKey,
        }))}
        summary={<AggregateSummaryBar data={aggregate} />}
      />

      <MobileStackList>
        {pageRows.map((ticket) => (
          <MobileStackCard key={ticket.id} href={`/dashboard/escrow/${ticket.id}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="pg-link break-all text-left text-sm font-semibold">{ticket.ticketNo}</span>
              <StatusBadge status={ticket.status} kind="escrow" />
            </div>
            <p className="mt-1 text-left text-sm font-medium">{ticket.title}</p>
            <MobileStackFields>
              <MobileStackField label={t('escrow.col.buyer')}>
                {formatPerson(ticket.buyer.name, ticket.buyer.email)}
              </MobileStackField>
              <MobileStackField label={t('escrow.col.seller')}>
                {formatPerson(ticket.seller.name, ticket.seller.email)}
              </MobileStackField>
              <MobileStackField label={t('usdt.col.amount')}>
                {formatCurrency(ticket.amount, ticket.currency)}
              </MobileStackField>
              <MobileStackField label={t('escrow.col.createdAt')}>
                <DualTimezoneDate
                  value={ticket.createdAt}
                  baseTimezone={baseTimezone}
                  serviceTimezone={serviceTimezone}
                  country={country}
                />
              </MobileStackField>
            </MobileStackFields>
          </MobileStackCard>
        ))}
        {pageRows.length === 0 && <MobileStackEmpty>{t('escrow.empty')}</MobileStackEmpty>}
      </MobileStackList>

      <div className="pg-card pg-table-wrap hidden md:block">
        <table className="pg-table">
          <thead>
            <tr>
              <SortableTh label={t('usdt.col.ticketNo')} sortKey="ticketNo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('escrow.col.title')} sortKey="title" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('escrow.col.buyer')} sortKey="buyer" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('escrow.col.seller')} sortKey="seller" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.currency')} sortKey="currency" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.amount')} sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('escrow.col.tier')} sortKey="tier" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.attachments')} sortKey="attachments" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.status')} sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.expectedComplete')} sortKey="expectedComplete" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('escrow.col.createdAt')} sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((ticket) => (
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
                <td className="text-xs">{formatPerson(ticket.buyer.name, ticket.buyer.email)}</td>
                <td className="text-xs">{formatPerson(ticket.seller.name, ticket.seller.email)}</td>
                <td>{ticket.currency}</td>
                <td>{formatCurrency(ticket.amount, ticket.currency)}</td>
                <td>
                  <span className="pg-field-chip pg-field-chip-amber">
                    {t(`escrow.tier.${ticket.tradeTier}` as 'escrow.tier.PREMIUM')}
                  </span>
                </td>
                <td>{ticket.attachments?.length ?? 0}</td>
                <td>
                  <StatusBadge status={ticket.status} kind="escrow" />
                </td>
                <td>
                  {ticket.status === 'ESCROW_COMPLETED' && ticket.expectedCompleteAt ? (
                    <DualTimezoneDate
                      value={ticket.expectedCompleteAt}
                      baseTimezone={baseTimezone}
                      serviceTimezone={serviceTimezone}
                      country={country}
                    />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td>
                  <DualTimezoneDate
                    value={ticket.createdAt}
                    baseTimezone={baseTimezone}
                    serviceTimezone={serviceTimezone}
                    country={country}
                  />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={11} className="pg-empty">
                  {t('escrow.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-3 pb-3">
          <PageSizeBar total={total} page={page} pageSize={pageSize} onPageSize={setPageSize} onPage={setPage} />
        </div>
      </div>

      <div className="md:hidden">
        <PageSizeBar total={total} page={page} pageSize={pageSize} onPageSize={setPageSize} onPage={setPage} />
      </div>
    </div>
  );
}
