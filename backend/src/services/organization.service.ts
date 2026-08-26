import { OrgType, Prisma, TicketType, UserRole } from '@prisma/client';
import { isStaffManagerRole } from '../constants/hq-admin';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { nextOrgPurgeAt } from './deletion.service';

const ORG_PREFIX: Record<OrgType, string> = {
  HEAD_OFFICE: 'HQ',
  MASTER_DISTRIBUTOR: 'MD',
  REGIONAL_BRANCH: 'RB',
  AGENCY: 'AG',
  SALES_OFFICE: 'SO',
};

const orgSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  path: true,
  parentId: true,
  isActive: true,
  deletedAt: true,
  purgeAt: true,
  createdAt: true,
  parent: { select: { id: true, code: true, name: true, type: true } },
} satisfies Prisma.OrganizationSelect;

export function allowedChildTypes(parentType: OrgType | null): OrgType[] {
  if (!parentType) return [OrgType.HEAD_OFFICE];
  switch (parentType) {
    case OrgType.HEAD_OFFICE:
      return [OrgType.HEAD_OFFICE, OrgType.MASTER_DISTRIBUTOR];
    case OrgType.MASTER_DISTRIBUTOR:
      return [OrgType.REGIONAL_BRANCH];
    case OrgType.REGIONAL_BRANCH:
      return [OrgType.AGENCY];
    case OrgType.AGENCY:
      return [OrgType.SALES_OFFICE];
    default:
      return [];
  }
}

function assertCanManageOrgs(actor: AuthUser): void {
  if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ORG_STAFF) {
    throw new AppError(403, '조직 관리 권한이 없습니다', 'FORBIDDEN');
  }
}

function assertCanListOrgs(actor: AuthUser): void {
  if (!isStaffManagerRole(actor.role)) {
    throw new AppError(403, '조직 조회 권한이 없습니다', 'FORBIDDEN');
  }
}

function listWhere(actor: AuthUser, includeInactive: boolean): Prisma.OrganizationWhereInput {
  const active = includeInactive ? {} : { isActive: true };
  const base: Prisma.OrganizationWhereInput = { deletedAt: null, ...active };
  if (isStaffManagerRole(actor.role) || !actor.organizationPath) {
    return base;
  }
  return { ...base, path: { startsWith: actor.organizationPath } };
}

async function nextCode(type: OrgType): Promise<string> {
  const prefix = ORG_PREFIX[type];
  const existing = await prisma.organization.findMany({
    where: { code: { startsWith: `${prefix}-` } },
    select: { code: true },
  });
  let max = 0;
  for (const row of existing) {
    const n = Number(row.code.slice(prefix.length + 1));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

async function assertParentAllowed(
  actor: AuthUser,
  type: OrgType,
  parentId: string | null | undefined,
) {
  if (!parentId) {
    if (type !== OrgType.HEAD_OFFICE) {
      throw new AppError(400, '상위 조직을 선택하세요', 'VALIDATION');
    }
    if (actor.role !== UserRole.SUPER_ADMIN) {
      throw new AppError(403, '최상위 본사는 총본사만 생성할 수 있습니다', 'FORBIDDEN');
    }
    return null;
  }

  const parent = await prisma.organization.findUnique({ where: { id: parentId } });
  if (!parent) throw new AppError(404, '상위 조직을 찾을 수 없습니다', 'NOT_FOUND');
  if (!parent.isActive || parent.deletedAt) throw new AppError(400, '비활성 상위 조직에는 하위 조직을 만들 수 없습니다', 'VALIDATION');

  if (actor.role !== UserRole.SUPER_ADMIN) {
    const path = actor.organizationPath;
    if (!path || !parent.path.startsWith(path)) {
      throw new AppError(403, '소속 조직 범위를 벗어났습니다', 'FORBIDDEN');
    }
  }

  const allowed = allowedChildTypes(parent.type);
  if (!allowed.includes(type)) {
    throw new AppError(400, '선택한 상위 조직 아래에 이 유형을 둘 수 없습니다', 'VALIDATION');
  }

  return parent;
}

async function seedCommissionRates(organizationId: string, parentId: string | null) {
  const parentRates = parentId
    ? await prisma.commissionRate.findMany({
        where: { organizationId: parentId, effectiveTo: null },
      })
    : [];
  const byType = new Map(parentRates.map((r) => [r.ticketType, r.ratePercent]));
  await prisma.commissionRate.createMany({
    data: [TicketType.USDT_PURCHASE, TicketType.TRADE_ESCROW].map((ticketType) => ({
      organizationId,
      ticketType,
      ratePercent: byType.get(ticketType) ?? 0,
      useDefault: !parentId || !byType.has(ticketType),
      perTicketUsdt: 0,
    })),
  });
}

export const organizationService = {
  async list(actor: AuthUser, includeInactive = false) {
    assertCanListOrgs(actor);
    return prisma.organization.findMany({
      where: listWhere(actor, includeInactive),
      select: orgSelect,
      orderBy: [{ path: 'asc' }],
    });
  },

  async create(
    actor: AuthUser,
    data: { name: string; type: OrgType; parentId?: string | null; code?: string },
  ) {
    assertCanManageOrgs(actor);
    const name = data.name.trim();
    if (!name) throw new AppError(400, '조직명을 입력하세요', 'VALIDATION');

    const parent = await assertParentAllowed(actor, data.type, data.parentId);
    const code = (data.code?.trim() || (await nextCode(data.type))).toUpperCase();
    const dup = await prisma.organization.findUnique({ where: { code } });
    if (dup) throw new AppError(409, '이미 사용 중인 조직 코드입니다', 'CONFLICT');

    const path = parent ? `${parent.path}/${code}` : `/${code}`;

    const created = await prisma.organization.create({
      data: {
        code,
        name,
        type: data.type,
        parentId: parent?.id ?? null,
        path,
      },
      select: orgSelect,
    });
    await seedCommissionRates(created.id, parent?.id ?? null);
    return created;
  },

  async update(
    actor: AuthUser,
    id: string,
    data: { name?: string; isActive?: boolean },
  ) {
    assertCanManageOrgs(actor);
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org || org.deletedAt) throw new AppError(404, '조직을 찾을 수 없습니다', 'NOT_FOUND');

    if (actor.role !== UserRole.SUPER_ADMIN) {
      const path = actor.organizationPath;
      if (!path || !org.path.startsWith(path)) {
        throw new AppError(403, '소속 조직 범위를 벗어났습니다', 'FORBIDDEN');
      }
      if (org.path === path && data.isActive === false) {
        throw new AppError(403, '본인 소속 조직은 비활성화할 수 없습니다', 'FORBIDDEN');
      }
    }

    const name = data.name?.trim();
    return prisma.organization.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: orgSelect,
    });
  },

  async softDelete(actor: AuthUser, id: string) {
    assertCanManageOrgs(actor);
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org || org.deletedAt) throw new AppError(404, '조직을 찾을 수 없습니다', 'NOT_FOUND');

    if (actor.role !== UserRole.SUPER_ADMIN) {
      const path = actor.organizationPath;
      if (!path || !org.path.startsWith(path)) {
        throw new AppError(403, '소속 조직 범위를 벗어났습니다', 'FORBIDDEN');
      }
      if (org.path === path) {
        throw new AppError(403, '본인 소속 조직은 삭제할 수 없습니다', 'FORBIDDEN');
      }
    }
    if (actor.organizationId === id) {
      throw new AppError(403, '본인 소속 조직은 삭제할 수 없습니다', 'FORBIDDEN');
    }

    const [childCount, userCount, customerCount] = await Promise.all([
      prisma.organization.count({ where: { parentId: id, deletedAt: null } }),
      prisma.user.count({ where: { organizationId: id, deletedAt: null } }),
      prisma.customerProfile.count({ where: { recruitingOrgId: id } }),
    ]);
    if (childCount > 0) {
      throw new AppError(409, '하위 조직이 있어 삭제할 수 없습니다', 'CONFLICT');
    }
    if (customerCount > 0) {
      throw new AppError(409, '연동된 고객이 있어 삭제할 수 없습니다', 'CONFLICT');
    }
    if (userCount > 0) {
      throw new AppError(409, '소속 사용자가 있어 삭제할 수 없습니다', 'CONFLICT');
    }

    const deletedAt = new Date();
    return prisma.organization.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt,
        purgeAt: await nextOrgPurgeAt(deletedAt),
      },
      select: orgSelect,
    });
  },

  async listDeleted() {
    return prisma.organization.findMany({
      where: { deletedAt: { not: null } },
      select: orgSelect,
      orderBy: { deletedAt: 'desc' },
    });
  },
};
