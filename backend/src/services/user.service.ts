import bcrypt from 'bcryptjs';
import { AdminChangeAction, CustomerType, OrgType, Prisma, UserManagementAction, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { initialPasswordFromEmail, normalizeEmail } from '../lib/password-policy';
import { clearUserTotp } from './otp.service';
import { getHqTransactionFees } from './transaction-fee.service';
import { getOrgSharePolicyCached } from './commission.service';
import { persistableCustomerFeeShare, normalizeCustomerFeeShare, assertOperatingSharePolicy } from '../constants/hq-policy';
import type { AuthUser } from '../types/auth';
import { logAdminChange, sanitizeUserSnapshot, type AuditContext } from './admin-change-log.service';
import { isHqChiefAdmin, isHqRootAdminEmail, isStaffManagerRole } from '../constants/hq-admin';
import { nextUserPurgeAt } from './deletion.service';

function requireOperatingShareTotals(raw: unknown, policy: Awaited<ReturnType<typeof getOrgSharePolicyCached>>) {
  try {
    assertOperatingSharePolicy(normalizeCustomerFeeShare(raw, policy));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
    const code = msg.startsWith('USDT_SHARE_MISMATCH') ? 'USDT_SHARE_MISMATCH' : 'ESCROW_SHARE_MISMATCH';
    throw new AppError(400, msg, code);
  }
}

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
      recruitingOrg: { select: { id: true, code: true, name: true, path: true } },
      feeShare: true,
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
    throw new AppError(403, 'ì¬ì©ì ê´ë¦¬ ê¶íì´ ììµëë¤', 'FORBIDDEN');
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
  throw new AppError(403, 'ì¡°ì§ ì ë³´ê° ìì´ ì¬ì©ìë¥¼ ì¡°íí  ì ììµëë¤', 'FORBIDDEN');
}

function assertTargetInScope(actor: AuthUser, target: {
  role?: UserRole;
  organization?: { path: string } | null;
  customerProfile?: { recruitingOrg: { path: string } } | null;
}): void {
  if (actor.role === UserRole.SUPER_ADMIN) return;
  if (target.role && target.role !== UserRole.CUSTOMER && isStaffManagerRole(actor.role)) return;
  const path = actor.organizationPath;
  if (!path) throw new AppError(403, 'ê¶íì´ ììµëë¤', 'FORBIDDEN');

  const orgPath = target.organization?.path;
  const recruitPath = target.customerProfile?.recruitingOrg?.path;
  const ok =
    (orgPath && orgPath.startsWith(path)) ||
    (recruitPath && recruitPath.startsWith(path));
  if (!ok) throw new AppError(403, 'í´ë¹ ì¬ì©ìì ì ê·¼í  ì ììµëë¤', 'FORBIDDEN');
}

function assertCanAssignRole(actor: AuthUser, role: UserRole): void {
  if (role === UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'ì´ê´ê´ë¦¬ìë ì¶ê°ë¡ ìì±í  ì ììµëë¤', 'FORBIDDEN');
  }
  if (role === UserRole.ORGANIZER) {
    if (!isHqChiefAdmin(actor)) {
      throw new AppError(403, 'Organizerë ì´ê´ê´ë¦¬ìë§ ë¶ì¬í  ì ììµëë¤', 'FORBIDDEN');
    }
    return;
  }
  if (role === UserRole.ORG_STAFF || role === UserRole.SETTLEMENT_ADMIN) {
    if (isStaffManagerRole(actor.role)) return;
    throw new AppError(403, 'ì´ ì­í ì ì¬ì©ìë¥¼ ìì±Â·ìì í  ê¶íì´ ììµëë¤', 'FORBIDDEN');
  }
  if (role === UserRole.CUSTOMER) {
    assertCanRegisterCustomer(actor);
    return;
  }
  throw new AppError(403, 'ì´ ì­í ì ì¬ì©ìë¥¼ ìì±Â·ìì í  ê¶íì´ ììµëë¤', 'FORBIDDEN');
}

async function assertStaffOrganization(role: UserRole, organizationId: string | undefined | null): Promise<void> {
  if (!organizationId) {
    throw new AppError(400, 'ìì ì¡°ì§ì´ íìí©ëë¤', 'VALIDATION');
  }
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
  });
  if (!org) throw new AppError(404, 'ì¡°ì§ì ì°¾ì ì ììµëë¤', 'NOT_FOUND');
  if (role === UserRole.ORGANIZER && org.type !== OrgType.HEAD_OFFICE) {
    throw new AppError(400, 'Organizerë ì´ë³¸ì¬ ì¡°ì§ìë§ ììë  ì ììµëë¤', 'VALIDATION');
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
  throw new AppError(403, 'ê³ ê° íìê°ìì ì´í ì´ì ì¡°ì§ë§ ì²ë¦¬í  ì ììµëë¤', 'FORBIDDEN');
}

async function assertOrgInScope(actor: AuthUser, organizationId: string | null | undefined): Promise<void> {
  if (!organizationId) return;
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new AppError(404, 'ì¡°ì§ì ì°¾ì ì ììµëë¤', 'NOT_FOUND');
  if (isStaffManagerRole(actor.role)) return;
  const path = actor.organizationPath;
  if (!path || !org.path.startsWith(path)) {
    throw new AppError(403, 'ìì ì¡°ì§ ë²ìë¥¼ ë²ì´ë¬ìµëë¤', 'FORBIDDEN');
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
    if (!user || user.deletedAt) throw new AppError(404, 'ì¬ì©ìë¥¼ ì°¾ì ì ììµëë¤', 'NOT_FOUND');
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
      simulatorEnabled?: boolean;
      simulatorRateMode?: 'LIVE' | 'SAND';
    },
    audit?: AuditContext,
  ) {
    assertCanManageUsers(actor);
    assertCanAssignRole(actor, data.role);
    const registerReason = assertReason(data.reason, 'ì¬ì©ì ë±ë¡ ì¬ì ê° íìí©ëë¤');

    const email = normalizeEmail(data.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'ì´ë¯¸ ë±ë¡ë ì´ë©ì¼ìëë¤', 'CONFLICT');

    if (data.role === UserRole.SUPER_ADMIN) {
      throw new AppError(403, 'ì´ê´ê´ë¦¬ìë ì¶ê°ë¡ ìì±í  ì ììµëë¤', 'FORBIDDEN');
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
        throw new AppError(400, 'ê³ ê°ì ì ì¹ ììì ì´ íìí©ëë¤', 'VALIDATION');
      }
      if (!data.bankName?.trim() || !data.accountNumber?.trim() || !data.accountHolder?.trim()) {
        throw new AppError(400, 'ìê¸ íµì¥ ì ë³´(ìíëªÂ·ê³ì¢ë²í¸Â·ìê¸ì£¼)ê° íìí©ëë¤', 'VALIDATION');
      }
      if (!data.walletAddress?.trim()) {
        throw new AppError(400, 'USDT ìë ¹ ì§ê° ì£¼ìê° íìí©ëë¤', 'VALIDATION');
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
              label: data.walletLabel?.trim() || 'Main USDT wallet',
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
        const { seedCustomerFeePolicies } = await import('./customer-fee-policy.service');
        await seedCustomerFeePolicies({
          customerProfileId: created.customerProfile.id,
          changedByUserId: actor.id,
        });
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
        summary: `ì¬ì©ì ë±ë¡: ${created.email} â ${registerReason} (ê´ë¦¬ì: ${audit.actor.email})`,
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
    },
    audit?: AuditContext,
  ) {
    assertCanManageUsers(actor);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing || existing.deletedAt) throw new AppError(404, 'ì¬ì©ìë¥¼ ì°¾ì ì ììµëë¤', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    if (isHqRootAdminEmail(existing.email) || existing.role === UserRole.SUPER_ADMIN) {
      if (data.role && data.role !== UserRole.SUPER_ADMIN) {
        throw new AppError(403, 'ì´ê´ê´ë¦¬ì ì­í ì ë³ê²½í  ì ììµëë¤', 'FORBIDDEN');
      }
      data.role = undefined;
    }

    if (data.role) assertCanAssignRole(actor, data.role);
    if (data.role === UserRole.SUPER_ADMIN) {
      throw new AppError(403, 'ì´ê´ê´ë¦¬ì ì­í ì ì§ì í  ì ììµëë¤', 'FORBIDDEN');
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
      throw new AppError(400, 'ì´ê´ê´ë¦¬ì ê³ì ì ë¹íì±íí  ì ììµëë¤', 'VALIDATION');
    }

    if (existing.role === UserRole.SUPER_ADMIN && data.isActive === false) {
      const activeAdmins = await prisma.user.count({
        where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null, id: { not: id } },
      });
      if (activeAdmins === 0) {
        throw new AppError(400, 'íì± ì´ë³¸ì¬ ê´ë¦¬ìê° ìµì 1ëª íìí©ëë¤', 'VALIDATION');
      }
    }

    const statusChanging =
      data.isActive !== undefined && data.isActive !== existing.isActive;
    let statusReason: string | undefined;
    if (statusChanging) {
      statusReason = assertReason(
        data.statusReason,
        data.isActive ? 'ê³ì  íì±í ì¬ì ê° íìí©ëë¤' : 'ê³ì  ë¹íì±í ì¬ì ê° íìí©ëë¤',
      );
    }

    const customerProfileUpdate: {
      recruitingOrgId?: string;
      simulatorEnabled?: boolean;
      simulatorRateMode?: 'LIVE' | 'SAND';
    } = {};
    if (data.recruitingOrgId && existing.customerProfile) {
      customerProfileUpdate.recruitingOrgId = data.recruitingOrgId;
    }
    // feeShare edits moved to customer fee management (/dashboard/customers/fees)
    if (data.simulatorEnabled !== undefined && existing.customerProfile) {
      customerProfileUpdate.simulatorEnabled = data.simulatorEnabled;
    }
    if (data.simulatorRateMode !== undefined && existing.customerProfile) {
      customerProfileUpdate.simulatorRateMode = data.simulatorRateMode;
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
        ? `ì¬ì©ì ${data.isActive ? 'íì±í' : 'ë¹íì±í'}: ${user.email} â ${statusReason} (ê´ë¦¬ì: ${audit.actor.email})`
        : `ì¬ì©ì ì ë³´ ìì : ${user.email} (ê´ë¦¬ì: ${audit.actor.email})`;
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
    if (!existing) throw new AppError(404, 'ì¬ì©ìë¥¼ ì°¾ì ì ììµëë¤', 'NOT_FOUND');
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
        summary: `ë¹ë°ë²í¸ ì´ê¸°í: ${existing.email} (ê´ë¦¬ì: ${audit.actor.email})`,
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
    if (!existing) throw new AppError(404, 'ì¬ì©ìë¥¼ ì°¾ì ì ììµëë¤', 'NOT_FOUND');
    assertTargetInScope(actor, existing);
    await clearUserTotp(id);

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.UPDATE,
        entityType: 'USER',
        entityId: existing.id,
        entityLabel: existing.email,
        summary: `OTP ì´ê¸°í: ${existing.email} (ê´ë¦¬ì: ${audit.actor.email})`,
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
    if (actor.id === id) throw new AppError(403, 'ë³¸ì¸ ê³ì ì ì­ì í  ì ììµëë¤', 'FORBIDDEN');

    const existing = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!existing || existing.deletedAt) throw new AppError(404, 'ì¬ì©ìë¥¼ ì°¾ì ì ììµëë¤', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    if (existing.isActive) {
      throw new AppError(400, 'ë¹íì± ì¬ì©ìë§ ì­ì í  ì ììµëë¤', 'VALIDATION');
    }
    if (existing.role === UserRole.SUPER_ADMIN || isHqRootAdminEmail(existing.email)) {
      throw new AppError(403, 'ì´ê´ê´ë¦¬ì ê³ì ì ì­ì í  ì ììµëë¤', 'FORBIDDEN');
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
      reason: 'ì­ì  ì²ë¦¬',
      changedById: actor.id,
    });

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.DELETE,
        entityType: 'USER',
        entityId: id,
        entityLabel: existing.email,
        summary: `ì¬ì©ì ì­ì  ì²ë¦¬: ${existing.email} (ê´ë¦¬ì: ${audit.actor.email})`,
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
    if (!existing) throw new AppError(404, 'ì¬ì©ìë¥¼ ì°¾ì ì ììµëë¤', 'NOT_FOUND');
    if (!existing.deletedAt) {
      throw new AppError(400, 'ì­ì  ì²ë¦¬ë ì¬ì©ìë§ ë³µìí  ì ììµëë¤', 'VALIDATION');
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
      reason: 'ì­ì  ì²ë¦¬ ë³µì',
      changedById: actor.id,
    });

    if (audit) {
      await logAdminChange({
        actor: audit.actor,
        action: AdminChangeAction.UPDATE,
        entityType: 'USER',
        entityId: id,
        entityLabel: existing.email,
        summary: `ì¬ì©ì ë³µì: ${existing.email} (ê´ë¦¬ì: ${audit.actor.email})`,
        before: sanitizeUserSnapshot(existing as unknown as Record<string, unknown>),
        after: sanitizeUserSnapshot(restored as unknown as Record<string, unknown>),
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return restored;
  },
};
