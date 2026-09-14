import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { hqPolicyService } from './hq-policy.service';

/** 고객의 USDT 시뮬레이터 사용 가능 여부 — false면 본사 권한보다 우선 차단 */
export async function isCustomerSimulatorEnabled(userId: string): Promise<boolean> {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { simulatorEnabled: true },
  });
  if (!profile) return true;
  return profile.simulatorEnabled !== false;
}

async function isOrgSimulatorEnabled(organizationId: string | null | undefined): Promise<boolean> {
  if (!organizationId) return true;
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { simulatorEnabled: true },
  });
  if (!org) return true;
  return org.simulatorEnabled !== false;
}

/**
 * CUSTOMER: 고객별 simulatorEnabled가 false면 차단(본사 매트릭스보다 우선).
 * ORG_STAFF: 소속 조직 simulatorEnabled가 false면 차단.
 * 그 외 역할: 본사 권한 매트릭스의 /dashboard/simulator VIEW.
 * HQ 기록 시뮬레이터(/dashboard/simulator-logs)는 이 함수를 쓰지 않음.
 */
export async function assertCanUseUsdtSimulator(user: AuthUser): Promise<void> {
  if (user.role === UserRole.CUSTOMER || user.role === UserRole.CUSTOMER_OPERATOR) {
    const enabled = await isCustomerSimulatorEnabled(
      user.role === UserRole.CUSTOMER_OPERATOR && user.merchantAdminUserId
        ? user.merchantAdminUserId
        : user.id,
    );
    if (!enabled) {
      throw new AppError(403, 'Simulator is disabled for this customer', 'SIMULATOR_DISABLED');
    }
  } else if (user.role === UserRole.ORG_STAFF) {
    const enabled = await isOrgSimulatorEnabled(user.organizationId);
    if (!enabled) {
      throw new AppError(403, 'Simulator is disabled for this organization', 'SIMULATOR_DISABLED');
    }
  }
  const actor = hqPolicyService.accessActorForUser(user);
  const allowed = await hqPolicyService.canAccessPage(actor, '/dashboard/simulator', 'VIEW');
  if (!allowed) {
    throw new AppError(403, 'Simulator is not enabled for this account', 'FORBIDDEN');
  }
}
