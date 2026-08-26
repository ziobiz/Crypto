import type { MessageKey } from '@/i18n/messages';

export type PageMeta = {
  titleKey: MessageKey;
  trailKeys: MessageKey[];
};

type RouteRule = {
  test: (pathname: string) => boolean;
  meta: PageMeta;
};

const RULES: RouteRule[] = [
  { test: (p) => p === '/dashboard', meta: { titleKey: 'nav.dashboard', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/simulator-logs'), meta: { titleKey: 'nav.simulatorLogs', trailKeys: ['nav.hqPolicy'] } },
  { test: (p) => p.startsWith('/dashboard/simulator'), meta: { titleKey: 'nav.simulator', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/manuals'), meta: { titleKey: 'nav.manuals', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/ops/updates'), meta: { titleKey: 'hq.ops.updatesContent', trailKeys: ['nav.hqPolicy', 'hq.hub.ops'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/ops/release-history'), meta: { titleKey: 'hq.ops.releaseHistory', trailKeys: ['nav.hqPolicy', 'hq.hub.ops'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/ops/workflow'), meta: { titleKey: 'hq.ops.workflow', trailKeys: ['nav.hqPolicy', 'hq.hub.ops'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/ops'), meta: { titleKey: 'hq.ops.changeHistory', trailKeys: ['nav.hqPolicy', 'hq.hub.ops'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/cost-analysis'), meta: { titleKey: 'nav.costAnalysis', trailKeys: ['nav.hqPolicy'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/profit-analysis'), meta: { titleKey: 'nav.profitAnalysis', trailKeys: ['nav.hqPolicy'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/commission'), meta: { titleKey: 'hq.tab.commission', trailKeys: ['nav.hqPolicy'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/user-settings'), meta: { titleKey: 'hq.sub.access.userSettings', trailKeys: ['nav.hqPolicy', 'hq.hub.access'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/access'), meta: { titleKey: 'hq.sub.access.permission', trailKeys: ['nav.hqPolicy', 'hq.hub.access'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/grid-order'), meta: { titleKey: 'hq.sub.org.order', trailKeys: ['nav.hqPolicy', 'hq.hub.org'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/org-columns'), meta: { titleKey: 'hq.sub.org.columns', trailKeys: ['nav.hqPolicy', 'hq.hub.org'] } },
  { test: (p) => p.startsWith('/dashboard/kyc'), meta: { titleKey: 'nav.kyc', trailKeys: [] } },
  { test: (p) => /^\/dashboard\/customers\/[^/]+$/.test(p), meta: { titleKey: 'page.customerDetail', trailKeys: ['nav.customers'] } },
  { test: (p) => p.startsWith('/dashboard/customers'), meta: { titleKey: 'nav.customers', trailKeys: [] } },
  { test: (p) => p === '/dashboard/usdt/new', meta: { titleKey: 'page.usdtNew', trailKeys: ['nav.usdt'] } },
  { test: (p) => /^\/dashboard\/usdt\/[^/]+$/.test(p), meta: { titleKey: 'page.usdtDetail', trailKeys: ['nav.usdt'] } },
  { test: (p) => p.startsWith('/dashboard/usdt'), meta: { titleKey: 'nav.usdt', trailKeys: [] } },
  { test: (p) => p === '/dashboard/escrow/new', meta: { titleKey: 'page.escrowNew', trailKeys: ['nav.escrow'] } },
  { test: (p) => /^\/dashboard\/escrow\/[^/]+$/.test(p), meta: { titleKey: 'page.escrowDetail', trailKeys: ['nav.escrow'] } },
  { test: (p) => p.startsWith('/dashboard/escrow'), meta: { titleKey: 'nav.escrow', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/ledger'), meta: { titleKey: 'nav.ledger', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/organizations'), meta: { titleKey: 'nav.orgs', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/users'), meta: { titleKey: 'nav.users', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/wallets'), meta: { titleKey: 'nav.wallets', trailKeys: [] } },
];

const FALLBACK: PageMeta = { titleKey: 'nav.dashboard', trailKeys: [] };

export function resolvePageMeta(pathname: string): PageMeta {
  return RULES.find((r) => r.test(pathname))?.meta ?? FALLBACK;
}
