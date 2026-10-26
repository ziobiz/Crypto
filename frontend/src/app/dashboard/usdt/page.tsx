'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtDepositContext, UsdtTicket } from '@/lib/api';
import {
  pendingIcopayReturnPath,
  pickIcopayOrderNoFromSearch,
  isIcopayBrowserReturnQuery,
} from '@/lib/icopay-return';
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
  'QUOTE_PENDING',
  'QUOTE_CONFIRMED',
  'APPLICATION_COMPLETED',
  'CARD_PAYMENT_PENDING',
  'DEPOSIT_PROOF_PENDING',
  'ADMIN_REVIEWING',
  'TRANSFER_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

const USDT_PAGE_SIZES = [100, 200, 300, 400, 500, 1000] as const;

function isOperator(role?: string) {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ORGANIZER' ||
    role === 'SETTLEMENT_ADMIN' ||
    role === 'ORG_STAFF'
  );
}

type QualKind = 'INDIVIDUAL' | 'CORPORATE' | 'SYNTH';

function qualOf(row: UsdtTicket): QualKind {
  const blob = `${row.tradeLane ?? ''} ${row.adminNote ?? ''} ${row.curfexRefNo ?? ''} ${row.icopayTransactionId ?? ''}`;
  if (
    row.tradeLane === 'SYNTH' ||
    row.sandboxInvoice ||
    /sandbox|local[-_ ]?mock|simulator|no live acquirer/i.test(blob)
  ) {
    return 'SYNTH';
  }
  return row.customer?.customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
}

const QUAL_WORDS: Record<QualKind, string[]> = {
  INDIVIDUAL: ['individual', '개인', '개인용', 'pe', '個人', '个人', 'บุคคล'],
  CORPORATE: ['corporate', 'company', '기업', '기업용', 'co', '법인', '法人', '企业', '公司', 'นิติ'],
  SYNTH: ['sinth', 'synth', 'st', '신스', '테스트', 'test', 'sandbox', '샌드박스', 'mock', '목업', '沙箱', '模拟', 'テスト', 'แซนด์บ็อกซ์', 'ทดสอบ'],
};

function qualLabelKey(kind: QualKind): MessageKey {
  if (kind === 'SYNTH') return 'usdt.qual.synth';
  if (kind === 'CORPORATE') return 'usdt.qual.corporate';
  return 'usdt.qual.individual';
}

function qualCodeKey(kind: QualKind): MessageKey {
  if (kind === 'SYNTH') return 'usdt.qual.code.synth';
  if (kind === 'CORPORATE') return 'usdt.qual.code.corporate';
  return 'usdt.qual.code.individual';
}

function qualTone(kind: QualKind): string {
  if (kind === 'SYNTH') return 'pg-qual-synth';
  if (kind === 'CORPORATE') return 'pg-qual-corporate';
  return 'pg-qual-individual';
}

function qualMatches(row: UsdtTicket, keyword: string, label: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const kind = qualOf(row);
  return [label, kind, ...QUAL_WORDS[kind]].some((word) => word.toLowerCase().includes(q));
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
  const search = useSearchParams();
  const kycOk = isKycApproved(user);
  const tradeAllowed = user?.tradeAccess !== 'VIEW_ONLY';
  const admin = isOperator(user?.role);
  const { country, setServiceCountry, baseTimezone, serviceTimezone } = useReferenceTimeState();
  const [tickets, setTickets] = useState<UsdtTicket[]>([]);
  const [draft, setDraft] = useState<TransactionFilterState>(defaultTxFilter);
  const [applied, setApplied] = useState<TransactionFilterState>(defaultTxFilter);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(100);
  const [depositCtx, setDepositCtx] = useState<UsdtDepositContext | null>(null);
  const [qual, setQual] = useState<'ALL' | QualKind>('ALL');
  const dailyBlocked = !!depositCtx?.dailyTicketLimitReached;

  const load = useCallback(() => {
    api.usdt.list().then(setTickets).catch(console.error);
  }, []);

  /** 구 ICOPAY Result URL(/dashboard/usdt) 복귀 → 결제 결과 페이지로 전달 */
  useEffect(() => {
    const fromPending = pendingIcopayReturnPath('/dashboard/usdt', search.toString());
    if (fromPending) {
      router.replace(fromPending);
      return;
    }
    const orderNo = pickIcopayOrderNoFromSearch(search);
    const ticketId = search.get('ticketId') || '';
    const looksLikeReturn = isIcopayBrowserReturnQuery(search);
    if (!looksLikeReturn) return;
    const q = new URLSearchParams();
    if (orderNo) q.set('orderNo', orderNo);
    if (ticketId) q.set('ticketId', ticketId);
    const status =
      search.get('paymentStatus') ||
      search.get('status') ||
      search.get('returncode') ||
      search.get('chillPaymentStatus');
    if (status) q.set('paymentStatus', status);
    router.replace(`/dashboard/usdt/card-result${q.toString() ? `?${q}` : ''}`);
  }, [router, search]);

  useEffect(() => {
    load();
    if (user?.role === 'CUSTOMER' || user?.role === 'CUSTOMER_OPERATOR') {
      api.usdt.depositContext().then(setDepositCtx).catch(console.error);
    }
  }, [load, user?.role]);

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
      const kind = qualOf(row);
      if (qual === 'ALL' && kind === 'SYNTH') return false;
      if (qual !== 'ALL' && kind !== qual) return false;
      if (applied.status && row.status !== applied.status) return false;
      if (applied.dateField !== 'all' && (applied.dateFrom || applied.dateTo)) {
        if (!inYmdRange(ticketDate(row, applied.dateField), applied.dateFrom, applied.dateTo)) {
          return false;
        }
      }
      const qualLabel = `${t(qualLabelKey(kind))} ${t(qualCodeKey(kind))}`;
      if (applied.searchField === 'qualification') return qualMatches(row, applied.keyword, qualLabel);
      const keywordOk = matchKeyword(row, applied.searchField, applied.keyword);
      if (applied.searchField === 'all' && applied.keyword.trim()) {
        return keywordOk || qualMatches(row, applied.keyword, qualLabel);
      }
      return keywordOk;
    });
  }, [tickets, applied, qual, t]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const get = (row: UsdtTicket): unknown => {
        switch (sortKey) {
          case 'ticketNo':
            return row.ticketNo;
          case 'customer':
            return row.customer?.user?.name ?? row.customer?.user?.email ?? '';
          case 'qualification':
            return qualOf(row);
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
          case 'remark':
            return isScheduleDelayed(row) ? 1 : 0;
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
    if (row.paymentMethod === 'CARD') return t('usdt.paymentCard');
    if (row.paymentMethod === 'REMITTANCE') return t('usdt.paymentRemittance');
    return t('usdt.paymentBank');
  }
  function collectionLabel(row: UsdtTicket) {
    if (row.paymentMethod === 'CARD') return t('usdt.collection.na');
    if (row.collectionProvider === 'CURFEX') return t('usdt.collection.curfex');
    if (row.collectionProvider === 'DIRECT' || row.paymentMethod === 'REMITTANCE') {
      return t('usdt.collection.direct');
    }
    return t('usdt.collection.fixed');
  }
  function inputModeLabel(row: UsdtTicket) {
    if (row.paymentMethod === 'CARD' && row.cardChargeFiat != null) return t('usdt.inputModeCardCharge');
    if (row.targetUsdtAmount != null) return t('usdt.inputModeTarget');
    return t('usdt.inputModeFiat');
  }
  function isScheduleDelayed(row: UsdtTicket) {
    return (row.scheduleDelayHoursTotal ?? 0) > 0;
  }
  function isRemarkClosed(row: UsdtTicket) {
    return row.status === 'COMPLETED' || row.status === 'CANCELLED';
  }
  function remarkLabel(row: UsdtTicket) {
    return isScheduleDelayed(row) ? t('usdt.remark.delayed') : t('usdt.remark.onSchedule');
  }
  function remarkChipClass(row: UsdtTicket) {
    if (!isScheduleDelayed(row)) return 'pg-field-chip pg-field-chip-slate';
    // 완료·취소된 지연 건은 이력이 남도록 「지연」 유지, 색만 그레이
    if (isRemarkClosed(row)) return 'pg-field-chip pg-field-chip-slate opacity-80';
    return 'pg-field-chip pg-field-chip-red';
  }

  const aggregate = useMemo(() => summarizeUsdtTickets(filtered), [filtered]);

  function exportExcel() {
    downloadExcelCsv(
      `usdt-purchase-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        t('usdt.col.ticketNo'),
        t('usdt.col.customer'),
        t('usdt.col.qualification'),
        t('usdt.col.currency'),
        t('usdt.col.amount'),
        t('usdt.col.expected'),
        t('usdt.paymentMethod'),
        t('usdt.col.inputMode'),
        t('usdt.col.collection'),
        t('usdt.col.attachments'),
        t('usdt.col.status'),
        t('usdt.col.remark'),
        t('usdt.col.expectedComplete'),
        t('usdt.col.date'),
      ],
      sorted.map((row) => [
        row.ticketNo,
        formatPerson(row.customer?.user?.name, row.customer?.user?.email),
        t(qualCodeKey(qualOf(row))),
        row.fiatCurrency,
        row.fiatAmount,
        row.expectedUsdtAmount,
        paymentLabel(row),
        inputModeLabel(row),
        collectionLabel(row),
        row.attachments?.length ?? 0,
        row.status,
        remarkLabel(row),
        row.expectedCompleteAt
          ? formatDualTimezonePlain(row.expectedCompleteAt, baseTimezone, serviceTimezone, country)
          : '',
        formatDualTimezonePlain(row.createdAt, baseTimezone, serviceTimezone, country),
      ]),
    );
  }

  const newBtn =
    user?.role === 'CUSTOMER' || user?.role === 'CUSTOMER_OPERATOR' ? (
      kycOk && tradeAllowed && !dailyBlocked ? (
        <Link href="/dashboard/usdt/new" className="pg-btn pg-btn-primary w-full sm:w-auto">
          {t('usdt.new')}
        </Link>
      ) : (
        <span
          className="pg-btn pg-btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto"
          title={
            dailyBlocked
              ? t('usdt.dailyLimitReachedShort')
              : !tradeAllowed
                ? t('tradeAccess.requiredToTrade')
                : t('kyc.requiredToTrade')
          }
        >
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
      {dailyBlocked && (
        <div className="pg-callout pg-callout-error text-sm">
          {t('usdt.dailyLimitReached', {
            max: depositCtx?.maxDailyTicketsPerCustomer ?? 0,
          })}
        </div>
      )}

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
          setQual('ALL');
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
          { value: 'all', labelKey: 'filter.date.all' },
          { value: 'createdAt', labelKey: 'filter.date.applied' },
          { value: 'expectedCompleteAt', labelKey: 'filter.date.expected' },
        ]}
        searchFieldOptions={[
          { value: 'all', labelKey: 'filter.all' },
          { value: 'ticketNo', labelKey: 'usdt.col.ticketNo' },
          { value: 'customer', labelKey: 'usdt.col.customer' },
          { value: 'qualification', labelKey: 'usdt.col.qualification' },
          { value: 'currency', labelKey: 'usdt.col.currency' },
          { value: 'payment', labelKey: 'usdt.paymentMethod' },
          { value: 'collection', labelKey: 'usdt.col.collection' },
        ]}
        statusOptions={USDT_STATUSES.map((s) => ({
          value: s,
          labelKey: `status.${s}` as MessageKey,
        }))}
        qualification={{
          labelKey: 'usdt.col.qualification',
          value: qual,
          onChange: (next) => {
            setQual(next as 'ALL' | QualKind);
            setPage(1);
          },
          options: [
            { value: 'ALL', label: t('filter.all') },
            { value: 'INDIVIDUAL', label: t('usdt.qual.individual') },
            { value: 'CORPORATE', label: t('usdt.qual.corporate') },
            { value: 'SYNTH', label: t('usdt.qual.synth') },
          ],
        }}
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
              <MobileStackField label={t('usdt.col.qualification')}>
                <span className={`pg-qual-tab ${qualTone(qualOf(ticket))}`}>
                  {t(qualCodeKey(qualOf(ticket)))}
                </span>
              </MobileStackField>
              <MobileStackField label={t('usdt.col.amount')}>
                {formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}
              </MobileStackField>
              <MobileStackField label={t('usdt.col.collection')}>{collectionLabel(ticket)}</MobileStackField>
              <MobileStackField label={t('usdt.col.remark')}>
                <span className={remarkChipClass(ticket)}>{remarkLabel(ticket)}</span>
              </MobileStackField>
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
        <table className="pg-table pg-table-usdt">
          <thead>
            <tr>
              <SortableTh label={t('usdt.col.ticketNo')} sortKey="ticketNo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              {admin && (
                <SortableTh label={t('usdt.col.customer')} sortKey="customer" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              )}
              <SortableTh label={t('usdt.col.qualification')} sortKey="qualification" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.currency')} sortKey="currency" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.amount')} sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.expected')} sortKey="expected" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.paymentMethod')} sortKey="payment" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.inputMode')} sortKey="inputMode" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.collection')} sortKey="collection" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.attachments')} sortKey="attachments" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.status')} sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableTh label={t('usdt.col.remark')} sortKey="remark" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
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
                <td>
                  <span className={`pg-qual-tab ${qualTone(qualOf(ticket))}`}>
                    {t(qualCodeKey(qualOf(ticket)))}
                  </span>
                </td>
                <td>{ticket.fiatCurrency}</td>
                <td>{formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)}</td>
                <td>{ticket.expectedUsdtAmount.toFixed(4)}</td>
                <td>
                  <span
                    className={`pg-field-chip ${
                      ticket.paymentMethod === 'CARD'
                        ? 'pg-field-chip-violet'
                        : ticket.paymentMethod === 'REMITTANCE'
                          ? 'pg-field-chip-emerald'
                          : 'pg-field-chip-sky'
                    }`}
                  >
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
                  <span className={remarkChipClass(ticket)}>{remarkLabel(ticket)}</span>
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
                <td colSpan={admin ? 14 : 13} className="pg-empty">
                  {t('usdt.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-3 pb-3">
          <PageSizeBar total={total} page={page} pageSize={pageSize} sizes={USDT_PAGE_SIZES} onPageSize={setPageSize} onPage={setPage} />
        </div>
      </div>

      <div className="md:hidden">
        <PageSizeBar total={total} page={page} pageSize={pageSize} sizes={USDT_PAGE_SIZES} onPageSize={setPageSize} onPage={setPage} />
      </div>
    </div>
  );
}
