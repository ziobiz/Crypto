'use client';

import type { ReactNode } from 'react';
import { useT } from '@/context/LocaleProvider';
import { DateQuickKey, rangeForQuick } from '@/lib/date-range';
import type { ListAggregateSummary } from '@/lib/ledger-summary';
import type { MessageKey } from '@/i18n/messages';

export type FilterOption = { value: string; labelKey: MessageKey };

export type TransactionFilterState = {
  dateField: string;
  dateFrom: string;
  dateTo: string;
  quick: DateQuickKey | '';
  searchField: string;
  keyword: string;
  status: string;
};

/** Empty search fields; dates intentionally blank (legacy). Prefer defaultTxFilter(). */
export const EMPTY_TX_FILTER: TransactionFilterState = {
  dateField: 'createdAt',
  dateFrom: '',
  dateTo: '',
  quick: '',
  searchField: 'all',
  keyword: '',
  status: '',
};

/** Default list filter: end = today, start = 1 week ago (matches 「1주」 quick). */
export function defaultTxFilter(now = new Date()): TransactionFilterState {
  const week = rangeForQuick('week1', now);
  return {
    dateField: 'createdAt',
    dateFrom: week.from,
    dateTo: week.to,
    quick: 'week1',
    searchField: 'all',
    keyword: '',
    status: '',
  };
}

const QUICKS: { key: DateQuickKey; labelKey: MessageKey }[] = [
  { key: 'today', labelKey: 'filter.quick.today' },
  { key: 'thisMonth', labelKey: 'filter.quick.thisMonth' },
  { key: 'yesterday', labelKey: 'filter.quick.yesterday' },
  { key: 'week1', labelKey: 'filter.quick.week1' },
  { key: 'week2', labelKey: 'filter.quick.week2' },
  { key: 'lastMonth', labelKey: 'filter.quick.lastMonth' },
];

export function TransactionFilterBar({
  value,
  onChange,
  onSearch,
  onReset,
  onRefresh,
  onExcel,
  sortDir,
  onSortDir,
  dateFieldOptions,
  searchFieldOptions,
  statusOptions,
  hqCountry,
  onHqCountryChange,
  summary,
}: {
  value: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
  onSearch: () => void;
  onReset: () => void;
  onRefresh?: () => void;
  onExcel?: () => void;
  sortDir: 'asc' | 'desc';
  onSortDir: (dir: 'asc' | 'desc') => void;
  dateFieldOptions: FilterOption[];
  searchFieldOptions: FilterOption[];
  statusOptions: FilterOption[];
  /** PG 「본사설정」— 국가 선택 시 서비스기준시간 변경 */
  hqCountry?: string;
  onHqCountryChange?: (country: string) => void;
  /** 집계 바 — 필터 아래 · 본사설정/액션 버튼 위 */
  summary?: ReactNode;
}) {
  const t = useT();

  function setQuick(key: DateQuickKey) {
    const r = rangeForQuick(key);
    onChange({ ...value, quick: key, dateFrom: r.from, dateTo: r.to });
  }

  return (
    <div className="pg-tx-filter space-y-2">
      <div className="pg-card">
        <div className="pg-card-body space-y-2.5">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[8rem]">
              <span className="pg-label">{t('filter.dateField')}</span>
              <select
                className="pg-select pg-tx-field mt-0.5"
                value={value.dateField}
                onChange={(e) => onChange({ ...value, dateField: e.target.value })}
              >
                {dateFieldOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="pg-label">{t('filter.dateFrom')}</span>
              <input
                type="date"
                className="pg-input pg-tx-field mt-0.5 w-[9.5rem]"
                value={value.dateFrom}
                onChange={(e) => onChange({ ...value, dateFrom: e.target.value, quick: '' })}
              />
            </label>
            <span className="pb-1 text-slate-400">~</span>
            <label>
              <span className="pg-label">{t('filter.dateTo')}</span>
              <input
                type="date"
                className="pg-input pg-tx-field mt-0.5 w-[9.5rem]"
                value={value.dateTo}
                onChange={(e) => onChange({ ...value, dateTo: e.target.value, quick: '' })}
              />
            </label>
            <div className="flex flex-wrap items-center gap-1 pb-0.5">
              {QUICKS.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  className={`pg-tx-quick ${
                    value.quick === q.key
                      ? 'border-amber-400 bg-amber-200 font-semibold text-amber-950'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setQuick(q.key)}
                >
                  {t(q.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[8rem]">
              <span className="pg-label">{t('filter.searchField')}</span>
              <select
                className="pg-select pg-tx-field mt-0.5"
                value={value.searchField}
                onChange={(e) => onChange({ ...value, searchField: e.target.value })}
              >
                {searchFieldOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[8rem] w-[14rem] shrink-0">
              <span className="pg-label">{t('filter.keyword')}</span>
              <input
                className="pg-input pg-tx-field mt-0.5 w-full"
                value={value.keyword}
                onChange={(e) => onChange({ ...value, keyword: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch();
                }}
                placeholder={t('list.searchPlaceholder')}
              />
            </label>
            <label className="min-w-[8rem]">
              <span className="pg-label">{t('filter.status')}</span>
              <select
                className="pg-select pg-tx-field mt-0.5"
                value={value.status}
                onChange={(e) => onChange({ ...value, status: e.target.value })}
              >
                <option value="">{t('filter.all')}</option>
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="pg-btn pg-btn-primary pg-tx-field-btn" onClick={onSearch}>
              {t('filter.search')}
            </button>
            <button type="button" className="pg-btn pg-btn-secondary pg-tx-field-btn" onClick={onReset}>
              {t('filter.reset')}
            </button>
          </div>
        </div>
      </div>

      {summary}

      <div className="flex flex-nowrap items-center justify-end gap-1 overflow-x-auto">
        {onHqCountryChange != null && (
          <select
            className="pg-btn pg-btn-secondary pg-tx-hq-select shrink-0 cursor-pointer whitespace-nowrap"
            value={hqCountry ?? ''}
            onChange={(e) => onHqCountryChange(e.target.value)}
            title={t('filter.hqSettings')}
            aria-label={t('filter.hqSettings')}
          >
            <option value="">{t('filter.hqSettings')}</option>
            <option value="KR">{t('time.country.KR')}</option>
            <option value="JP">{t('time.country.JP')}</option>
            <option value="US">{t('time.country.US')}</option>
            <option value="CH">{t('time.country.CH')}</option>
            <option value="TH">{t('time.country.TH')}</option>
          </select>
        )}
        {onRefresh && (
          <button
            type="button"
            className="pg-btn pg-btn-secondary shrink-0 whitespace-nowrap"
            onClick={onRefresh}
          >
            {t('filter.refresh')}
          </button>
        )}
        <button
          type="button"
          className={`pg-btn shrink-0 whitespace-nowrap ${
            sortDir === 'desc' ? 'pg-btn-primary' : 'pg-btn-secondary'
          }`}
          onClick={() => onSortDir('desc')}
        >
          {t('filter.sortDesc')}
        </button>
        <button
          type="button"
          className={`pg-btn shrink-0 whitespace-nowrap ${
            sortDir === 'asc' ? 'pg-btn-primary' : 'pg-btn-secondary'
          }`}
          onClick={() => onSortDir('asc')}
        >
          {t('filter.sortAsc')}
        </button>
        {onExcel && (
          <button
            type="button"
            className="pg-btn pg-btn-primary shrink-0 whitespace-nowrap"
            onClick={onExcel}
          >
            {t('filter.excel')}
          </button>
        )}
      </div>
    </div>
  );
}

export type CurrencyBucket = { currency: string; count: number; total: number };

function joinParts(parts: string[]): string {
  return parts.length ? parts.join(' · ') : '—';
}

/** PG-style clean summary bar: 건수 | 총거래 | 실패 | 수수료 | 추정결산 */
export function AggregateSummaryBar({ data }: { data: ListAggregateSummary }) {
  const t = useT();
  const sep = <span className="mx-2 text-sky-300">|</span>;
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 leading-relaxed text-indigo-950">
      <div className="flex flex-wrap items-center gap-y-1">
        <span>
          {t('filter.countLabel')}: <strong>{data.count}</strong>
        </span>
        {sep}
        <span>
          {t('filter.totalTrade')}: [{joinParts(data.totalTrade)}]
        </span>
        {sep}
        <span>
          {t('filter.failed')}: [{joinParts(data.failed)}]
        </span>
        {sep}
        <span>
          {t('filter.fees')}: [{joinParts(data.fees)}]
        </span>
        {sep}
        <span>
          {t('filter.settlement')}: [{joinParts(data.settlement)}]
        </span>
      </div>
    </div>
  );
}

export function mergeCurrencyBuckets(
  map: Map<string, { count: number; total: number }>,
): CurrencyBucket[] {
  return [...map.entries()]
    .map(([currency, v]) => ({ currency, count: v.count, total: Math.round(v.total * 10000) / 10000 }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function addToBucket(
  map: Map<string, { count: number; total: number }>,
  currency: string,
  amount: number,
  count = 1,
) {
  const cur = currency || '—';
  const prev = map.get(cur) ?? { count: 0, total: 0 };
  prev.count += count;
  prev.total += amount;
  map.set(cur, prev);
}
