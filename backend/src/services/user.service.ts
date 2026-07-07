import bcrypt from 'bcryptjs';
import { AdminChangeAction, CustomerType, OrgType, Prisma, UserManagementAction, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { initialPasswordFromEmail, normalizeEmail } from '../lib/password-policy';
import { clearUserTotp } from './otp.service';
import { getHqTransactionFees } from './transaction-fee.service';
import type { AuthUser } from '../types/auth';
import { logAdminChange, sanitizeUserSnapshot, type AuditContext } from './admin-change-log.service';

const CUSTOMER_REGISTER_ORG_TYPES: OrgType[] = [
  OrgType.HEAD_OFFICE,
  OrgType.MASTER_DISTRIBUTOR,
];

const adminBriefSelect = { id: true, email: true, name: true, role: true } satisfies Prisma.UserSelect;

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  totpEnabled: true,
  createdAt: true,
  registerReason: true,
  createdBy: { select: adminBriefSelect },
  organization: { select: { id: true, code: true, name: true, type: true, path: true } },
  customerProfile: {
    select: {
      id: true,
      customerType: true,
      businessName: true,
      recruitingOrg: { select: { id: true, code: true, name: true, path: true } },
    },
  },
  wallets: {
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    take: 1,
    select: { id: true, label: true, address: true, network: true, isDefault: true },
  },
  bankAccounts: {
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    take: 1,
    select: { id: true, bankName: true, accountNumber: true, accountHolder: true, isDefault: true },
  },
} satisfies Prisma.UserSelect;

const managementLogSelect = {
  id: true,
  action: true,
  reason: true,
  createdAt: true,
  changedBy: { select: adminBriefSelect },
} satisfies Prisma.UserManagementLogSelect;

async function logUserManagement(input: {
  userId: string;
  action: UserManagementAction;
  reason: string;
  changedById: string;
}) {
  await prisma.userManagementLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      reason: input.reason.trim(),
      changedById: input.changedById,
    },
  });
}

function assertReason(reason: string | undefined | null, message: string): string {
  const trimmed = reason?.trim();
  if (!trimmed) throw new AppError(400, message, 'VALIDATION');
  return trimmed;
}

export type UserListQuery = {
  role?: UserRole;
  organizationId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

function assertCanManageUsers(actor: AuthUser): void {
  if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ORG_STAFF) {
    throw new AppError(403, '사용자 관리 권한이 없습니다', 'FORBIDDEN');
  }
}

function orgSubtreeFilter(orgPath: string): Prisma.UserWhereInput {
  return {
    OR: [
      { organization: { path: { startsWith: orgPath } } },
      { customerProfile: { recruitingOrg: { path: { startsWith: orgPath } } } },
    ],
  };
}

function listScope(actor: AuthUser): Prisma.UserWhereInput {
  if (actor.role === UserRole.SUPER_ADMIN) return {};
  if (actor.role === UserRole.ORG_STAFF && actor.organizationPath) {
    return orgSubtreeFilter(actor.organizationPath);
  }
  throw new AppError(403, '조직 정보가 없어 사용자를 조회할 수 없습니다', 'FORBIDDEN');
}

function assertTargetInScope(actor: AuthUser, target: {
  organization?: { path: string } | null;
  customerProfile?: { recruitingOrg: { path: string } } | null;
}): void {
  if (actor.role === UserRole.SUPER_ADMIN) return;
  const path = actor.organizationPath;
  if (!path) throw new AppError(403, '권한이 없습니다', 'FORBIDDEN');

  const orgPath = target.organization?.path;
  const recruitPath = target.customerProfile?.recruitingOrg?.path;
  const ok =
    (orgPath && orgPath.startsWith(path)) ||
    (recruitPath && recruitPath.startsWith(path));
  if (!ok) throw new AppError(403, '해당 사용자에 접근할 수 없습니다', 'FORBIDDEN');
}

function assertCanAssignRole(actor: AuthUser, role: UserRole): void {
  if (actor.role === UserRole.SUPER_ADMIN) return;
  if (actor.role === UserRole.ORG_STAFF && role === UserRole.ORG_STAFF) return;
  if (actor.role === UserRole.ORG_STAFF && role === UserRole.CUSTOMER) {
    assertCanRegisterCustomer(actor);
    return;
  }
  throw new AppError(403, '이 역할의 사용자를 생성·수정할 권한이 없습니다', 'FORBIDDEN');
}

function assertCanRegisterCustomer(actor: AuthUser): void {
  if (actor.role === UserRole.SUPER_ADMIN) return;
  if (
    actor.role === UserRole.ORG_STAFF &&
    actor.organizationType &&
    CUSTOMER_REGISTER_ORG_TYPES.includes(actor.organizationType as OrgType)
  ) {
    return;
  }
  throw new AppError(403, '고객 회원가입은 총판 이상 조직만 처리할 수 있습니다', 'FORBIDDEN');
}

async function assertOrgInScope(actor: AuthUser, organizationId: string | null | undefined): Promise<void> {
  if (!organizationId) return;
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new AppError(404, '조직을 찾을 수 없습니다', 'NOT_FOUND');
  if (actor.role === UserRole.SUPER_ADMIN) return;
  const path = actor.organizationPath;
  if (!path || !org.path.startsWith(path)) {
    throw new AppError(403, '소속 조직 범위를 벗어났습니다', 'FORBIDDEN');
  }
}

export const userService = {
  async list(actor: AuthUser, query: UserListQuery) {
    assertCanManageUsers(actor);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const scope = listScope(actor);
    const and: Prisma.UserWhereInput[] = [];
    if (Object.keys(scope).length > 0) and.push(scope);

    if (query.role) and.push({ role: query.role });
    if (query.isActive !== undefined) and.push({ isActive: query.isActive });
    if (query.organizationId) {
      and.push({
        OR: [
          { organizationId: query.organizationId },
          { customerProfile: { recruitingOrgId: query.organizationId } },
        ],
      });
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      and.push({
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = and.length > 0 ? { AND: and } : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getById(actor: AuthUser, id: string) {
    assertCanManageUsers(actor);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        managementLogs: {
          select: managementLogSelect,
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });
    if (!user) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, user);
    return user;
  },

  async create(
    actor: AuthUser,
    data: {
      email: string;
      password?: string;
      name: string;
      phone?: string;
      role: UserRole;
      organizationId?: string;
      customerType?: CustomerType;
      recruitingOrgId?: string;
      businessName?: string;
      businessNumber?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
      walletAddress?: string;
      walletNetwork?: string;
      walletLabel?: string;
      reason: string;
    },
    audit?: AuditContext,
  ) {
    assertCanManageUsers(actor);
    assertCanAssignRole(actor, data.role);
    const registerReason = assertReason(data.reason, '사용자 등록 사유가 필요합니다');

    const email = normalizeEmail(data.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, '이미 등록된 이메일입니다', 'CONFLICT');

    if (data.role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, '총본사 관리자는 총본사만 생성할 수 있습니다', 'FORBIDDEN');
    }

    if (data.role === UserRole.ORG_STAFF) {
      if (!data.organizationId) {
        throw new AppError(400, '조직 직원은 소속 조직이 필요합니다', 'VALIDATION');
      }
      await assertOrgInScope(actor, data.organizationId);
    }

    if (data.role === UserRole.CUSTOMER) {
      assertCanRegisterCustomer(actor);
      if (!data.recruitingOrgId) {
        throw new AppError(400, '고객은 유치 영업점이 필요합니다', 'VALIDATION');
      }
      if (!data.bankName?.trim() || !data.accountNumber?.trim() || !data.accountHolder?.trim()) {
        throw new AppError(400, '입금 통장 정보(은행명·계좌번호·예금주)가 필요합니다', 'VALIDATION');
      }
      if (!data.walletAddress?.trim()) {
        throw new AppError(400, 'USDT 수령 지갑 주소가 필요합니다', 'VALIDATION');
      }
      await assertOrgInScope(actor, data.recruitingOrgId);
    }

    const plainPassword = data.password ?? initialPasswordFromEmail(email);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const mustChangePassword = !data.password;

    let created;
    if (data.role === UserRole.CUSTOMER) {
      const hqFees = await getHqTransactionFees();
      created = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: data.name,
          phone: data.phone,
          role: UserRole.CUSTOMER,
          passwordMustChange: mustChangePassword,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          createdById: actor.id,
          registerReason,
          customerProfile: {
            create: {
              customerType: data.customerType ?? CustomerType.INDIVIDUAL,
              recruitingOrgId: data.recruitingOrgId!,
              businessName: data.businessName,
              businessNumber: data.businessNumber,
            },
          },
          bankAccounts: {
            create: {
              currency: 'KRW',
              bankName: data.bankName!.trim(),
              accountNumber: data.accountNumber!.trim(),
              accountHolder: data.accountHolder!.trim(),
              isDefault: true,
            },
          },
          wallets: {
            create: {
              label: data.walletLabel?.trim() || '메인 USDT 지갑',
              address: data.walletAddress!.trim(),
              network: data.walletNetwork?.trim() || 'TRC20',
              isDefault: true,
              fxFeePercent: hqFees.fxFeePercent,
              gasFeeAmount: hqFees.gasFeeUsdt,
              transferFeeAmount: hqFees.transferFeeUsdt,
              otherFeeAmount: hqFees.otherFeeUsdt,
            },
          },
        },
        select: userSelect,
      });
    } else {
      created = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: data.name,
          phone: data.phone,
          role: data.role,
          organizationId: data.organizationId,
          passwordMustChange: mustChangePassword,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          createdById: actor.id,
          registerReason,
        },
        select: userSelect,
      });
    }

    await logUserManagement({
      userId: created.id,
      action: UserManagementAction.REGISTER,
      reason: registerReason,
      changedById: actor.id,
    });

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.CREATE,
        entityType: 'USER',
        entityId: created.id,
        entityLabel: created.email,
        summary: `사용자 등록: ${created.email} — ${registerReason} (관리자: ${audit.actor.email})`,
        after: { ...sanitizeUserSnapshot(created as unknown as Record<string, unknown>), reason: registerReason },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    const withLogs = await prisma.user.findUnique({
      where: { id: created.id },
      select: {
        ...userSelect,
        managementLogs: {
          select: managementLogSelect,
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    return withLogs ?? created;
  },

  async update(
    actor: AuthUser,
    id: string,
    data: {
      name?: string;
      phone?: string | null;
      role?: UserRole;
      organizationId?: string | null;
      isActive?: boolean;
      recruitingOrgId?: string;
      statusReason?: string;
    },
    audit?: AuditContext,
  ) {
    assertCanManageUsers(actor);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    if (data.role) assertCanAssignRole(actor, data.role);
    if (data.role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, '총본사 관리자 역할은 총본사만 지정할 수 있습니다', 'FORBIDDEN');
    }

    if (data.organizationId) await assertOrgInScope(actor, data.organizationId);
    if (data.recruitingOrgId) await assertOrgInScope(actor, data.recruitingOrgId);

    if (existing.role === UserRole.SUPER_ADMIN && data.isActive === false) {
      const activeAdmins = await prisma.user.count({
        where: { role: UserRole.SUPER_ADMIN, isActive: true, id: { not: id } },
      });
      if (activeAdmins === 0) {
        throw new AppError(400, '활성 총본사 관리자가 최소 1명 필요합니다', 'VALIDATION');
      }
    }

    const statusChanging =
      data.isActive !== undefined && data.isActive !== existing.isActive;
    let statusReason: string | undefined;
    if (statusChanging) {
      statusReason = assertReason(
        data.statusReason,
        data.isActive ? '계정 활성화 사유가 필요합니다' : '계정 비활성화 사유가 필요합니다',
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        organizationId: data.role === UserRole.CUSTOMER ? null : data.organizationId,
        isActive: data.isActive,
        ...(data.recruitingOrgId && existing.customerProfile
          ? {
              customerProfile: {
                update: { recruitingOrgId: data.recruitingOrgId },
              },
            }
          : {}),
      },
      select: userSelect,
    });

    if (statusChanging && statusReason) {
      await logUserManagement({
        userId: user.id,
        action: data.isActive ? UserManagementAction.ACTIVATE : UserManagementAction.DEACTIVATE,
        reason: statusReason,
        changedById: actor.id,
      });
    }

    if (audit) {
      const summary = statusChanging
        ? `사용자 ${data.isActive ? '활성화' : '비활성화'}: ${user.email} — ${statusReason} (관리자: ${audit.actor.email})`
        : `사용자 정보 수정: ${user.email} (관리자: ${audit.actor.email})`;
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.UPDATE,
        entityType: 'USER',
        entityId: user.id,
        entityLabel: user.email,
        summary,
        before: sanitizeUserSnapshot(existing as unknown as Record<string, unknown>),
        after: sanitizeUserSnapshot(user as unknown as Record<string, unknown>),
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    const withLogs = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ...userSelect,
        managementLogs: {
          select: managementLogSelect,
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    return withLogs ?? user;
  },

  async resetPassword(actor: AuthUser, id: string, password?: string, audit?: AuditContext) {
    assertCanManageUsers(actor);
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, organization: { select: { path: true } }, customerProfile: { select: { recruitingOrg: { select: { path: true } } } } },
    });
    if (!existing) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    const autoGenerated = !password?.trim();
    const plainPassword = autoGenerated
      ? initialPasswordFromEmail(existing.email)
      : password!.trim();
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordMustChange: autoGenerated,
      },
    });

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.UPDATE,
        entityType: 'USER',
        entityId: existing.id,
        entityLabel: existing.email,
        summary: `비밀번호 초기화: ${existing.email} (관리자: ${audit.actor.email})`,
        after: { passwordReset: true, autoGenerated },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return { ok: true, initialPassword: plainPassword };
  },

  async resetOtp(actor: AuthUser, id: string, audit?: AuditContext) {
    assertCanManageUsers(actor);
    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        totpEnabled: true,
        organization: { select: { path: true } },
        customerProfile: { select: { recruitingOrg: { select: { path: true } } } },
      },
    });
    if (!existing) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, existing);
    await clearUserTotp(id);

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.UPDATE,
        entityType: 'USER',
        entityId: existing.id,
        entityLabel: existing.email,
        summary: `OTP 초기화: ${existing.email} (관리자: ${audit.actor.email})`,
        before: { totpEnabled: existing.totpEnabled },
        after: { totpEnabled: false },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return { ok: true, totpEnabled: false };
  },
};
