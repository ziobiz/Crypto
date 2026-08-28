'use client';

import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export function useClientTable<T>(items: T[], opts?: { initialPageSize?: number | 'all' }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(opts?.initialPageSize ?? 50);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  return {
    search,
    setSearch: (v: string) => {
      setSearch(v);
      setPage(1);
    },
    sortKey,
    sortDir,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize: (s: number | 'all') => {
      setPageSize(s);
      setPage(1);
    },
    /** Call after filtering/sorting externally or use helpers below */
    slicePage(rows: T[]): T[] {
      if (pageSize === 'all') return rows;
      const start = (page - 1) * pageSize;
      return rows.slice(start, start + pageSize);
    },
  };
}

export function compareValues(a: unknown, b: unknown, dir: SortDir): number {
  const mul = dir === 'asc' ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return 1 * mul;
  if (b == null) return -1 * mul;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * mul;
  const as = String(a);
  const bs = String(b);
  return as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' }) * mul;
}

export function matchesSearch(haystack: Array<string | number | null | undefined>, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((v) => String(v ?? '').toLowerCase().includes(needle));
}

export function useSortedFilteredPage<T>(
  items: T[],
  opts: {
    search: string;
    match: (row: T, q: string) => boolean;
    sortKey: string;
    sortDir: SortDir;
    getSortValue: (row: T, key: string) => unknown;
    page: number;
    pageSize: number | 'all';
  },
) {
  return useMemo(() => {
    const filtered = items.filter((row) => opts.match(row, opts.search));
    const sorted = [...filtered].sort((a, b) =>
      compareValues(opts.getSortValue(a, opts.sortKey), opts.getSortValue(b, opts.sortKey), opts.sortDir),
    );
    const total = sorted.length;
    const pageRows =
      opts.pageSize === 'all'
        ? sorted
        : sorted.slice((opts.page - 1) * opts.pageSize, (opts.page - 1) * opts.pageSize + opts.pageSize);
    return { filtered: sorted, pageRows, total };
  }, [items, opts]);
}
