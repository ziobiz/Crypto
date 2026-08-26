'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const MAIN_TABS: { href: string; labelKey: MessageKey }[] = [
  { href: '/dashboard/hq-policy/access', labelKey: 'hq.hub.access' },
  { href: '/dashboard/hq-policy/org-columns', labelKey: 'hq.hub.org' },
  { href: '/dashboard/hq-policy/commission', labelKey: 'hq.hub.commission' },
  { href: '/dashboard/hq-policy/platform', labelKey: 'hq.hub.platform' },
  { href: '/dashboard/hq-policy/ops', labelKey: 'hq.hub.ops' },
  { href: '/dashboard/hq-policy/deletion', labelKey: 'hq.hub.deletion' },
  { href: '/dashboard/simulator', labelKey: 'nav.simulator' },
  { href: '/dashboard/simulator-logs', labelKey: 'nav.simulatorLogs' },
  { href: '/dashboard/hq-policy/cost-analysis', labelKey: 'nav.costAnalysis' },
  { href: '/dashboard/hq-policy/profit-analysis', labelKey: 'nav.profitAnalysis' },
];

function tabActive(pathname: string, href: string) {
  if (href === '/dashboard/hq-policy/access') {
    return pathname.startsWith('/dashboard/hq-policy/access') || pathname.startsWith('/dashboard/hq-policy/user-settings');
  }
  if (href === '/dashboard/hq-policy/org-columns') {
    return pathname.startsWith('/dashboard/hq-policy/org-columns') || pathname.startsWith('/dashboard/hq-policy/grid-order');
  }
  if (href === '/dashboard/hq-policy/ops') return pathname.startsWith('/dashboard/hq-policy/ops');
  if (href === '/dashboard/hq-policy/deletion') return pathname.startsWith('/dashboard/hq-policy/deletion');
  if (href === '/dashboard/simulator-logs') return pathname.startsWith('/dashboard/simulator-logs');
  if (href === '/dashboard/simulator') {
    return pathname.startsWith('/dashboard/simulator') && !pathname.startsWith('/dashboard/simulator-logs');
  }
  return pathname.startsWith(href);
}

export function HqPolicyHubNav() {
  const pathname = usePathname();
  const t = useT();
  const { user } = useAuth();
  const tabs =
    user?.role === 'ORGANIZER'
      ? MAIN_TABS.filter(
          (tab) =>
            tab.href === '/dashboard/hq-policy/cost-analysis' ||
            tab.href === '/dashboard/hq-policy/profit-analysis',
        )
      : MAIN_TABS;
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b border-gray-200 pb-2">
      {tabs.map((tab) => {
        const active = tabActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 pb-1.5 text-[13px] font-bold ${
              active
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
