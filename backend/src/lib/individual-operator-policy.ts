import { CustomerType, UserRole } from '@prisma/client';
import { AppError } from './errors';
import { prisma } from './prisma';

/** 개인 고객은 멀티 사용자(운영자) 불가 — 바이오 단독 사용자 구조와 맞춤 */
export function assertCorporateForOperators(customerType: CustomerType | string | null | undefined) {
  if (String(customerType || '').toUpperCase() !== CustomerType.CORPORATE) {
    throw new AppError(
      403,
      'Operators are only available for corporate customers',
      'OPERATORS_INDIVIDUAL_FORBIDDEN',
    );
  }
}

export async function deactivateMerchantOperators(adminUserId: string) {
  await prisma.user.updateMany({
    where: { merchantAdminUserId: adminUserId, role: UserRole.CUSTOMER_OPERATOR, deletedAt: null },
    data: { isActive: false },
  });
}

/**
 * 개인↔법인 전환 / 개인 강제 시:
 * - 바이오 credential은 유지 (법인 기간 중지, 개인 복귀 시 재활성)
 * - 운영자는 중지 + operatorsEnabled OFF
 */
export async function enforceSoloUserOnIndividual(adminUserId: string) {
  await prisma.customerProfile.updateMany({
    where: { userId: adminUserId },
    data: { operatorsEnabled: false },
  });
  await deactivateMerchantOperators(adminUserId);
}
