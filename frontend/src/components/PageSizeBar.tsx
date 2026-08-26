'use client';

import { useT } from '@/context/LocaleProvider';

const SIZES = [100, 300, 5000, 10000] as const;

export function PageSizeBar({
  total,
  page,
  pageSize,
  onPageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number | 'all';
  onPageSize: (size: number | 'all') => void;
  onPage: (page: number) => void;
}) {
  const t = useT();
  const numeric = pageSize === 'all' ? total || 1 : pageSize;
  const pages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / numeric));
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm">
      <span className="text-slate-600">{t('pager.viewAtOnce')}</span>
      {SIZES.map((s) => (
        <button
          key={s}
          type="button"
          className={`rounded border px-2 py-0.5 ${
            pageSize === s ? 'border-sky-400 bg-sky-200 font-semibold' : 'border-slate-300 bg-white'
          }`}
          onClick={() => onPageSize(s)}
        >
          {s}
        </button>
      ))}
      <button
        type="button"
        className={`rounded border px-2 py-0.5 ${
          pageSize === 'all' ? 'border-sky-400 bg-sky-200 font-semibold' : 'border-slate-300 bg-white'
        }`}
        onClick={() => onPageSize('all')}
      >
        {t('pager.all')}
      </button>
      <span className="text-slate-500">
        {t('pager.unit')} ({t('pager.total', { n: total })})
      </span>
      <div className="ml-auto flex flex-wrap gap-1">
        {Array.from({ length: Math.min(pages, 12) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            className={`h-8 w-8 rounded ${
              page === p ? 'bg-blue-800 text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
