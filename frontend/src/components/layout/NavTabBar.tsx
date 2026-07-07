'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { useNavTabs } from '@/context/NavTabsContext';
import { resolveNavItem } from './nav-config';
import type { NavItem } from './nav-config';

export function NavTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const t = useT();
  const { tabs, closeTab } = useNavTabs();

  const activeHref = resolveNavItem(pathname, items)?.href ?? pathname;

  return (
    <div className="pg-tab-bar">
      <div className="flex min-w-0 flex-1 flex-wrap gap-0.5">
        {tabs.map((tab) => {
          const active = tab.href === activeHref;
          return (
            <div
              key={tab.href}
              className={`group flex items-center rounded-t-md border transition ${
                active ? 'pg-tab-active' : 'border-transparent bg-transparent pg-tab-idle'
              }`}
            >
              <Link href={tab.href} className="pg-tab">
                {t(tab.labelKey)}
              </Link>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={() => closeTab(tab.href)}
                  className="mr-1 rounded p-0.5 text-[10px] opacity-50 hover:opacity-100"
                  style={{ color: 'var(--shell-tab-text)' }}
                  aria-label={t('common.close')}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
