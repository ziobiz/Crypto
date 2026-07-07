import type { MessageKey } from '@/i18n/messages';

type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export type SessionOrgRef = {
  name: string;
  type?: string;
  code?: string;
} | null | undefined;

export type SessionUserRef = {
  name: string;
  role: string;
  organization?: SessionOrgRef;
};

const SYSTEM_USER_NAMES: Record<string, MessageKey> = {
  '총본사 관리자': 'role.SUPER_ADMIN',
  '영업점 직원': 'role.ORG_STAFF',
};

function roleKey(role: string): MessageKey {
  return `role.${role}` as MessageKey;
}

export function sessionRoleKey(role: string): MessageKey {
  if (role === 'SUPER_ADMIN') return 'session.roleAdmin';
  if (role === 'ORG_STAFF') return 'session.roleStaff';
  return 'session.roleCustomer';
}

/** Shell header — org label follows locale (system HQ vs custom org name). */
export function resolveOrgDisplayName(
  org: SessionOrgRef,
  t: TFn,
  role?: string,
): string {
  if (!org) return '';
  if (role === 'SUPER_ADMIN' && org.type === 'HEAD_OFFICE') {
    return t('org.rootHq');
  }
  return org.name;
}

/** Shell user menu — translate seeded/system display names; keep real person names. */
export function resolveUserDisplayName(user: SessionUserRef, t: TFn): string {
  const systemKey = SYSTEM_USER_NAMES[user.name];
  if (systemKey) return t(systemKey);
  if (user.role === 'SUPER_ADMIN') return t(roleKey(user.role));
  return user.name;
}
