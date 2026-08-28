'use client';

import { useT } from '@/context/LocaleProvider';

/** PG payment-history style page sizes */
const SIZES = [50, 100, 300, 400, 500, 1000] as const;

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
  const numeric = pageSize === 'all' ? Math.max(total, 1) : pageSize;
  const pages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / numeric) || 1);
  const maxButtons = 20;
  const windowStart = Math.max(
    1,
    Math.min(page - Math.floor(maxButtons / 2), Math.max(1, pages - maxButtons + 1)),
  );
  const windowEnd = Math.min(pages, windowStart + maxButtons - 1);
  const safePage = Math.min(Math.max(1, page), pages);

  const pageButtons = (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {windowStart > 1 && (
        <button
          type="button"
          className="h-7 min-w-7 rounded border border-sky-300 bg-white text-slate-700 hover:bg-sky-100"
          onClick={() => onPage(Math.max(1, windowStart - 1))}
          aria-label={t('pager.prev')}
        >
          ‹
        </button>
      )}
      {Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i).map((p) => (
        <button
          key={p}
          type="button"
          className={`h-7 min-w-7 rounded border px-1.5 ${
            safePage === p
              ? 'border-blue-800 bg-blue-800 font-semibold text-white'
              : 'border-sky-300 bg-white text-slate-700 hover:bg-sky-100'
          }`}
          onClick={() => onPage(p)}
        >
          {p}
        </button>
      ))}
      {windowEnd < pages && (
        <button
          type="button"
          className="h-7 min-w-7 rounded border border-sky-300 bg-white text-slate-700 hover:bg-sky-100"
          onClick={() => onPage(Math.min(pages, windowEnd + 1))}
          aria-label={t('pager.next')}
        >
          ›
        </button>
      )}
    </div>
  );

  return (
    <div className="mt-3 grid grid-cols-1 items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-slate-600">{t('pager.viewAtOnce')}</span>
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            className={`min-w-9 rounded border px-2 py-1 ${
              pageSize === s
                ? 'border-sky-400 bg-sky-200 font-semibold text-sky-950'
                : 'border-sky-300 bg-white text-slate-700 hover:bg-sky-100'
            }`}
            onClick={() => {
              onPageSize(s);
              onPage(1);
            }}
          >
            {s === 1000 ? t('pager.size1000') : s}
          </button>
        ))}
        <button
          type="button"
          className={`rounded border px-2 py-1 ${
            pageSize === 'all'
              ? 'border-sky-400 bg-sky-200 font-semibold text-sky-950'
              : 'border-sky-300 bg-white text-slate-700 hover:bg-sky-100'
          }`}
          onClick={() => {
            onPageSize('all');
            onPage(1);
          }}
        >
          {t('pager.all')}
        </button>
        <span className="mx-1 text-slate-600">
          {t('pager.unit')} ({t('pager.total', { n: String(total) })})
        </span>
      </div>
      <div className="justify-self-center">{pageButtons}</div>
      <div className="hidden sm:block" aria-hidden />
    </div>
  );
}
