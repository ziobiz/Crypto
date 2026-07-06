'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import type { NavItem } from './nav-config';

export function SideNav({
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

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={t(item.labelKey)}
            className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition touch-target ${
              active ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-300/60'
            } ${collapsed ? 'justify-center px-2' : ''}`}
          >
            {collapsed ? (
              <span className="text-xs font-bold">{t(item.shortKey ?? item.labelKey).slice(0, 2)}</span>
            ) : (
              t(item.labelKey)
            )}
          </Link>
        );
      })}
    </nav>
  );
}
