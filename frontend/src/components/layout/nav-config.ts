import type { MessageKey } from '@/i18n/messages';

export type NavIconId =
  | 'dashboard'
  | 'simulator'
  | 'usdt'
  | 'escrow'
  | 'ledger'
  | 'users'
  | 'orgs'
  | 'hq'
  | 'wallets'
  | 'manuals'
  | 'kyc';

export type NavItem = {
  href: string;
  labelKey: MessageKey;
  shortKey?: MessageKey;
  icon: NavIconId;
};

const SIMULATOR_ITEM: NavItem = {
  href: '/dashboard/simulator',
  labelKey: 'nav.simulator',
  shortKey: 'nav.short.simulator',
  icon: 'simulator',
};

const SIMULATOR_LOGS_ITEM: NavItem = {
  href: '/dashboard/simulator-logs',
  labelKey: 'nav.simulatorLogs',
  shortKey: 'nav.short.simulatorLogs',
  icon: 'simulator',
};

const COST_ITEM: NavItem = {
  href: '/dashboard/hq-policy/cost-analysis',
  labelKey: 'nav.costAnalysis',
  shortKey: 'nav.short.costAnalysis',
  icon: 'hq',
};

const PROFIT_ITEM: NavItem = {
  href: '/dashboard/hq-policy/profit-analysis',
  labelKey: 'nav.profitAnalysis',
  shortKey: 'nav.short.profitAnalysis',
  icon: 'ledger',
};

/** 총본사: 본사정책 아래 / 고객: 내 지갑 아래 */
const MANUAL_ITEM: NavItem = {
  href: '/dashboard/manuals',
  labelKey: 'nav.manuals',
  shortKey: 'nav.short.manuals',
  icon: 'manuals',
};

export const NAV_ITEMS: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users', icon: 'users' },
    { href: '/dashboard/customers', labelKey: 'nav.customers', shortKey: 'nav.short.customers', icon: 'kyc' },
    { href: '/dashboard/organizations', labelKey: 'nav.orgs', shortKey: 'nav.short.orgs', icon: 'orgs' },
    { href: '/dashboard/hq-policy', labelKey: 'nav.hqPolicy', shortKey: 'nav.short.hq', icon: 'hq' },
    SIMULATOR_ITEM,
    SIMULATOR_LOGS_ITEM,
    COST_ITEM,
    PROFIT_ITEM,
    MANUAL_ITEM,
  ],
  ORG_STAFF: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users', icon: 'users' },
    { href: '/dashboard/customers', labelKey: 'nav.customers', shortKey: 'nav.short.customers', icon: 'kyc' },
    { href: '/dashboard/organizations', labelKey: 'nav.orgs', shortKey: 'nav.short.orgs', icon: 'orgs' },
    SIMULATOR_LOGS_ITEM,
    MANUAL_ITEM,
  ],
  ORGANIZER: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users', icon: 'users' },
    { href: '/dashboard/customers', labelKey: 'nav.customers', shortKey: 'nav.short.customers', icon: 'kyc' },
    { href: '/dashboard/organizations', labelKey: 'nav.orgs', shortKey: 'nav.short.orgs', icon: 'orgs' },
    SIMULATOR_LOGS_ITEM,
    COST_ITEM,
    PROFIT_ITEM,
    MANUAL_ITEM,
  ],
  SETTLEMENT_ADMIN: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    { href: '/dashboard/users', labelKey: 'nav.users', shortKey: 'nav.short.users', icon: 'users' },
    MANUAL_ITEM,
  ],
  CUSTOMER: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/kyc', labelKey: 'nav.kyc', shortKey: 'nav.short.kyc', icon: 'kyc' },
    { href: '/dashboard/wallets', labelKey: 'nav.wallets', shortKey: 'nav.short.wallets', icon: 'wallets' },
    MANUAL_ITEM,
  ],
};

const HQ_POLICY_NAV_PATH = '/dashboard/hq-policy/access';

export function catalogPathForNav(href: string): string | null {
  if (href === '/dashboard/hq-policy') return HQ_POLICY_NAV_PATH;
  if (href === '/dashboard/manuals' || href === '/dashboard/organizations') return null;
  return href;
}

export function filterNavByPageAccess(
  items: NavItem[],
  pageAccess?: Record<string, string>,
): NavItem[] {
  if (!pageAccess) return items;
  return items.filter((item) => {
    const path = catalogPathForNav(item.href);
    if (!path) return true;
    const level = pageAccess[path];
    if (level == null) return true;
    return level !== 'NONE';
  });
}

/** 경로 → 탭 라벨 (가장 긴 prefix 매칭) */
export function resolveNavItem(pathname: string, items: NavItem[]): NavItem | undefined {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
