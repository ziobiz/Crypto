'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const TABS: { href: string; labelKey: MessageKey; matchPrefix?: string }[] = [
  { href: '/dashboard/hq-policy/access', labelKey: 'hq.tab.access', matchPrefix: '/dashboard/hq-policy/access' },
  { href: '/dashboard/hq-policy/user-settings', labelKey: 'hq.tab.access', matchPrefix: '/dashboard/hq-policy/user-settings' },
  { href: '/dashboard/hq-policy/org-columns', labelKey: 'hq.tab.orgColumns', matchPrefix: '/dashboard/hq-policy/org-columns' },
  { href: '/dashboard/hq-policy/grid-order', labelKey: 'hq.tab.orgColumns', matchPrefix: '/dashboard/hq-policy/grid-order' },
  { href: '/dashboard/hq-policy/commission', labelKey: 'hq.tab.commission' },
  { href: '/dashboard/hq-policy/platform', labelKey: 'hq.tab.platform' },
];

function isActive(pathname: string, tab: (typeof TABS)[number]) {
  if (tab.matchPrefix) return pathname.startsWith(tab.matchPrefix);
  return pathname === tab.href;
}

export default function HqPolicyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();

  const mainTabs = [
    { href: '/dashboard/hq-policy/access', labelKey: 'hq.hub.access' as MessageKey },
    { href: '/dashboard/hq-policy/org-columns', labelKey: 'hq.hub.org' as MessageKey },
    { href: '/dashboard/hq-policy/commission', labelKey: 'hq.hub.commission' as MessageKey },
    { href: '/dashboard/hq-policy/platform', labelKey: 'hq.hub.platform' as MessageKey },
  ];

  return (
    <div className="pg-stack">
      <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b border-gray-200 pb-2">
        {mainTabs.map((tab) => {
          const active =
            tab.href === '/dashboard/hq-policy/access'
              ? pathname.startsWith('/dashboard/hq-policy/access') || pathname.startsWith('/dashboard/hq-policy/user-settings')
              : tab.href === '/dashboard/hq-policy/org-columns'
                ? pathname.startsWith('/dashboard/hq-policy/org-columns') || pathname.startsWith('/dashboard/hq-policy/grid-order')
                : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 pb-1.5 text-[11px] font-medium ${
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
      {children}
    </div>
  );
}
