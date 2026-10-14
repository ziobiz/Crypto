/** 가맹점(고객) vs 본사·조직 관리자 웹 호스트 분리 */

export function isMerchantRole(role: string | null | undefined): boolean {
  return role === 'CUSTOMER' || role === 'CUSTOMER_OPERATOR';
}

/** 본사·조직 직원 등 (가맹점 제외) */
export function isOrgStaffRole(role: string | null | undefined): boolean {
  return Boolean(role) && !isMerchantRole(role);
}

export function isAdminWebHost(hostname?: string): boolean {
  const h = (
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')
  ).toLowerCase();
  return h === 'admin.tinpass.com';
}

export function isMemberWebHost(hostname?: string): boolean {
  const h = (
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')
  ).toLowerCase();
  return h === 'tinpass.com' || h === 'www.tinpass.com';
}

/** 운영 도메인에서만 호스트 역할 분리 강제 (로컬은 단일 호스트 유지) */
export function shouldEnforceHostSplit(hostname?: string): boolean {
  return isAdminWebHost(hostname) || isMemberWebHost(hostname);
}

export function getAdminWebOrigin(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_WEB_URL || 'https://admin.tinpass.com').replace(
    /\/$/,
    '',
  );
}

export function getMemberWebOrigin(): string {
  return (process.env.NEXT_PUBLIC_MEMBER_WEB_URL || 'https://tinpass.com').replace(/\/$/, '');
}

/** sessionStorage는 서브도메인 비공유 → 해시로 일회성 토큰 전달 */
export function redirectWithAuthHandoff(
  targetOrigin: string,
  token: string,
  nextPath = '/dashboard',
) {
  if (typeof window === 'undefined') return;
  const next =
    nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard';
  const url = `${targetOrigin}/login?handoff=1&next=${encodeURIComponent(next)}#ht=${encodeURIComponent(token)}`;
  window.location.replace(url);
}
