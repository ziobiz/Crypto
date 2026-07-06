'use client';

import { useEffect, useState } from 'react';
import { LOCALES, LOCALE_SHORT, type Locale } from '@/i18n/locales';
import { useLocale, useT } from '@/context/LocaleProvider';
import { useTabletMode } from '@/context/TabletModeContext';
import { useNavTabs } from '@/context/NavTabsContext';
import { api } from '@/lib/api';
import { UserMenu } from './UserMenu';

function intlLocale(locale: Locale): string {
  if (locale === 'US') return 'en-US';
  if (locale === 'JP') return 'ja-JP';
  if (locale === 'CH') return 'zh-CN';
  if (locale === 'TH') return 'th-TH';
  return 'ko-KR';
}

export function formatAccessTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}. ${m}. ${d} ${h}:${min}:${sec}`;
}

export function formatDateBadge(date: Date, locale: Locale): string {
  const day = String(date.getDate()).padStart(2, '0');
  const loc = intlLocale(locale);
  const month = new Intl.DateTimeFormat(loc, { month: 'long' }).format(date);
  const weekday = new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(date);
  const monthUp =
    locale === 'KR' || locale === 'JP' || locale === 'CH' || locale === 'TH'
      ? month
      : month.toUpperCase();
  const weekUp =
    locale === 'KR' || locale === 'JP' || locale === 'CH' || locale === 'TH'
      ? weekday
      : weekday.toUpperCase();
  return `${day}. ${monthUp}. ${weekUp}`;
}

function Pipe() {
  return <span className="mx-2.5 shrink-0 select-none text-gray-300" aria-hidden>|</span>;
}

export function SessionMetaBar() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { tablet, setTablet } = useTabletMode();
  const { tabs, closeAll } = useNavTabs();
  const [now, setNow] = useState(() => new Date());
  const [ip, setIp] = useState('—');

  useEffect(() => {
    api.sessionInfo().then((r) => setIp(r.ip || '—')).catch(() => setIp('—'));
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const timeStr = formatAccessTime(now);
  const dateStr = formatDateBadge(now, locale);

  return (
    <header className="pg-session-bar">
      <div className="pg-session-inner">
        <div className="flex min-w-0 items-center overflow-x-auto whitespace-nowrap">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="pg-session-meta-label">{t('session.tablet')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={tablet}
              onClick={() => setTablet((v) => !v)}
              className={`relative h-4 w-8 shrink-0 rounded-full transition ${tablet ? 'bg-blue-600' : 'bg-gray-400'}`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${
                  tablet ? 'left-4' : 'left-0.5'
                }`}
              />
            </button>
          </label>

          <Pipe />

          <span className="pg-session-pill">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code as Locale)}
                className={`pg-session-lang ${
                  locale === code ? 'pg-session-lang-active' : 'pg-session-lang-idle'
                }`}
              >
                {LOCALE_SHORT[code]}
              </button>
            ))}
          </span>

          <Pipe />
          <MetaField label={t('session.accessIp')} value={ip} />
          <Pipe />
          <MetaField label={t('session.accessTime')} value={timeStr} />
          <Pipe />
          <MetaField label={t('session.date')} value={dateStr} />
        </div>

        <Pipe />
        <UserMenu />
        {tabs.length > 1 && (
          <button type="button" onClick={closeAll} className="pg-session-close">
            <span aria-hidden>✕</span>
            <span className="hidden sm:inline">{t('nav.closeAllLabel')}</span>
          </button>
        )}
      </div>
    </header>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <span className="pg-session-meta">
      <span className="pg-session-meta-label">{label}</span>
      <span className="text-gray-400">:</span>
      <span className="pg-session-meta-value">{value}</span>
    </span>
  );
}
