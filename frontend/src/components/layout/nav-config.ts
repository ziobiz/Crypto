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
  | 'ops'
  | 'wallets'
  | 'manuals'
  | 'kyc';

export type NavItem = {
  href: string;
  labelKey: MessageKey;
  shortKey?: MessageKey;
  icon: NavIconId;
  /** PG형 펼침 하위 메뉴 */
  children?: NavItem[];
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

const MERCHANT_USERS_ITEM: NavItem = {
  href: '/dashboard/merchant-users',
  labelKey: 'nav.merchantUsers',
  shortKey: 'nav.short.merchantUsers',
  icon: 'users',
};

const OPERATION_HISTORY_ITEM: NavItem = {
  href: '/dashboard/operation-history',
  labelKey: 'nav.operationHistory',
  shortKey: 'nav.short.operationHistory',
  icon: 'ledger',
};

const CUSTOMERS_ITEM: NavItem = {
  href: '/dashboard/customers',
  labelKey: 'nav.customers',
  shortKey: 'nav.short.customers',
  icon: 'kyc',
};

const CUSTOMER_FEES_ITEM: NavItem = {
  href: '/dashboard/customers/fees',
  labelKey: 'nav.customerFees',
  shortKey: 'nav.short.orgFees',
  icon: 'ledger',
};

const ORGS_ITEM: NavItem = {
  href: '/dashboard/organizations',
  labelKey: 'nav.orgs',
  shortKey: 'nav.short.orgs',
  icon: 'orgs',
};

const USERS_ITEM: NavItem = {
  href: '/dashboard/users',
  labelKey: 'nav.users',
  shortKey: 'nav.short.users',
  icon: 'users',
};

/** 좌측 「운영관리」펼침 — 고객·수수료·조직·사용자·기록 */
const OPS_CHILDREN: NavItem[] = [
  CUSTOMERS_ITEM,
  CUSTOMER_FEES_ITEM,
  ORGS_ITEM,
  USERS_ITEM,
  OPERATION_HISTORY_ITEM,
];

const OPS_ITEM: NavItem = {
  href: '/dashboard/ops',
  labelKey: 'nav.ops',
  shortKey: 'nav.short.ops',
  icon: 'ops',
  children: OPS_CHILDREN,
};

const OPS_CHILDREN_ORG: NavItem[] = [CUSTOMERS_ITEM, CUSTOMER_FEES_ITEM, ORGS_ITEM, USERS_ITEM];

const OPS_ITEM_ORG: NavItem = {
  href: '/dashboard/ops',
  labelKey: 'nav.ops',
  shortKey: 'nav.short.ops',
  icon: 'ops',
  children: OPS_CHILDREN_ORG,
};

const HQ_POLICY_CHILDREN: NavItem[] = [
  { href: '/dashboard/hq-policy/access', labelKey: 'hq.hub.access', icon: 'hq' },
  { href: '/dashboard/hq-policy/org-columns', labelKey: 'hq.hub.org', icon: 'orgs' },
  { href: '/dashboard/hq-policy/commission', labelKey: 'hq.hub.commission', icon: 'ledger' },
  { href: '/dashboard/hq-policy/platform', labelKey: 'hq.hub.platform', icon: 'hq' },
  { href: '/dashboard/hq-policy/ops', labelKey: 'hq.hub.ops', icon: 'hq' },
  { href: '/dashboard/hq-policy/deletion', labelKey: 'hq.hub.deletion', icon: 'hq' },
  SIMULATOR_ITEM,
  SIMULATOR_LOGS_ITEM,
  COST_ITEM,
  PROFIT_ITEM,
  MANUAL_ITEM,
];

const HQ_POLICY_ITEM: NavItem = {
  href: '/dashboard/hq-policy',
  labelKey: 'nav.hqPolicy',
  shortKey: 'nav.short.hq',
  icon: 'hq',
  children: HQ_POLICY_CHILDREN,
};

export const NAV_ITEMS: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    OPS_ITEM,
    HQ_POLICY_ITEM,
  ],
  ORG_STAFF: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    OPS_ITEM_ORG,
    SIMULATOR_LOGS_ITEM,
    MANUAL_ITEM,
  ],
  ORGANIZER: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    OPS_ITEM_ORG,
    SIMULATOR_LOGS_ITEM,
    COST_ITEM,
    PROFIT_ITEM,
    MANUAL_ITEM,
  ],
  SETTLEMENT_ADMIN: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    { href: '/dashboard/ledger', labelKey: 'nav.ledger', shortKey: 'nav.short.ledger', icon: 'ledger' },
    USERS_ITEM,
    MANUAL_ITEM,
  ],
  CUSTOMER: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/kyc', labelKey: 'nav.kyc', shortKey: 'nav.short.kyc', icon: 'kyc' },
    { href: '/dashboard/wallets', labelKey: 'nav.wallets', shortKey: 'nav.short.wallets', icon: 'wallets' },
    MERCHANT_USERS_ITEM,
    OPERATION_HISTORY_ITEM,
    MANUAL_ITEM,
  ],
  CUSTOMER_OPERATOR: [
    { href: '/dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.short.dashboard', icon: 'dashboard' },
    SIMULATOR_ITEM,
    { href: '/dashboard/usdt', labelKey: 'nav.usdt', shortKey: 'nav.short.usdt', icon: 'usdt' },
    { href: '/dashboard/escrow', labelKey: 'nav.escrow', shortKey: 'nav.short.escrow', icon: 'escrow' },
    { href: '/dashboard/kyc', labelKey: 'nav.kyc', shortKey: 'nav.short.kyc', icon: 'kyc' },
    OPERATION_HISTORY_ITEM,
    MANUAL_ITEM,
  ],
};

const HQ_POLICY_NAV_PATH = '/dashboard/hq-policy/access';

export function catalogPathForNav(href: string): string | null {
  if (href === '/dashboard/hq-policy') return HQ_POLICY_NAV_PATH;
  if (href === '/dashboard/ops' || href === '/dashboard/manuals' || href === '/dashboard/organizations') {
    return null;
  }
  return href;
}

function pathAllowed(href: string, pageAccess?: Record<string, string>): boolean {
  const path = catalogPathForNav(href);
  if (!path) return true;
  if (!pageAccess) return true;
  const level = pageAccess[path];
  if (level == null) return true;
  return level !== 'NONE';
}

export function filterNavByPageAccess(
  items: NavItem[],
  pageAccess?: Record<string, string>,
): NavItem[] {
  if (!pageAccess) return items;
  return items
    .map((item) => {
      if (!pathAllowed(item.href, pageAccess)) return null;
      if (!item.children?.length) return item;
      const children = item.children.filter((c) => pathAllowed(c.href, pageAccess));
      return { ...item, children: children.length ? children : undefined };
    })
    .filter((item): item is NavItem => item != null);
}

/** 경로 → 탭 라벨 (가장 긴 prefix 매칭, 자식 포함) */
export function resolveNavItem(pathname: string, items: NavItem[]): NavItem | undefined {
  const flat: NavItem[] = [];
  for (const item of items) {
    flat.push(item);
    if (item.children) flat.push(...item.children);
  }
  const sorted = [...flat].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function navItemHasActiveChild(item: NavItem, pathname: string): boolean {
  if (!item.children?.length) return false;
  return item.children.some((c) => navChildIsActive(pathname, c, item.children!));
}

/** 중첩 경로(예: /customers vs /customers/fees)에서 가장 긴 href만 활성 */
export function navChildIsActive(pathname: string, child: NavItem, siblings: NavItem[]): boolean {
  const matches = (c: NavItem) =>
    pathname === c.href || pathname.startsWith(`${c.href}/`);
  if (!matches(child)) return false;
  return !siblings.some(
    (s) => s.href !== child.href && s.href.length > child.href.length && matches(s),
  );
}
