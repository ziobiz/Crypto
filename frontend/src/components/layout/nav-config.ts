import type { MessageKey } from '@/i18n/messages';

export type NavIconId = 'dashboard' | 'usdt' | 'escrow' | 'ledger' | 'users' | 'hq' | 'wallets';

export type NavItem = {
  href: string;
  labelKey: MessageKey;
  shortKey?: MessageKey;
  icon: NavIconId;
};

export const NAV_ITEMS: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users', icon: 'users' },
    { href: '/dashboard/hq-policy', labelKey: 'nav.hqPolicy', shortKey: 'nav.short.hq', icon: 'hq' },
  ],
  ORG_STAFF: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users', icon: 'users' },
  ],
  CUSTOMER: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/wallets', labelKey: 'nav.wallets', shortKey: 'nav.short.wallets', icon: 'wallets' },
  ],
};

/** 경로 → 탭 라벨 (가장 긴 prefix 매칭) */
export function resolveNavItem(pathname: string, items: NavItem[]): NavItem | undefined {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
