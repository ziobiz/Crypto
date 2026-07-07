'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { useNavTabs } from '@/context/NavTabsContext';
import { NavIcon } from './NavIcons';
import type { NavItem } from './nav-config';

export function SideNav({
  items,
  collapsed,
  onNavigate,
  onCollapse,
}: {
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
  onCollapse?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const { openTab } = useNavTabs();

  return (
    <nav className="flex flex-1 flex-col overflow-hidden">
      {onCollapse && (
        <div className="pg-sidebar-collapse-wrap">
          <button type="button" onClick={onCollapse} className="pg-sidebar-collapse">
            {collapsed ? '»' : `« ${t('nav.collapse')}`}
          </button>
        </div>
      )}

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                openTab({ href: item.href, labelKey: item.labelKey });
                onNavigate?.();
              }}
              title={t(item.labelKey)}
              className={`pg-nav-item ${collapsed ? 'justify-center px-2.5' : ''} ${
                active ? 'pg-nav-item-active' : ''
              }`}
            >
              <NavIcon id={item.icon} className="h-[18px] w-[18px] shrink-0 opacity-95" />
              {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
