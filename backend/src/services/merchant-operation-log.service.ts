import { Prisma, UserRole } from '@prisma/client';
import { AuthUser } from '../types/auth';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';

export async function recordMerchantOperation(input: {
  actorId: string;
  merchantAdminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  otpVerified?: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.merchantOperationLog.create({
    data: {
      actorId: input.actorId,
      merchantAdminUserId: input.merchantAdminUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      before: input.before ?? Prisma.JsonNull,
      after: input.after ?? Prisma.JsonNull,
      otpVerified: input.otpVerified ?? true,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function listMerchantOperationLogs(
  actor: AuthUser,
  opts?: { page?: number; pageSize?: number },
) {
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 50));
  const where: Prisma.MerchantOperationLogWhereInput =
    actor.role === UserRole.SUPER_ADMIN
      ? {}
      : isMerchantSide(actor)
        ? { merchantAdminUserId: merchantScopeUserId(actor) }
        : (() => {
            throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
          })();

  const [total, rows] = await Promise.all([
    prisma.merchantOperationLog.count({ where }),
    prisma.merchantOperationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { id: true, email: true, name: true, role: true } },
        merchantAdmin: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return { total, page, pageSize, rows };
}

export async function deleteMerchantOperationLog(actor: AuthUser, id: string) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'HQ admin only', 'FORBIDDEN');
  }
  const row = await prisma.merchantOperationLog.findUnique({ where: { id } });
  if (!row) throw new AppError(404, 'Log not found', 'NOT_FOUND');
  await prisma.merchantOperationLog.delete({ where: { id } });
  return { ok: true };
}
