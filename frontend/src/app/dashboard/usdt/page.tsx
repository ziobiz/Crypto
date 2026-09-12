'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtTicket } from '@/lib/api';
import { StatusBadge, buildUsdtStatusContext } from '@/components/StatusBadge';
import { PageSizeBar } from '@/components/PageSizeBar';
import { SortableTh } from '@/components/ListTableControls';
import {
  defaultTxFilter,
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
import { summarizeUsdtTickets } from '@/lib/ledger-summary';
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

const USDT_STATUSES = [
  'APPLICATION_COMPLETED',
  'CARD_PAYMENT_PENDING',
  'DEPOSIT_PROOF_PENDING',
  'ADMIN_REVIEWING',
  'TRANSFER_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

function isOperator(role?: string) {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ORGANIZER' ||
    role === 'SETTLEMENT_ADMIN' ||
    role === 'ORG_STAFF'
  );
}

function ticketDate(row: UsdtTicket, field: string): string | null {
  if (field === 'expectedCompleteAt') return row.expectedCompleteAt ?? null;
  return row.createdAt;
}

function matchKeyword(row: UsdtTicket, field: string, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const hay: Record<string, Array<string | number | null | undefined>> = {
    all: [
      row.ticketNo,
      row.fiatCurrency,
      row.status,
      row.paymentMethod,
      row.collectionProvider,
      row.customer?.user?.name,
      row.customer?.user?.email,
      row.curfexRefNo,
      String(row.fiatAmount),
    ],
    ticketNo: [row.ticketNo],
    customer: [row.customer?.user?.name, row.customer?.user?.email],
    currency: [row.fiatCurrency],
    payment: [row.paymentMethod],
    collection: [row.collectionProvider, row.curfexRefNo],
  };
  const list = hay[field] ?? hay.all;
  return list.some((v) => String(v ?? '').toLowerCase().includes(q));
}

export default function UsdtListPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const kycOk = isKycApproved(user);
  const admin = isOperator(user?.role);
  const { country, setServiceCountry, baseTimezone, serviceTimezone } = useReferenceTimeState();
  const [tickets, setTickets] = useState<UsdtTicket[]>([]);
  const [draft, setDraft] = useState<TransactionFilterState>(defaultTxFilter);
  const [applied, setApplied] = useState<TransactionFilterState>(defaultTxFilter);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  const load = useCallback(() => {
    api.usdt.list().then(setTickets).catch(console.error);
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
      const get = (row: UsdtTicket): unknown => {
        switch (sortKey) {
          case 'ticketNo':
            return row.ticketNo;
          case 'customer':
            return row.customer?.user?.name ?? row.customer?.user?.email ?? '';
          case 'amount':
            return row.fiatAmount;
          case 'currency':
            return row.fiatCurrency;
          case 'expected':
            return row.expectedUsdtAmount;
          case 'payment':
            return row.paymentMethod ?? 'BANK_TRANSFER';
          case 'collection':
            return row.collectionProvider ?? 'FIXED';
          case 'attachments':
            return row.attachments?.length ?? 0;
          case 'inputMode':
            if (row.paymentMethod === 'CARD' && row.cardChargeFiat != null) return 'cardCharge';
            if (row.targetUsdtAmount != null) return 'target';
            return 'fiat';
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

  function paymentLabel(row: UsdtTicket) {
    return row.paymentMethod === 'CARD' ? t('usdt.paymentCard') : t('usdt.paymentBank');
  }
  function collectionLabel(row: UsdtTicket) {
    if (row.paymentMethod === 'CARD') return t('usdt.collection.na');
    return row.collectionProvider === 'CURFEX' ? t('usdt.collection.curfex') : t('usdt.collection.fixed');
  }
  function inputModeLabel(row: UsdtTicket) {
    if (row.paymentMethod === 'CARD' && row.cardChargeFiat != null) return t('usdt.inputModeCardCharge');
    if (row.targetUsdtAmount != null) return t('usdt.inputModeTarget');
    return t('usdt.inputModeFiat');
  }

  const aggregate = useMemo(() => summarizeUsdtTickets(filtered), [filtered]);

  function exportExcel() {
    downloadExcelCsv(
      `usdt-purchase-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t('usdt.col.ticketNo'),
        t('usdt.col.customer'),
        t('usdt.col.currency'),
        t('usdt.col.amount'),
        t('usdt.col.expected'),
        t('usdt.paymentMethod'),
        t('usdt.col.inputMode'),
        t('usdt.col.collection'),
        t('usdt.col.attachments'),
        t('usdt.col.status'),
        t('usdt.col.expectedComplete'),
        t('usdt.col.date'),
      ],
      sorted.map((row) => [
        row.ticketNo,
        formatPerson(row.customer?.user?.name, row.customer?.user?.email),
        row.fiatCurrency,
        row.fiatAmount,
        row.expectedUsdtAmount,
        paymentLabel(row),
        inputModeLabel(row),
        collectionLabel(row),
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
          const next = defaultTxFilter();
          setDraft(next);
          setApplied(next);
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
          { value: 'customer', labelKey: 'usdt.col.customer' },
          { value: 'currency', labelKey: 'usdt.col.currency' },
          { value: 'payment', labelKey: 'usdt.paymentMethod' },
          { value: 'collection', labelKey: 'usdt.col.collection' },
        ]}
        statusOptions={USDT_STATUSES.map((s) => ({
          value: s,
          labelKey: `status.${s}` as MessageKey,
        }))}
        summary={<AggregateSummaryBar data={aggregate} />}
      />

      <MobileStackList>
        {pageRows.map((ticket) => (
          <MobileStackCard key={ticket.id} href={`/dashboard/usdt/${ticket.id}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="pg-link break-all text-left text-sm font-semibold">{ticket.ticketNo}</span>
              <StatusBadge status={ticket.status} kind="usdt" usdtContext={buildUsdtStatusContext(ticket)} />
            </div>
            <MobileStackFields>
              {admin && (
                <MobileStackField label={t('usdt.col.customer')}>
                  {formatPerson(ticket.customer?.user?.name, ticket.customer?.user?.email)}
                </MobileStackField>
              )}
              <MobileStackField label={t('usdt.col.amount')}>
                {formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}
              </MobileStackField>
              <MobileStackField label={t('usdt.col.collection')}>{collectionLabel(ticket)}</MobileStackField>
              <MobileStackField label={t('usdt.col.date')}>
                <DualTimezoneDate
                  value={ticket.createdAt}
                  baseTimezone={baseTimezone}
                  serviceTimezone={serviceTimezone}
                  country={country}
                />
              </MobileStackField>
              {ticket.expectedCompleteAt && (
                <MobileStackField label={t('usdt.col.expectedComplete')}>
                  <DualTimezoneDate
                    value={ticket.expectedCompleteAt}
                    baseTimezone={baseTimezone}
                    serviceTimezone={serviceTimezone}
                    country={country}
                  />
                </MobileStackField>
              )}
            </MobileStackFields>
          </MobileStackCard>
        ))}
        {pageRows.length === 0 && <MobileStackEmpty>{t('usdt.empty')}</MobileStackEmpty>}
      </MobileStackList>

      <div className="pg-card pg-table-wrap hidden md:block">
        <table className="pg-table">
          <thead>
            <tr>
              <SortableTh label={t('usdt.col.ticketNo')} sortKey="ticketNo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              {admin && (
                <SortableTh label={t('usdt.col.customer')} sortKey="customer" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              )}
              <SortableTh label={t('usdt.col.currency')} sortKey="currency" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.amount')} sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.expected')} sortKey="expected" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.paymentMethod')} sortKey="payment" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.inputMode')} sortKey="inputMode" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.collection')} sortKey="collection" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.attachments')} sortKey="attachments" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.status')} sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.expectedComplete')} sortKey="expectedComplete" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.date')} sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((ticket) => (
              <tr
                key={ticket.id}
                {...detailRowProps(t('table.dblclickHint'), () => router.push(`/dashboard/usdt/${ticket.id}`))}
              >
                <td>
                  <Link href={`/dashboard/usdt/${ticket.id}`} className="pg-link">
                    {ticket.ticketNo}
                  </Link>
                </td>
                {admin && (
                  <td className="text-xs">
                    {formatPerson(ticket.customer?.user?.name, ticket.customer?.user?.email)}
                  </td>
                )}
                <td>{ticket.fiatCurrency}</td>
                <td>{formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}</td>
                <td>{ticket.expectedUsdtAmount.toFixed(4)}</td>
                <td>
                  <span className={`pg-field-chip ${ticket.paymentMethod === 'CARD' ? 'pg-field-chip-violet' : 'pg-field-chip-sky'}`}>
                    {paymentLabel(ticket)}
                  </span>
                </td>
                <td className="text-[11px]">{inputModeLabel(ticket)}</td>
                <td>
                  <span
                    className={`pg-field-chip ${
                      ticket.paymentMethod === 'CARD'
                        ? 'pg-field-chip-slate'
                        : ticket.collectionProvider === 'CURFEX'
                          ? 'pg-field-chip-emerald'
                          : 'pg-field-chip-red'
                    }`}
                  >
                    {collectionLabel(ticket)}
                  </span>
                </td>
                <td>{ticket.attachments?.length ?? 0}</td>
                <td>
                  <StatusBadge status={ticket.status} kind="usdt" usdtContext={buildUsdtStatusContext(ticket)} />
                </td>
                <td>
                  <DualTimezoneDate
                    value={ticket.expectedCompleteAt}
                    baseTimezone={baseTimezone}
                    serviceTimezone={serviceTimezone}
                    country={country}
                  />
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
                <td colSpan={admin ? 12 : 11} className="pg-empty">
                  {t('usdt.empty')}
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
