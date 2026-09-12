'use client';

import { useT } from '@/context/LocaleProvider';

export function ListSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="list-search">
        {t('common.search')}
      </label>
      <input
        id="list-search"
        type="search"
        className="pg-input max-w-md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('list.searchPlaceholder')}
      />
    </div>
  );
}

const CHIP_TONES = [
  'pg-field-chip-sky',
  'pg-field-chip-rose',
  'pg-field-chip-amber',
  'pg-field-chip-emerald',
  'pg-field-chip-violet',
  'pg-field-chip-teal',
  'pg-field-chip-orange',
  'pg-field-chip-slate',
] as const;

export function fieldChipClass(index: number): string {
  return `pg-field-chip ${CHIP_TONES[index % CHIP_TONES.length]}`;
}

export function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: string;
  activeKey: string;
  dir: 'asc' | 'desc';
  onSort: (key: string) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[13px] font-semibold hover:text-blue-700"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <span className="text-[10px] text-slate-400">{active ? (dir === 'asc' ? '▲' : '▼') : '◇'}</span>
      </button>
    </th>
  );
}
