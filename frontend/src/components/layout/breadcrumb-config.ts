import type { MessageKey } from '@/i18n/messages';

export type BreadcrumbCrumb = {
  labelKey: MessageKey;
  href: string;
};

export type PageMeta = {
  titleKey: MessageKey;
  /** Linkable ancestor crumbs (current page title is separate, not linked). */
  trail: BreadcrumbCrumb[];
};

type RouteRule = {
  test: (pathname: string) => boolean;
  meta: PageMeta;
};

const D = {
  dashboard: '/dashboard',
  hq: '/dashboard/hq-policy/access',
  hqOps: '/dashboard/hq-policy/ops',
  hqOrg: '/dashboard/hq-policy/org-columns',
  usdt: '/dashboard/usdt',
  escrow: '/dashboard/escrow',
  customers: '/dashboard/customers',
  kyc: '/dashboard/kyc',
} as const;

const RULES: RouteRule[] = [
  { test: (p) => p === '/dashboard', meta: { titleKey: 'nav.dashboard', trail: [] } },
  {
    test: (p) => p.startsWith('/dashboard/simulator-logs'),
    meta: { titleKey: 'nav.simulatorLogs', trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }] },
  },
  { test: (p) => p.startsWith('/dashboard/simulator'), meta: { titleKey: 'nav.simulator', trail: [] } },
  { test: (p) => p.startsWith('/dashboard/manuals'), meta: { titleKey: 'nav.manuals', trail: [] } },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/ops/updates'),
    meta: {
      titleKey: 'hq.ops.updatesContent',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.ops', href: D.hqOps },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/ops/release-history'),
    meta: {
      titleKey: 'hq.ops.releaseHistory',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.ops', href: D.hqOps },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/ops/workflow'),
    meta: {
      titleKey: 'hq.ops.workflow',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.ops', href: D.hqOps },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/ops/payment'),
    meta: {
      titleKey: 'hq.ops.paymentManagement',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.ops', href: D.hqOps },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/ops/change-history'),
    meta: {
      titleKey: 'hq.ops.changeHistory',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.ops', href: D.hqOps },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/ops'),
    meta: {
      titleKey: 'hq.ops.changeHistory',
      trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/cost-analysis'),
    meta: { titleKey: 'nav.costAnalysis', trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }] },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/profit-analysis'),
    meta: { titleKey: 'nav.profitAnalysis', trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }] },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/commission'),
    meta: { titleKey: 'hq.tab.commission', trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }] },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/user-settings'),
    meta: {
      titleKey: 'hq.sub.access.userSettings',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.access', href: D.hq },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/access'),
    meta: {
      titleKey: 'hq.sub.access.permission',
      trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/grid-order'),
    meta: {
      titleKey: 'hq.sub.org.order',
      trail: [
        { labelKey: 'nav.hqPolicy', href: D.hq },
        { labelKey: 'hq.hub.org', href: D.hqOrg },
      ],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/org-columns'),
    meta: {
      titleKey: 'hq.sub.org.columns',
      trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }],
    },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/platform'),
    meta: { titleKey: 'hq.hub.platform', trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }] },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy/deletion'),
    meta: { titleKey: 'hq.hub.deletion', trail: [{ labelKey: 'nav.hqPolicy', href: D.hq }] },
  },
  {
    test: (p) => p.startsWith('/dashboard/hq-policy'),
    meta: { titleKey: 'nav.hqPolicy', trail: [] },
  },
  {
    test: (p) => /^\/dashboard\/kyc\/[^/]+$/.test(p),
    meta: { titleKey: 'page.kycDetail', trail: [{ labelKey: 'nav.kyc', href: D.kyc }] },
  },
  { test: (p) => p.startsWith('/dashboard/kyc'), meta: { titleKey: 'nav.kyc', trail: [] } },
  {
    test: (p) => p.startsWith('/dashboard/customers/fees'),
    meta: { titleKey: 'customers.hub.fees', trail: [{ labelKey: 'nav.customers', href: D.customers }] },
  },
  {
    test: (p) => /^\/dashboard\/customers\/[^/]+$/.test(p),
    meta: { titleKey: 'page.customerDetail', trail: [{ labelKey: 'nav.customers', href: D.customers }] },
  },
  { test: (p) => p.startsWith('/dashboard/customers'), meta: { titleKey: 'nav.customers', trail: [] } },
  {
    test: (p) => p === '/dashboard/usdt/new',
    meta: { titleKey: 'page.usdtNew', trail: [{ labelKey: 'nav.usdt', href: D.usdt }] },
  },
  {
    test: (p) => /^\/dashboard\/usdt\/[^/]+$/.test(p),
    meta: { titleKey: 'page.usdtDetail', trail: [{ labelKey: 'nav.usdt', href: D.usdt }] },
  },
  { test: (p) => p.startsWith('/dashboard/usdt'), meta: { titleKey: 'nav.usdt', trail: [] } },
  {
    test: (p) => p === '/dashboard/escrow/new',
    meta: { titleKey: 'page.escrowNew', trail: [{ labelKey: 'nav.escrow', href: D.escrow }] },
  },
  {
    test: (p) => /^\/dashboard\/escrow\/[^/]+$/.test(p),
    meta: { titleKey: 'page.escrowDetail', trail: [{ labelKey: 'nav.escrow', href: D.escrow }] },
  },
  { test: (p) => p.startsWith('/dashboard/escrow'), meta: { titleKey: 'nav.escrow', trail: [] } },
  { test: (p) => p.startsWith('/dashboard/ledger'), meta: { titleKey: 'nav.ledger', trail: [] } },
  { test: (p) => p.startsWith('/dashboard/organizations'), meta: { titleKey: 'nav.orgs', trail: [] } },
  { test: (p) => p.startsWith('/dashboard/users'), meta: { titleKey: 'nav.users', trail: [] } },
  { test: (p) => p.startsWith('/dashboard/wallets'), meta: { titleKey: 'nav.wallets', trail: [] } },
  { test: (p) => p.startsWith('/dashboard/org-fees'), meta: { titleKey: 'nav.orgFees', trail: [] } },
];

const FALLBACK: PageMeta = { titleKey: 'nav.dashboard', trail: [] };

export function resolvePageMeta(pathname: string): PageMeta {
  return RULES.find((r) => r.test(pathname))?.meta ?? FALLBACK;
}
