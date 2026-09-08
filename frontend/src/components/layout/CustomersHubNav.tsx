'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const TABS: { href: string; labelKey: MessageKey; exact?: boolean }[] = [
  { href: '/dashboard/customers', labelKey: 'customers.hub.list', exact: true },
  { href: '/dashboard/customers/fees', labelKey: 'customers.hub.fees' },
];

function tabActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href || pathname.match(/^\/dashboard\/customers\/[^/]+$/);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomersHubNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
      {TABS.map((tab) => {
        const active = tabActive(pathname, tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? 'pg-btn pg-btn-primary text-xs'
                : 'pg-btn pg-btn-secondary text-xs'
            }
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
