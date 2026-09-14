export function isKycApproved(user: { role?: string; kycStatus?: string } | null | undefined) {
  if (!user || (user.role !== 'CUSTOMER' && user.role !== 'CUSTOMER_OPERATOR')) return true;
  return user.kycStatus === 'APPROVED';
}
