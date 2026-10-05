import type { CustomerType, UsdtPayMethodAccess } from '@prisma/client';

export type UsdtPayMethodKind = 'BANK' | 'REMITTANCE' | 'CARD';

/**
 * 고객별 결제수단 허용 여부.
 * FOLLOW_HQ 기본: 기업=이체+송금, 개인=송금만. 카드는 본사 정책에 맡김(차단하지 않음).
 * ENABLED/DISABLED는 고객 강제. 본사에서 끈 수단은 호출측에서 AND로 막는다.
 */
export function isUsdtPayMethodAllowed(input: {
  mode: UsdtPayMethodAccess | null | undefined;
  method: UsdtPayMethodKind;
  customerType: CustomerType | string | null | undefined;
}): boolean {
  if (input.mode === 'ENABLED') return true;
  if (input.mode === 'DISABLED') return false;
  if (input.method === 'CARD') return true;
  const corporate = input.customerType === 'CORPORATE';
  if (corporate) return input.method === 'BANK' || input.method === 'REMITTANCE';
  return input.method === 'REMITTANCE';
}
