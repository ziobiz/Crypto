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
import {
  HQ_PAGE_CATALOG,
  HQ_PERMISSION_LEVELS,
  type HqPermissionLevel,
} from '../constants/hq-policy';
import { hqPolicyService } from './hq-policy.service';
import { recordMerchantOperation } from './merchant-operation-log.service';

/** 가맹점 대표가 운영자에게 부여할 수 있는 페이지 (지갑·사용자관리는 하드락) */
export const MERCHANT_OPERATOR_PAGE_PATHS = [
  '/dashboard',
  '/dashboard/simulator',
  '/dashboard/usdt',
  '/dashboard/escrow',
  '/dashboard/kyc',
  '/dashboard/invoices/live',
  '/dashboard/invoices/simulator',
  '/dashboard/operation-history',
] as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function assertOwnedOperator(actor: AuthUser, operatorId: string) {
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
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      pageAccessOverrides: true,
    },
  });
  if (!op) throw new AppError(404, 'Operator not found', 'NOT_FOUND');
  return op;
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
      pageAccessOverrides: true,
    },
  });
  const activeCount = rows.filter((r) => r.isActive).length;
  return {
    operators: rows.map(({ pageAccessOverrides, ...r }) => ({
      ...r,
      hasOverrides: pageAccessOverrides != null,
    })),
    activeCount,
    maxActive: MAX_ACTIVE_MERCHANT_OPERATORS,
  };
}

export async function getOperatorPageAccess(actor: AuthUser, operatorId: string) {
  const op = await assertOwnedOperator(actor, operatorId);
  const pages = HQ_PAGE_CATALOG.filter((p) =>
    (MERCHANT_OPERATOR_PAGE_PATHS as readonly string[]).includes(p.path),
  );
  const base = await hqPolicyService.getPageAccessForUser({
    role: 'CUSTOMER_OPERATOR',
    organizationType: 'CUSTOMER',
    simulatorEnabled: true,
    operatorsEnabled: true,
    pageAccessOverrides: null,
  });
  const overrides = (op.pageAccessOverrides ?? null) as Record<string, HqPermissionLevel> | null;
  const effective = await hqPolicyService.getPageAccessForUser({
    role: 'CUSTOMER_OPERATOR',
    organizationType: 'CUSTOMER',
    simulatorEnabled: true,
    operatorsEnabled: true,
    pageAccessOverrides: overrides,
  });
  return {
    user: { id: op.id, email: op.email, name: op.name, role: op.role },
    pages,
    permissionLevels: HQ_PERMISSION_LEVELS,
    base: Object.fromEntries(pages.map((p) => [p.path, base[p.path] ?? 'NONE'])),
    overrides,
    effective: Object.fromEntries(pages.map((p) => [p.path, effective[p.path] ?? 'NONE'])),
  };
}

export async function saveOperatorPageAccess(
  actor: AuthUser,
  operatorId: string,
  overrides: Record<string, string> | null,
  meta?: { ipAddress?: string; userAgent?: string },
) {
  const op = await assertOwnedOperator(actor, operatorId);
  let value: Record<string, HqPermissionLevel> | null = null;
  if (overrides && typeof overrides === 'object') {
    value = {};
    for (const [path, raw] of Object.entries(overrides)) {
      if (!(MERCHANT_OPERATOR_PAGE_PATHS as readonly string[]).includes(path)) continue;
      if (!HQ_PERMISSION_LEVELS.includes(raw as HqPermissionLevel)) continue;
      value[path] = raw as HqPermissionLevel;
    }
    if (Object.keys(value).length === 0) value = null;
  }
  await prisma.user.update({
    where: { id: op.id },
    data: { pageAccessOverrides: value === null ? Prisma.DbNull : value },
  });
  await recordMerchantOperation({
    actorId: actor.id,
    merchantAdminUserId: actor.id,
    action: 'OPERATOR_PAGE_ACCESS',
    entityType: 'User',
    entityId: op.id,
    summary: `Update page access for ${op.email}`,
    after: (value ?? {}) as unknown as Prisma.InputJsonValue,
    otpVerified: true,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
  return getOperatorPageAccess(actor, operatorId);
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
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
  });
  if (existing) {
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
