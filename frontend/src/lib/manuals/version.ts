/** TINPASS Crypto 라이브 버전 — 주요=정수.0, 소소=소수 (2.1, 2.2…) */
export const CURRENT_LIVE_VERSION = '2.0';

export type ReleaseKind = 'major' | 'minor';

export type ManualLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export type PlatformReleaseNote = {
  version: string;
  kind: ReleaseKind;
  date: string;
  items: Record<ManualLocale, string[]>;
};
