'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, type Locale } from '@/i18n/locales';
import { useLocale, useT } from '@/context/LocaleProvider';

export function LocaleDropdown({
  variant = 'light',
}: {
  variant?: 'light' | 'session';
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const triggerClass =
    variant === 'session'
      ? 'inline-flex h-9 min-w-[3.25rem] items-center justify-center gap-0.5 rounded-lg border px-2 text-[11px] font-semibold'
      : 'inline-flex h-9 min-w-[3.25rem] items-center justify-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        className={triggerClass}
        style={
          variant === 'session'
            ? {
                background: 'var(--shell-session-pill-bg)',
                borderColor: 'var(--shell-session-pill-border)',
                color: 'var(--shell-session-text)',
              }
            : undefined
        }
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('nav.language')}
        onClick={() => setOpen((v) => !v)}
      >
        {LOCALE_SHORT[locale]}
        <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          className="absolute right-0 z-50 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${
                  locale === code ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setLocale(code as Locale);
                  setOpen(false);
                }}
              >
                <span>{LOCALE_SHORT[code]}</span>
                <span className="ml-3 text-[11px] text-gray-500">{LOCALE_LABELS[code]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
