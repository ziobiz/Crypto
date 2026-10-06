import type { CustomerType, UsdtPayMethodAccess } from '@prisma/client';

export type UsdtPayMethodKind = 'BANK' | 'REMITTANCE' | 'CARD';

/**
 * 고객별 결제수단 허용 여부.
 * FOLLOW_HQ: hqMethodAllowed(서비스관리 매트릭스)를 따름.
 *   hqMethodAllowed 미전달 시 레거시 폴백(기업=이체+송금, 개인=송금, 카드=허용).
 * ENABLED/DISABLED는 고객 강제. 통화·전역 카드 정책은 호출측 AND.
 */
export function isUsdtPayMethodAllowed(input: {
  mode: UsdtPayMethodAccess | null | undefined;
  method: UsdtPayMethodKind;
  customerType: CustomerType | string | null | undefined;
  /** 서비스관리 FOLLOW_HQ 결과 — 전달 시 하드코딩 대신 사용 */
  hqMethodAllowed?: boolean;
}): boolean {
  if (input.mode === 'ENABLED') return true;
  if (input.mode === 'DISABLED') return false;
  if (typeof input.hqMethodAllowed === 'boolean') return input.hqMethodAllowed;
  if (input.method === 'CARD') return true;
  const corporate = input.customerType === 'CORPORATE';
  if (corporate) return input.method === 'BANK' || input.method === 'REMITTANCE';
  return input.method === 'REMITTANCE';
}
