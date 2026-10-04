import { CustomerApprovalStatus, CustomerType, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';

export type TradeAccess = 'FULL' | 'VIEW_ONLY';

export async function getCustomerTradeAccess(user: AuthUser): Promise<{
  tradeAccess: TradeAccess;
  approvalStatus: CustomerApprovalStatus | null;
  customerType: CustomerType | null;
}> {
  if (!isMerchantSide(user)) {
    return { tradeAccess: 'FULL', approvalStatus: null, customerType: null };
  }
  const scopeId = merchantScopeUserId(user);
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: scopeId },
    select: { approvalStatus: true, customerType: true },
  });
  if (!profile) {
    return { tradeAccess: 'VIEW_ONLY', approvalStatus: null, customerType: null };
  }
  const approved = profile.approvalStatus === CustomerApprovalStatus.APPROVED;
  return {
    tradeAccess: approved ? 'FULL' : 'VIEW_ONLY',
    approvalStatus: profile.approvalStatus,
    customerType: profile.customerType,
  };
}

/** USDT/에스크로 신청·상태변경 등 실행 전 호출 */
export async function assertCustomerTradeAllowed(user: AuthUser): Promise<void> {
  if (
    user.role !== UserRole.CUSTOMER &&
    user.role !== UserRole.CUSTOMER_OPERATOR
  ) {
    return;
  }
  const { tradeAccess, approvalStatus } = await getCustomerTradeAccess(user);
  if (tradeAccess === 'FULL') return;
  if (approvalStatus === CustomerApprovalStatus.REJECTED) {
    throw new AppError(403, 'Account registration was rejected', 'CUSTOMER_REJECTED');
  }
  throw new AppError(
    403,
    'Account pending admin approval — view only',
    'CUSTOMER_PENDING_APPROVAL',
  );
}
