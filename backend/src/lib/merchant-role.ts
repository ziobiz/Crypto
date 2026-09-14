import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/auth';

export const MERCHANT_TRADE_ROLES: UserRole[] = [UserRole.CUSTOMER, UserRole.CUSTOMER_OPERATOR];

export function isMerchantAdmin(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === UserRole.CUSTOMER;
}

export function isMerchantOperator(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === UserRole.CUSTOMER_OPERATOR;
}

export function isMerchantSide(user: Pick<AuthUser, 'role'>): boolean {
  return isMerchantAdmin(user) || isMerchantOperator(user);
}

/** 티켓·프로필·지갑 스코프용 대표 가맹점 user id */
export function merchantScopeUserId(user: AuthUser): string {
  if (user.role === UserRole.CUSTOMER_OPERATOR && user.merchantAdminUserId) {
    return user.merchantAdminUserId;
  }
  return user.id;
}

export const MAX_ACTIVE_MERCHANT_OPERATORS = 2;
