import type { MessageKey } from '@/i18n/messages';

export type NavItem = { href: string; labelKey: MessageKey; shortKey?: MessageKey };

export const NAV_ITEMS: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users' },
    { href: '/dashboard/hq-policy', labelKey: 'nav.hqPolicy', shortKey: 'nav.short.hq' },
  ],
  ORG_STAFF: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users' },
  ],
  CUSTOMER: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow' },
    { href: '/dashboard/wallets', labelKey: 'nav.wallets', shortKey: 'nav.short.wallets' },
  ],
};
