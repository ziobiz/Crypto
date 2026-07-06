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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('hq.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('hq.subtitle')}</p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
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
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
