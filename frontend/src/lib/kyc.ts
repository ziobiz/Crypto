export function isKycApproved(user: { role?: string; kycStatus?: string } | null | undefined) {
  if (!user || user.role !== 'CUSTOMER') return true;
  return user.kycStatus === 'APPROVED';
}
