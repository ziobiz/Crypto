import type { Locale } from '@/i18n/locales';
import type { MessageKey } from '@/i18n/messages';

/** IANA TZ options for HQ platform Domain·SSL settings */
export const PLATFORM_TIMEZONE_OPTIONS: { value: string; labelKey: MessageKey }[] = [
  { value: 'Asia/Seoul', labelKey: 'tz.Asia/Seoul' },
  { value: 'Asia/Tokyo', labelKey: 'tz.Asia/Tokyo' },
  { value: 'Asia/Shanghai', labelKey: 'tz.Asia/Shanghai' },
  { value: 'Asia/Bangkok', labelKey: 'tz.Asia/Bangkok' },
  { value: 'America/New_York', labelKey: 'tz.America/New_York' },
  { value: 'America/Los_Angeles', labelKey: 'tz.America/Los_Angeles' },
  { value: 'Europe/London', labelKey: 'tz.Europe/London' },
  { value: 'UTC', labelKey: 'tz.UTC' },
];

/** Country override → service timezone (PG payment-history style) */
export const COUNTRY_SERVICE_TIMEZONES: Record<Locale, string> = {
  KR: 'Asia/Seoul',
  JP: 'Asia/Tokyo',
  US: 'America/New_York',
  CH: 'Asia/Shanghai',
  TH: 'Asia/Bangkok',
};

export type ServiceCountryKey = '' | Locale;

export const SERVICE_COUNTRY_STORAGE_KEY = 'crypto_service_country';

export function resolveServiceTimezone(
  hqServiceTimezone: string,
  country: ServiceCountryKey,
): string {
  if (country && COUNTRY_SERVICE_TIMEZONES[country]) {
    return COUNTRY_SERVICE_TIMEZONES[country];
  }
  return hqServiceTimezone || 'Asia/Seoul';
}

/** Map IANA TZ → country code label (KR/JP/US/CH/TH) */
export function timezoneCountryCode(timeZone: string): string {
  const tz = timeZone || 'Asia/Seoul';
  if (tz === 'Asia/Seoul') return 'KR';
  if (tz === 'Asia/Tokyo') return 'JP';
  if (tz === 'Asia/Shanghai' || tz === 'Asia/Hong_Kong') return 'CH';
  if (tz === 'Asia/Bangkok') return 'TH';
  if (tz.startsWith('America/')) return 'US';
  if (tz === 'UTC' || tz === 'Etc/UTC') return 'UTC';
  if (tz.startsWith('Europe/')) return 'EU';
  return tz.split('/').pop() || tz;
}

export function serviceCountryCode(
  country: ServiceCountryKey,
  serviceTimezone: string,
): string {
  if (country) return country;
  return timezoneCountryCode(serviceTimezone);
}

function uiDateLocaleTag(): string {
  if (typeof document === 'undefined') return 'ko-KR';
  const lang = document.documentElement.lang || 'ko';
  const map: Record<string, string> = {
    ko: 'ko-KR',
    ja: 'ja-JP',
    zh: 'zh-CN',
    th: 'th-TH',
    en: 'en-US',
  };
  return map[lang] ?? 'ko-KR';
}

/** Date+time in a timezone — style like `2026. 8. 27. 오후 5:31` (locale-aware) */
export function formatDateTimeInTimezone(
  dateIso: string | Date | null | undefined,
  timeZone: string,
  localeTag?: string,
): string {
  if (!dateIso) return '';
  const date = typeof dateIso === 'string' ? new Date(dateIso) : dateIso;
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(localeTag || uiDateLocaleTag(), {
      timeZone: timeZone || 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function formatDualTimezoneLine(
  dateIso: string | Date | null | undefined,
  countryCode: string,
  timeZone: string,
): string {
  const body = formatDateTimeInTimezone(dateIso, timeZone);
  if (!body) return '';
  return `${countryCode} ${body}`;
}

export function formatInTimezone(date: Date, timeZone: string, localeTag = 'sv-SE'): string {
  try {
    return new Intl.DateTimeFormat(localeTag, {
      timeZone: timeZone || 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }
}

export function readStoredServiceCountry(): ServiceCountryKey {
  if (typeof window === 'undefined') return '';
  try {
    const v = sessionStorage.getItem(SERVICE_COUNTRY_STORAGE_KEY) ?? '';
    if (v === 'KR' || v === 'JP' || v === 'US' || v === 'CH' || v === 'TH') return v;
  } catch {
    /* ignore */
  }
  return '';
}

export function writeStoredServiceCountry(country: ServiceCountryKey) {
  if (typeof window === 'undefined') return;
  try {
    if (!country) sessionStorage.removeItem(SERVICE_COUNTRY_STORAGE_KEY);
    else sessionStorage.setItem(SERVICE_COUNTRY_STORAGE_KEY, country);
  } catch {
    /* ignore */
  }
}
