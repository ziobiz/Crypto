import type { Locale } from '@/i18n/locales';

/** UI 언어에 맞춘 기본 국가번호 */
export const LOCALE_DEFAULT_PHONE_CODE: Record<Locale, string> = {
  KR: '+82',
  JP: '+81',
  US: '+1',
  CH: '+86',
  TH: '+66',
};

export function defaultPhoneCountryCode(locale: Locale): string {
  return LOCALE_DEFAULT_PHONE_CODE[locale] ?? '+82';
}
