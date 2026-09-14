import { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthUser } from '../types/auth';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { initialPasswordFromEmail } from '../lib/password-policy';
import {
  isMerchantAdmin,
  isMerchantSide,
  MAX_ACTIVE_MERCHANT_OPERATORS,
  merchantScopeUserId,
} from '../lib/merchant-role';
import { recordMerchantOperation } from './merchant-operation-log.service';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function listMerchantOperators(actor: AuthUser) {
  if (!isMerchantAdmin(actor)) {
    throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
  }
  if (!actor.operatorsEnabled) {
    throw new AppError(403, 'Multi-user is not enabled for this merchant', 'FORBIDDEN');
  }
  const rows = await prisma.user.findMany({
    where: {
      merchantAdminUserId: actor.id,
      role: UserRole.CUSTOMER_OPERATOR,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      isActive: true,
      totpEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  const activeCount = rows.filter((r) => r.isActive).length;
  return {
    operators: rows,
    activeCount,
    maxActive: MAX_ACTIVE_MERCHANT_OPERATORS,
  };
}

export async function createMerchantOperator(
  actor: AuthUser,
  input: { email: string; name: string; phone?: string },
  meta?: { ipAddress?: string; userAgent?: string },
) {
  if (!isMerchantAdmin(actor)) {
    throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
  }
  if (!actor.operatorsEnabled) {
    throw new AppError(403, 'Multi-user is not enabled for this merchant', 'FORBIDDEN');
  }
  if (!actor.customerProfileId) {
    throw new AppError(403, 'Customer profile required', 'FORBIDDEN');
  }

  const totalCount = await prisma.user.count({
    where: {
      merchantAdminUserId: actor.id,
      role: UserRole.CUSTOMER_OPERATOR,
      deletedAt: null,
    },
  });
  if (totalCount >= MAX_ACTIVE_MERCHANT_OPERATORS) {
    throw new AppError(
      400,
      `Operators limited to ${MAX_ACTIVE_MERCHANT_OPERATORS} (suspend instead of creating more)`,
      'OPERATOR_LIMIT',
    );
  }

  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) {
    throw new AppError(409, 'Email already registered', 'CONFLICT');
  }

  const initialPassword = initialPasswordFromEmail(email);
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  const created = await prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      role: UserRole.CUSTOMER_OPERATOR,
      passwordHash,
      passwordMustChange: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      merchantAdminUserId: actor.id,
      createdById: actor.id,
      registerReason: 'Merchant operator',
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      isActive: true,
      totpEnabled: true,
      createdAt: true,
    },
  });

  await recordMerchantOperation({
    actorId: actor.id,
    merchantAdminUserId: actor.id,
    action: 'OPERATOR_CREATE',
    entityType: 'User',
    entityId: created.id,
    summary: `Create operator ${created.email}`,
    after: created as unknown as Prisma.InputJsonValue,
    otpVerified: true,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return { operator: created, initialPasswordHint: 'emailLocalPart+1!' };
}

export async function deactivateMerchantOperator(
  actor: AuthUser,
  operatorId: string,
  meta?: { ipAddress?: string; userAgent?: string },
) {
  if (!isMerchantAdmin(actor)) {
    throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
  }
  if (!actor.operatorsEnabled) {
    throw new AppError(403, 'Multi-user is not enabled for this merchant', 'FORBIDDEN');
  }

  const op = await prisma.user.findFirst({
    where: {
      id: operatorId,
      merchantAdminUserId: actor.id,
      role: UserRole.CUSTOMER_OPERATOR,
      deletedAt: null,
    },
  });
  if (!op) throw new AppError(404, 'Operator not found', 'NOT_FOUND');
  if (!op.isActive) {
    return {
      id: op.id,
      email: op.email,
      name: op.name,
      isActive: false,
    };
  }

  const updated = await prisma.user.update({
    where: { id: op.id },
    data: { isActive: false },
    select: { id: true, email: true, name: true, isActive: true },
  });

  await recordMerchantOperation({
    actorId: actor.id,
    merchantAdminUserId: actor.id,
    action: 'OPERATOR_DEACTIVATE',
    entityType: 'User',
    entityId: updated.id,
    summary: `Deactivate operator ${updated.email}`,
    before: { isActive: true },
    after: { isActive: false },
    otpVerified: true,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return updated;
}

export async function activateMerchantOperator(
  actor: AuthUser,
  operatorId: string,
  meta?: { ipAddress?: string; userAgent?: string },
) {
  if (!isMerchantAdmin(actor)) {
    throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
  }
  if (!actor.operatorsEnabled) {
    throw new AppError(403, 'Multi-user is not enabled for this merchant', 'FORBIDDEN');
  }

  const activeCount = await prisma.user.count({
    where: {
      merchantAdminUserId: actor.id,
      role: UserRole.CUSTOMER_OPERATOR,
      isActive: true,
      deletedAt: null,
    },
  });
  if (activeCount >= MAX_ACTIVE_MERCHANT_OPERATORS) {
    throw new AppError(
      400,
      `Active operators limited to ${MAX_ACTIVE_MERCHANT_OPERATORS}`,
      'OPERATOR_LIMIT',
    );
  }

  const op = await prisma.user.findFirst({
    where: {
      id: operatorId,
      merchantAdminUserId: actor.id,
      role: UserRole.CUSTOMER_OPERATOR,
      deletedAt: null,
    },
  });
  if (!op) throw new AppError(404, 'Operator not found', 'NOT_FOUND');

  const updated = await prisma.user.update({
    where: { id: op.id },
    data: { isActive: true },
    select: { id: true, email: true, name: true, isActive: true },
  });

  await recordMerchantOperation({
    actorId: actor.id,
    merchantAdminUserId: actor.id,
    action: 'OPERATOR_ACTIVATE',
    entityType: 'User',
    entityId: updated.id,
    summary: `Activate operator ${updated.email}`,
    before: { isActive: false },
    after: { isActive: true },
    otpVerified: true,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return updated;
}

export function assertMerchantCanManageOperators(actor: AuthUser): void {
  if (!isMerchantAdmin(actor)) {
    throw new AppError(403, 'Merchant admin only', 'FORBIDDEN');
  }
}

export function merchantAdminIdOrSelf(actor: AuthUser): string {
  if (!isMerchantSide(actor)) {
    throw new AppError(403, 'Merchant only', 'FORBIDDEN');
  }
  return merchantScopeUserId(actor);
}
