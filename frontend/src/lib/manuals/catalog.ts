import type { ManualLocale } from './version';
import { CURRENT_LIVE_VERSION } from './version';

export type ManualAudience = 'hq' | 'org' | 'customer';

export type CustomerTypeKey = 'INDIVIDUAL' | 'CORPORATE';

export type ManualCatalogItem = {
  id: string;
  audience: ManualAudience;
  /** 고객용 문서만 — 개인/기업 접근 구분. HQ·조직은 둘 다 열람 */
  customerType?: CustomerTypeKey;
  /** 문서 버전 (목록·뷰어·표지와 동일) */
  docVersion: string;
  titleKey: string;
};

/** 운영관리 > 이용메뉴얼 목록 — 로그인 역할·고객유형에 따라 노출 */
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
    id: 'customer-individual',
    audience: 'customer',
    customerType: 'INDIVIDUAL',
    docVersion: CURRENT_LIVE_VERSION,
    titleKey: 'manual.item.customerIndividual',
  },
  {
    id: 'customer-corporate',
    audience: 'customer',
    customerType: 'CORPORATE',
    docVersion: CURRENT_LIVE_VERSION,
    titleKey: 'manual.item.customerCorporate',
  },
];

export type AppRole =
  | 'SUPER_ADMIN'
  | 'ORG_STAFF'
  | 'CUSTOMER'
  | 'CUSTOMER_OPERATOR'
  | 'ORGANIZER'
  | 'SETTLEMENT_ADMIN';

export function audiencesForRole(role: AppRole): ManualAudience[] {
  if (role === 'SUPER_ADMIN' || role === 'ORGANIZER') return ['hq', 'org', 'customer'];
  if (role === 'ORG_STAFF' || role === 'SETTLEMENT_ADMIN') return ['org', 'customer'];
  return ['customer'];
}

function isStaffRole(role: AppRole): boolean {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ORGANIZER' ||
    role === 'ORG_STAFF' ||
    role === 'SETTLEMENT_ADMIN'
  );
}

export function manualsForRole(
  role: AppRole,
  opts?: { customerType?: string | null },
): ManualCatalogItem[] {
  const allowed = new Set(audiencesForRole(role));
  const staff = isStaffRole(role);
  const ct = String(opts?.customerType || 'INDIVIDUAL').toUpperCase() as CustomerTypeKey;

  return MANUAL_CATALOG.filter((m) => {
    if (!allowed.has(m.audience)) return false;
    if (m.audience !== 'customer' || !m.customerType) return true;
    if (staff) return true;
    return m.customerType === ct;
  });
}

export function localeFromApp(locale: string): ManualLocale {
  const u = String(locale || 'KR').toUpperCase();
  if (u === 'US' || u === 'EN') return 'US';
  if (u === 'JP' || u === 'JA') return 'JP';
  if (u === 'CH' || u === 'ZH') return 'CH';
  if (u === 'TH') return 'TH';
  return 'KR';
}
