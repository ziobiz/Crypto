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
