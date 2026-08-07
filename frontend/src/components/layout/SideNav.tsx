'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { useNavTabs } from '@/context/NavTabsContext';
import { NavIcon } from './NavIcons';
import type { NavItem } from './nav-config';

function NavLinks({
  items,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const { openTab } = useNavTabs();

  return (
    <>
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
    </>
  );
}

export function SideNav({
  items,
  footerItems = [],
  collapsed,
  onNavigate,
  onCollapse,
}: {
  items: NavItem[];
  footerItems?: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
  onCollapse?: () => void;
}) {
  const t = useT();

  return (
    <nav className="flex flex-1 flex-col overflow-hidden">
      {onCollapse && (
        <div className="pg-sidebar-collapse-wrap">
          <button type="button" onClick={onCollapse} className="pg-sidebar-collapse">
            {collapsed ? '»' : `« ${t('nav.collapse')}`}
          </button>
        </div>
      )}

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        <NavLinks items={items} collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {footerItems.length > 0 && (
        <div className="mt-auto space-y-1 border-t border-white/10 px-2 py-3">
          <NavLinks items={footerItems} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  );
}
