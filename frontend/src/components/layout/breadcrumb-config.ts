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
  { test: (p) => p.startsWith('/dashboard/hq-policy/ops/release-history'), meta: { titleKey: 'hq.ops.releaseHistory', trailKeys: ['nav.hqPolicy', 'hq.hub.ops'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/ops'), meta: { titleKey: 'hq.ops.changeHistory', trailKeys: ['nav.hqPolicy', 'hq.hub.ops'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/platform'), meta: { titleKey: 'hq.tab.platform', trailKeys: ['nav.hqPolicy'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/commission'), meta: { titleKey: 'hq.tab.commission', trailKeys: ['nav.hqPolicy'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/user-settings'), meta: { titleKey: 'hq.sub.access.userSettings', trailKeys: ['nav.hqPolicy', 'hq.hub.access'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/access'), meta: { titleKey: 'hq.sub.access.permission', trailKeys: ['nav.hqPolicy', 'hq.hub.access'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/grid-order'), meta: { titleKey: 'hq.sub.org.order', trailKeys: ['nav.hqPolicy', 'hq.hub.org'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy/org-columns'), meta: { titleKey: 'hq.sub.org.columns', trailKeys: ['nav.hqPolicy', 'hq.hub.org'] } },
  { test: (p) => p.startsWith('/dashboard/hq-policy'), meta: { titleKey: 'nav.hqPolicy', trailKeys: [] } },
  { test: (p) => p === '/dashboard/usdt/new', meta: { titleKey: 'page.usdtNew', trailKeys: ['nav.usdt'] } },
  { test: (p) => /^\/dashboard\/usdt\/[^/]+$/.test(p), meta: { titleKey: 'page.usdtDetail', trailKeys: ['nav.usdt'] } },
  { test: (p) => p.startsWith('/dashboard/usdt'), meta: { titleKey: 'nav.usdt', trailKeys: [] } },
  { test: (p) => p === '/dashboard/escrow/new', meta: { titleKey: 'page.escrowNew', trailKeys: ['nav.escrow'] } },
  { test: (p) => /^\/dashboard\/escrow\/[^/]+$/.test(p), meta: { titleKey: 'page.escrowDetail', trailKeys: ['nav.escrow'] } },
  { test: (p) => p.startsWith('/dashboard/escrow'), meta: { titleKey: 'nav.escrow', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/ledger'), meta: { titleKey: 'nav.ledger', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/users'), meta: { titleKey: 'nav.users', trailKeys: [] } },
  { test: (p) => p.startsWith('/dashboard/wallets'), meta: { titleKey: 'nav.wallets', trailKeys: [] } },
];

const FALLBACK: PageMeta = { titleKey: 'nav.dashboard', trailKeys: [] };

export function resolvePageMeta(pathname: string): PageMeta {
  return RULES.find((r) => r.test(pathname))?.meta ?? FALLBACK;
}
