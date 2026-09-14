export const HQ_ROOT_ADMIN_EMAIL = 'ziobizm@gmail.com';

export function isHqRootAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === HQ_ROOT_ADMIN_EMAIL;
}

export function isHqChiefAdmin(actor: { role: string; email?: string | null }): boolean {
  return actor.role === 'SUPER_ADMIN' && isHqRootAdminEmail(actor.email);
}

export function isStaffManagerRole(role: string): boolean {
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ORG_STAFF' ||
    role === 'ORGANIZER' ||
    role === 'SETTLEMENT_ADMIN'
  );
}

export function isCostAnalysisRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ORGANIZER';
}

/** 민감작업 step-up OTP: 본사 분석 메뉴 + 가맹점 관리자(지갑·사용자관리) */
export function canIssueSensitiveOtp(role: string): boolean {
  return isCostAnalysisRole(role) || role === 'CUSTOMER';
}
