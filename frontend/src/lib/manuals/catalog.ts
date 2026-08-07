import type { ManualLocale } from './version';
import { CURRENT_LIVE_VERSION } from './version';

export type ManualAudience = 'hq' | 'org' | 'customer';

export type ManualCatalogItem = {
  id: string;
  audience: ManualAudience;
  /** 문서 버전 (목록·뷰어·표지와 동일) */
  docVersion: string;
  titleKey: string;
};

/** 운영관리 > 이용메뉴얼 목록 — 로그인 역할(audience)에 따라 노출 */
export const MANUAL_CATALOG: ManualCatalogItem[] = [
  {
    id: 'hq-ops',
    audience: 'hq',
    docVersion: CURRENT_LIVE_VERSION,
    titleKey: 'manual.item.hqOps',
  },
  {
    id: 'org-ops',
    audience: 'org',
    docVersion: CURRENT_LIVE_VERSION,
    titleKey: 'manual.item.orgOps',
  },
  {
    id: 'customer',
    audience: 'customer',
    docVersion: CURRENT_LIVE_VERSION,
    titleKey: 'manual.item.customer',
  },
];

export type AppRole = 'SUPER_ADMIN' | 'ORG_STAFF' | 'CUSTOMER';

export function audiencesForRole(role: AppRole): ManualAudience[] {
  if (role === 'SUPER_ADMIN') return ['hq', 'org', 'customer'];
  if (role === 'ORG_STAFF') return ['org', 'customer'];
  return ['customer'];
}

export function manualsForRole(role: AppRole): ManualCatalogItem[] {
  const allowed = new Set(audiencesForRole(role));
  return MANUAL_CATALOG.filter((m) => allowed.has(m.audience));
}

export function localeFromApp(locale: string): ManualLocale {
  const u = String(locale || 'KR').toUpperCase();
  if (u === 'US' || u === 'EN') return 'US';
  if (u === 'JP' || u === 'JA') return 'JP';
  if (u === 'CH' || u === 'ZH') return 'CH';
  if (u === 'TH') return 'TH';
  return 'KR';
}
