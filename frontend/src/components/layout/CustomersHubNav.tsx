'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const TABS: { href: string; labelKey: MessageKey }[] = [
  { href: '/dashboard/customers', labelKey: 'customers.hub.list' },
  { href: '/dashboard/customers/fees', labelKey: 'customers.hub.fees' },
];

function tabActive(pathname: string, href: string) {
  if (href === '/dashboard/customers/fees') {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || (pathname.startsWith('/dashboard/customers/') && !pathname.startsWith('/dashboard/customers/fees'));
}

export function CustomersHubNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b border-gray-200 pb-2">
      {TABS.map((tab) => {
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
