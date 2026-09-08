import bcrypt from 'bcryptjs';
import { AdminChangeAction, CustomerType, OrgType, Prisma, UserManagementAction, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { initialPasswordFromEmail, normalizeEmail } from '../lib/password-policy';
import { clearUserTotp } from './otp.service';
import { getHqTransactionFees } from './transaction-fee.service';
import type { AuthUser } from '../types/auth';
import { logAdminChange, sanitizeUserSnapshot, type AuditContext } from './admin-change-log.service';
import { isHqChiefAdmin, isHqRootAdminEmail, isStaffManagerRole } from '../constants/hq-admin';
import { nextUserPurgeAt } from './deletion.service';

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
  deletedAt: true,
  registerReason: true,
  createdBy: { select: adminBriefSelect },
  organization: { select: { id: true, code: true, name: true, type: true, path: true } },
  customerProfile: {
    select: {
      id: true,
      customerType: true,
      businessName: true,
      simulatorEnabled: true,
      simulatorRateMode: true,
      feeBillingMethod: true,
      recruitingOrg: { select: { id: true, code: true, name: true, path: true } },
      feeShare: true,
      feePolicies: {
        select: {
          ticketKind: true,
          feeTypeCode: true,
          feeTypeName: true,
          applyStartDate: true,
        },
        orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
      },
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
  kyc: {
    select: { id: true, status: true, submittedAt: true, rejectReason: true },
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
  staffOnly?: boolean;
  kycStatus?: string;
};

function assertCanManageUsers(actor: AuthUser): void {
  if (!isStaffManagerRole(actor.role)) {
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

function listScope(actor: AuthUser, staffOnly?: boolean): Prisma.UserWhereInput {
  if (actor.role === UserRole.SUPER_ADMIN) return {};
  if (staffOnly && isStaffManagerRole(actor.role)) return {};
  if (actor.role === UserRole.ORGANIZER) return {};
  if ((actor.role === UserRole.ORG_STAFF || actor.role === UserRole.SETTLEMENT_ADMIN) && actor.organizationPath) {
    return orgSubtreeFilter(actor.organizationPath);
  }
  throw new AppError(403, '조직 정보가 없어 사용자를 조회할 수 없습니다', 'FORBIDDEN');
}

function assertTargetInScope(actor: AuthUser, target: {
  role?: UserRole;
  organization?: { path: string } | null;
  customerProfile?: { recruitingOrg: { path: string } } | null;
}): void {
  if (actor.role === UserRole.SUPER_ADMIN) return;
  if (target.role && target.role !== UserRole.CUSTOMER && isStaffManagerRole(actor.role)) return;
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
  if (role === UserRole.SUPER_ADMIN) {
    throw new AppError(403, '총괄관리자는 추가로 생성할 수 없습니다', 'FORBIDDEN');
  }
  if (role === UserRole.ORGANIZER) {
    if (!isHqChiefAdmin(actor)) {
      throw new AppError(403, 'Organizer는 총괄관리자만 부여할 수 있습니다', 'FORBIDDEN');
    }
    return;
  }
  if (role === UserRole.ORG_STAFF || role === UserRole.SETTLEMENT_ADMIN) {
    if (isStaffManagerRole(actor.role)) return;
    throw new AppError(403, '이 역할의 사용자를 생성·수정할 권한이 없습니다', 'FORBIDDEN');
  }
  if (role === UserRole.CUSTOMER) {
    assertCanRegisterCustomer(actor);
    return;
  }
  throw new AppError(403, '이 역할의 사용자를 생성·수정할 권한이 없습니다', 'FORBIDDEN');
}

async function assertStaffOrganization(role: UserRole, organizationId: string | undefined | null): Promise<void> {
  if (!organizationId) {
    throw new AppError(400, '소속 조직이 필요합니다', 'VALIDATION');
  }
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
  });
  if (!org) throw new AppError(404, '조직을 찾을 수 없습니다', 'NOT_FOUND');
  if (role === UserRole.ORGANIZER && org.type !== OrgType.HEAD_OFFICE) {
    throw new AppError(400, 'Organizer는 총본사 조직에만 소속될 수 있습니다', 'VALIDATION');
  }
}

function assertCanRegisterCustomer(actor: AuthUser): void {
  if (actor.role === UserRole.SUPER_ADMIN || actor.role === UserRole.ORGANIZER) return;
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
  if (isStaffManagerRole(actor.role)) return;
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

    const scope = listScope(actor, query.staffOnly);
    const and: Prisma.UserWhereInput[] = [{ deletedAt: null }];
    if (Object.keys(scope).length > 0) and.push(scope);

    if (query.staffOnly) {
      and.push({
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.ORGANIZER, UserRole.SETTLEMENT_ADMIN] },
      });
    }
    if (query.role) {
      and.push({ role: query.role });
    }
    if (query.kycStatus) {
      if (query.kycStatus === 'NOT_SUBMITTED') {
        and.push({
          OR: [{ kyc: { is: null } }, { kyc: { status: 'NOT_SUBMITTED' } }],
        });
      } else {
        and.push({ kyc: { status: query.kycStatus as never } });
      }
    }
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

    // 고객 목록: 정책 없을 때 기본 수수료유형 이름 표시용
    let defaultFeeTypeName: string | null = null;
    const needsDefault = items.some(
      (u) =>
        u.customerProfile &&
        (!u.customerProfile.feePolicies || u.customerProfile.feePolicies.length === 0),
    );
    if (needsDefault) {
      try {
        const { customerFeePolicyService } = await import('./customer-fee-policy.service');
        const usdtDef = await customerFeePolicyService.getDefaultFeeType('USDT_PURCHASE');
        const tradeDef = await customerFeePolicyService.getDefaultFeeType('TRADE_ESCROW');
        defaultFeeTypeName = usdtDef.name;
        // trade name stored separately via enriched policies below
        void tradeDef;
      } catch {
        defaultFeeTypeName = null;
      }
    }

    const enriched = items.map((u) => {
      if (!u.customerProfile || !defaultFeeTypeName) return u;
      if (u.customerProfile.feePolicies && u.customerProfile.feePolicies.length > 0) return u;
      return {
        ...u,
        customerProfile: {
          ...u.customerProfile,
          feePolicies: [
            {
              ticketKind: 'USDT_PURCHASE',
              feeTypeCode: 'DEFAULT',
              feeTypeName: defaultFeeTypeName,
              applyStartDate: new Date(0),
            },
            {
              ticketKind: 'TRADE_ESCROW',
              feeTypeCode: 'DEFAULT',
              feeTypeName: defaultFeeTypeName,
              applyStartDate: new Date(0),
            },
          ],
        },
      };
    });

    return { items: enriched, total, page, limit, pages: Math.ceil(total / limit) };
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
    if (!user || user.deletedAt) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
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
      feeShare?: unknown;
      usdtFeeTypeCode?: string;
      tradeFeeTypeCode?: string;
      simulatorEnabled?: boolean;
      simulatorRateMode?: 'LIVE' | 'SAND';
      feeBillingMethod?: 'FOLLOW_HQ' | 'INTEGRATED' | 'ITEMIZED' | 'HYBRID';
    },
    audit?: AuditContext,
  ) {
    assertCanManageUsers(actor);
    assertCanAssignRole(actor, data.role);
    const registerReason = assertReason(data.reason, '사용자 등록 사유가 필요합니다');

    const email = normalizeEmail(data.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, '이미 등록된 이메일입니다', 'CONFLICT');

    if (data.role === UserRole.SUPER_ADMIN) {
      throw new AppError(403, '총괄관리자는 추가로 생성할 수 없습니다', 'FORBIDDEN');
    }

    if (
      data.role === UserRole.ORG_STAFF ||
      data.role === UserRole.SETTLEMENT_ADMIN ||
      data.role === UserRole.ORGANIZER
    ) {
      await assertStaffOrganization(data.role, data.organizationId);
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
      const network = data.walletNetwork?.trim() || 'TRC20';
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
              simulatorEnabled: data.simulatorEnabled !== false,
              simulatorRateMode: data.simulatorRateMode ?? 'LIVE',
              feeBillingMethod: data.feeBillingMethod ?? 'FOLLOW_HQ',
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
              network,
              isDefault: true,
              fxFeePercent: hqFees.fxFeePercent,
              gasFeeAmount: 0,
              transferFeeAmount: hqFees.transferFeeUsdt,
              otherFeeAmount: hqFees.otherFeeUsdt,
            },
          },
        },
        select: userSelect,
      });
      if (created.customerProfile?.id) {
        const { customerFeePolicyService } = await import('./customer-fee-policy.service');
        await customerFeePolicyService.seedDefaultPoliciesForCustomer(
          created.customerProfile.id,
          actor.id,
          {
            usdtFeeTypeCode: data.usdtFeeTypeCode,
            tradeFeeTypeCode: data.tradeFeeTypeCode,
          },
        );
      }
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
      feeShare?: unknown;
      simulatorEnabled?: boolean;
      simulatorRateMode?: 'LIVE' | 'SAND';
      feeBillingMethod?: 'FOLLOW_HQ' | 'INTEGRATED' | 'ITEMIZED' | 'HYBRID';
    },
    audit?: AuditContext,
  ) {
    assertCanManageUsers(actor);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing || existing.deletedAt) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    if (isHqRootAdminEmail(existing.email) || existing.role === UserRole.SUPER_ADMIN) {
      if (data.role && data.role !== UserRole.SUPER_ADMIN) {
        throw new AppError(403, '총괄관리자 역할은 변경할 수 없습니다', 'FORBIDDEN');
      }
      data.role = undefined;
    }

    if (data.role) assertCanAssignRole(actor, data.role);
    if (data.role === UserRole.SUPER_ADMIN) {
      throw new AppError(403, '총괄관리자 역할은 지정할 수 없습니다', 'FORBIDDEN');
    }

    const nextRole = data.role ?? existing.role;
    if (
      nextRole === UserRole.ORG_STAFF ||
      nextRole === UserRole.SETTLEMENT_ADMIN ||
      nextRole === UserRole.ORGANIZER
    ) {
      const orgId = data.organizationId !== undefined ? data.organizationId : existing.organization?.id;
      await assertStaffOrganization(nextRole, orgId);
    }

    if (data.organizationId) await assertOrgInScope(actor, data.organizationId);
    if (data.recruitingOrgId) await assertOrgInScope(actor, data.recruitingOrgId);

    if (isHqRootAdminEmail(existing.email) && data.isActive === false) {
      throw new AppError(400, '총괄관리자 계정은 비활성화할 수 없습니다', 'VALIDATION');
    }

    if (existing.role === UserRole.SUPER_ADMIN && data.isActive === false) {
      const activeAdmins = await prisma.user.count({
        where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null, id: { not: id } },
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

    const customerProfileUpdate: {
      recruitingOrgId?: string;
      simulatorEnabled?: boolean;
      simulatorRateMode?: 'LIVE' | 'SAND';
      feeBillingMethod?: 'FOLLOW_HQ' | 'INTEGRATED' | 'ITEMIZED' | 'HYBRID';
    } = {};
    if (data.recruitingOrgId && existing.customerProfile) {
      customerProfileUpdate.recruitingOrgId = data.recruitingOrgId;
    }
    // feeShare 수정은 고객관리 > 수수료관리에서만 수행
    if (data.simulatorEnabled !== undefined && existing.customerProfile) {
      customerProfileUpdate.simulatorEnabled = data.simulatorEnabled;
    }
    if (data.simulatorRateMode !== undefined && existing.customerProfile) {
      customerProfileUpdate.simulatorRateMode = data.simulatorRateMode;
    }
    if (data.feeBillingMethod !== undefined && existing.customerProfile) {
      customerProfileUpdate.feeBillingMethod = data.feeBillingMethod;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        organizationId: data.role === UserRole.CUSTOMER ? null : data.organizationId,
        isActive: data.isActive,
        ...(Object.keys(customerProfileUpdate).length > 0
          ? { customerProfile: { update: customerProfileUpdate } }
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

  async softDelete(actor: AuthUser, id: string, audit?: AuditContext) {
    assertCanManageUsers(actor);
    if (actor.id === id) throw new AppError(403, '본인 계정은 삭제할 수 없습니다', 'FORBIDDEN');

    const existing = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing || existing.deletedAt) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    if (existing.isActive) {
      throw new AppError(400, '비활성 사용자만 삭제할 수 있습니다', 'VALIDATION');
    }
    if (existing.role === UserRole.SUPER_ADMIN || isHqRootAdminEmail(existing.email)) {
      throw new AppError(403, '총괄관리자 계정은 삭제할 수 없습니다', 'FORBIDDEN');
    }

    const deletedAt = new Date();
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt,
        purgeAt: await nextUserPurgeAt(deletedAt),
      },
      select: userSelect,
    });

    await logUserManagement({
      userId: id,
      action: UserManagementAction.DELETE,
      reason: '삭제 처리',
      changedById: actor.id,
    });

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.DELETE,
        entityType: 'USER',
        entityId: id,
        entityLabel: existing.email,
        summary: `사용자 삭제 처리: ${existing.email} (관리자: ${audit.actor.email})`,
        before: sanitizeUserSnapshot(existing as unknown as Record<string, unknown>),
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return updated;
  },

  async listDeleted() {
    return prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        deletedAt: true,
        purgeAt: true,
        organization: { select: { id: true, name: true, code: true, type: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
  },

  async restoreDeleted(actor: AuthUser, id: string, audit?: AuditContext) {
    assertCanManageUsers(actor);
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, deletedAt: true, purgeAt: true },
    });
    if (!existing) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    if (!existing.deletedAt) {
      throw new AppError(400, '삭제 처리된 사용자만 복원할 수 있습니다', 'VALIDATION');
    }

    const restored = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        purgeAt: null,
        isActive: false,
      },
      select: userSelect,
    });

    await logUserManagement({
      userId: id,
      action: UserManagementAction.ACTIVATE,
      reason: '삭제 처리 복원',
      changedById: actor.id,
    });

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.UPDATE,
        entityType: 'USER',
        entityId: id,
        entityLabel: existing.email,
        summary: `사용자 복원: ${existing.email} (관리자: ${audit.actor.email})`,
        before: sanitizeUserSnapshot(existing as unknown as Record<string, unknown>),
        after: sanitizeUserSnapshot(restored as unknown as Record<string, unknown>),
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return restored;
  },
};
