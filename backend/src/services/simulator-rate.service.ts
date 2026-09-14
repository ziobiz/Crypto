import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import type { FeePolicyScope } from './transaction-fee.service';

export type SimulatorFeeMode = 'LIVE' | 'SAND';

export function isHqSimulatorAdmin(user: AuthUser): boolean {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  return user.role === UserRole.ORG_STAFF && user.organizationType === 'HEAD_OFFICE';
}

export function feePolicyFromMode(mode: SimulatorFeeMode): FeePolicyScope {
  return mode === 'SAND' ? 'sandbox' : 'live';
}

/** 고객·조직 설정 우선. 본사 관리자는 요청 mode(LIVE/SAND) 선택 가능 */
export async function resolveSimulatorFeeMode(
  user: AuthUser,
  requested?: string | null,
): Promise<SimulatorFeeMode> {
  const req = requested?.trim().toUpperCase();
  if (isHqSimulatorAdmin(user) && (req === 'LIVE' || req === 'SAND')) {
    return req;
  }

  if (user.role === UserRole.CUSTOMER || user.role === UserRole.CUSTOMER_OPERATOR) {
    const profile = await prisma.customerProfile.findUnique({
      where: {
        userId:
          user.role === UserRole.CUSTOMER_OPERATOR && user.merchantAdminUserId
            ? user.merchantAdminUserId
            : user.id,
      },
      select: { simulatorRateMode: true },
    });
    return profile?.simulatorRateMode === 'SAND' ? 'SAND' : 'LIVE';
  }

  if (user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { simulatorRateMode: true },
    });
    return org?.simulatorRateMode === 'SAND' ? 'SAND' : 'LIVE';
  }

  return 'LIVE';
}

/** 비본사 사용자가 허용되지 않은 mode를 요청하면 거부 */
export async function assertSimulatorFeeModeAllowed(
  user: AuthUser,
  requested?: string | null,
): Promise<SimulatorFeeMode> {
  const allowed = await resolveSimulatorFeeMode(user, null);
  const req = requested?.trim().toUpperCase();
  if (isHqSimulatorAdmin(user)) {
    return resolveSimulatorFeeMode(user, requested);
  }
  if (req && req !== allowed) {
    throw new AppError(403, 'Simulator fee mode not allowed', 'FORBIDDEN');
  }
  return allowed;
}
