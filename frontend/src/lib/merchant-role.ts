import type { User } from '@/lib/api';

export function isMerchantAdmin(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'CUSTOMER';
}

export function isMerchantOperator(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'CUSTOMER_OPERATOR';
}

export function isMerchantSide(user: Pick<User, 'role'> | null | undefined): boolean {
  return isMerchantAdmin(user) || isMerchantOperator(user);
}
