/** PG와 동일 5개 로케일 — KR(한국), JP(日本), US(English), CH(中文), TH(ไทย) */
export const LOCALES = ['KR', 'JP', 'US', 'CH', 'TH'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'crypto_ui_locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  KR: '한국어',
  JP: '日本語',
  US: 'English',
  CH: '中文',
  TH: 'ไทย',
};

/** PG 상단 언어 버튼 — KR / JP / US / CH / TH */
export const LOCALE_SHORT: Record<Locale, string> = {
  KR: 'KR',
  JP: 'JP',
  US: 'US',
  CH: 'CH',
  TH: 'TH',
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  KR: 'ko',
  JP: 'ja',
  US: 'en',
  CH: 'zh',
  TH: 'th',
};

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'KR';
  const langs = navigator.languages?.length ? [...navigator.languages] : [navigator.language];
  for (const raw of langs) {
    const l = String(raw || '').toLowerCase();
    if (l.startsWith('ko')) return 'KR';
    if (l.startsWith('ja')) return 'JP';
    if (l.startsWith('zh')) return 'CH';
    if (l.startsWith('th')) return 'TH';
    if (l.startsWith('en')) return 'US';
  }
  return 'KR';
}

export function normalizeLocale(raw: string | null | undefined): Locale {
  const u = String(raw || 'KR').trim().toUpperCase();
  if (u === 'KOR' || u === 'KO') return 'KR';
  if (u === 'EN') return 'US';
  if (isLocale(u)) return u;
  return 'KR';
}
