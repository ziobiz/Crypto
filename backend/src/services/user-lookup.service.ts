import bcrypt from 'bcryptjs';
import { CustomerType, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalizeEmail } from '../lib/password-policy';

const loginInclude = {
  organization: { select: { id: true, name: true, type: true, path: true } },
  customerProfile: { select: { id: true, customerType: true } },
} as const;

export function isMerchantLoginRole(role: UserRole): boolean {
  return role === UserRole.CUSTOMER || role === UserRole.CUSTOMER_OPERATOR;
}

export function isOrgStaffLoginRole(role: UserRole): boolean {
  return !isMerchantLoginRole(role);
}

/** 가맹점(고객·운영자)의 기업/개인 유형. 운영자는 대표(merchantAdmin) 유형을 따름. */
export async function resolveLoginCustomerType(user: {
  id: string;
  role: UserRole;
  merchantAdminUserId?: string | null;
  customerProfile?: { customerType: CustomerType | string } | null;
}): Promise<CustomerType | null> {
  if (user.customerProfile?.customerType) {
    return user.customerProfile.customerType as CustomerType;
  }
  if (user.role === UserRole.CUSTOMER_OPERATOR && user.merchantAdminUserId) {
    const admin = await prisma.user.findUnique({
      where: { id: user.merchantAdminUserId },
      include: { customerProfile: { select: { customerType: true } } },
    });
    return (admin?.customerProfile?.customerType as CustomerType) ?? null;
  }
  return null;
}

/**
 * 공개 비밀번호/OTP 초기화는 개인 고객만.
 * 기업·운영자·본사/조직 직원은 공개 복구 불가 (기업 대표는 본사만 초기화).
 */
export function isPublicAccountRecoveryEligible(user: {
  role: UserRole;
  customerProfile?: { customerType: CustomerType | string } | null;
}): boolean {
  if (user.role !== UserRole.CUSTOMER) return false;
  return String(user.customerProfile?.customerType || '').toUpperCase() === CustomerType.INDIVIDUAL;
}

export async function findUsersByLoginEmail(email: string) {
  const normalized = normalizeEmail(email);

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: { equals: normalized, mode: 'insensitive' },
    },
    include: loginInclude,
  });

  for (const user of users) {
    if (user.email !== normalized) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: normalized },
      });
      user.email = normalized;
    }
  }

  return users;
}

/** 단일 조회 API용 — 여러 계정이면 개인고객 우선 */
export async function findUserByLoginEmail(email: string) {
  const users = await findUsersByLoginEmail(email);
  if (users.length === 0) return null;
  if (users.length === 1) return users[0]!;
  const individual = users.find(
    (u) => u.customerProfile?.customerType === CustomerType.INDIVIDUAL,
  );
  return individual ?? users[0]!;
}

/** 로그인 — 비밀번호가 일치하는 모든 계정 */
export async function findUsersMatchingLoginPassword(email: string, password: string) {
  const users = await findUsersByLoginEmail(email);
  const matched = [];
  for (const user of users) {
    if (await bcrypt.compare(password, user.passwordHash)) {
      matched.push(user);
    }
  }
  return matched;
}

/**
 * 로그인 — 비밀번호가 일치하는 계정 선택.
 * preferredCustomerType이 있으면 해당 유형 우선, 없으면 개인 우선.
 */
export async function findUserByLoginEmailAndPassword(
  email: string,
  password: string,
  preferredCustomerType?: CustomerType | null,
) {
  const matched = await findUsersMatchingLoginPassword(email, password);
  if (matched.length === 0) return null;
  if (matched.length === 1) return matched[0]!;
  if (preferredCustomerType) {
    const preferred = matched.find(
      (u) => u.customerProfile?.customerType === preferredCustomerType,
    );
    if (preferred) return preferred;
  }
  const individual = matched.find(
    (u) => u.customerProfile?.customerType === CustomerType.INDIVIDUAL,
  );
  return individual ?? matched[0]!;
}
