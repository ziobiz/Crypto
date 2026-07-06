import bcrypt from 'bcryptjs';
import { CustomerType, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  organization: { select: { id: true, code: true, name: true, type: true, path: true } },
  customerProfile: {
    select: {
      id: true,
      customerType: true,
      businessName: true,
      recruitingOrg: { select: { id: true, code: true, name: true, path: true } },
    },
  },
} satisfies Prisma.UserSelect;

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
  throw new AppError(403, '이 역할의 사용자를 생성·수정할 권한이 없습니다', 'FORBIDDEN');
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
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, user);
    return user;
  },

  async create(
    actor: AuthUser,
    data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      role: UserRole;
      organizationId?: string;
      customerType?: CustomerType;
      recruitingOrgId?: string;
      businessName?: string;
      businessNumber?: string;
    },
  ) {
    assertCanManageUsers(actor);
    assertCanAssignRole(actor, data.role);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
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
      if (!data.recruitingOrgId) {
        throw new AppError(400, '고객은 유치 영업점이 필요합니다', 'VALIDATION');
      }
      await assertOrgInScope(actor, data.recruitingOrgId);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    if (data.role === UserRole.CUSTOMER) {
      return prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone,
          role: UserRole.CUSTOMER,
          customerProfile: {
            create: {
              customerType: data.customerType ?? CustomerType.INDIVIDUAL,
              recruitingOrgId: data.recruitingOrgId!,
              businessName: data.businessName,
              businessNumber: data.businessNumber,
            },
          },
        },
        select: userSelect,
      });
    }

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role,
        organizationId: data.organizationId,
      },
      select: userSelect,
    });
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
    },
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

    return user;
  },

  async resetPassword(actor: AuthUser, id: string, password: string) {
    assertCanManageUsers(actor);
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, organization: { select: { path: true } }, customerProfile: { select: { recruitingOrg: { select: { path: true } } } } },
    });
    if (!existing) throw new AppError(404, '사용자를 찾을 수 없습니다', 'NOT_FOUND');
    assertTargetInScope(actor, existing);

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    return { ok: true };
  },
};
