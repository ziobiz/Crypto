'use client';

import { LOCALES, LOCALE_SHORT, type Locale } from '@/i18n/locales';
import { useLocale } from '@/context/LocaleProvider';

/** PG 본사정책과 동일 — 상단 가로 언어 버튼 (KR/JP/US/CH/TH) */
export function LocaleBar({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 ${className}`}
      role="group"
      aria-label={t('nav.language')}
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            className={`touch-target min-h-[36px] rounded-md px-2.5 text-xs font-semibold transition sm:px-3 sm:text-sm ${
              active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
            aria-pressed={active}
            title={LOCALE_SHORT[code]}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
