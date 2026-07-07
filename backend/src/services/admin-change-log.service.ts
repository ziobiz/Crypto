import { AdminChangeAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AUTO_RELEASE_ENTITY_TYPES } from '../constants/platform-release-i18n';
import type { AuthUser } from '../types/auth';

export type ChangeLogActor = Pick<AuthUser, 'id' | 'email' | 'name' | 'role'>;

export type AuditContext = {
  actor: ChangeLogActor;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAdminChange(input: {
  actor: ChangeLogActor;
  action: AdminChangeAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.adminChangeLog.create({
    data: {
      changedById: input.actor.id,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,
      summary: input.summary,
      before: input.before != null ? (input.before as Prisma.InputJsonValue) : undefined,
      after: input.after != null ? (input.after as Prisma.InputJsonValue) : undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });

  if (
    input.entityType !== 'PLATFORM_RELEASE' &&
    AUTO_RELEASE_ENTITY_TYPES.has(input.entityType)
  ) {
    try {
      const { recordAutoPlatformRelease } = await import('./auto-platform-release.service');
      await recordAutoPlatformRelease({
        actor: input.actor,
        entityType: input.entityType,
        action: input.action,
        entityLabel: input.entityLabel,
        summary: input.summary,
      });
    } catch (err) {
      console.error('[auto-release] failed:', err);
    }
  }
}

export function auditFromRequest(
  actor: AuthUser,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> },
): AuditContext {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
    req?.ip ||
    undefined;
  const ua = req?.headers?.['user-agent'];
  return {
    actor: { id: actor.id, email: actor.email, name: actor.name, role: actor.role },
    ipAddress: ip,
    userAgent: typeof ua === 'string' ? ua : undefined,
  };
}

export function sanitizeUserSnapshot(user: Record<string, unknown> | null | undefined) {
  if (!user) return null;
  const { passwordHash, totpSecret, ...safe } = user;
  void passwordHash;
  void totpSecret;
  return safe;
}

export async function listAdminChangeLogs(query: {
  page?: number;
  limit?: number;
  entityType?: string;
  changedById?: string;
  search?: string;
  from?: string;
  to?: string;
}) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 30));
  const skip = (page - 1) * limit;

  const and: Prisma.AdminChangeLogWhereInput[] = [];
  if (query.entityType) and.push({ entityType: query.entityType });
  if (query.changedById) and.push({ changedById: query.changedById });
  if (query.from) and.push({ createdAt: { gte: new Date(query.from) } });
  if (query.to) and.push({ createdAt: { lte: new Date(query.to) } });
  if (query.search?.trim()) {
    const q = query.search.trim();
    and.push({
      OR: [
        { summary: { contains: q, mode: 'insensitive' } },
        { entityLabel: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { changedBy: { email: { contains: q, mode: 'insensitive' } } },
        { changedBy: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.AdminChangeLogWhereInput = and.length ? { AND: and } : {};

  const [items, total] = await Promise.all([
    prisma.adminChangeLog.findMany({
      where,
      include: {
        changedBy: { select: { id: true, email: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.adminChangeLog.count({ where }),
  ]);

  return {
    items: items.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      entityLabel: row.entityLabel,
      summary: row.summary,
      before: row.before,
      after: row.after,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
      changedBy: row.changedBy,
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
