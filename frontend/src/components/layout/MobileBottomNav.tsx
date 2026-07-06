'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { NAV_ITEMS } from './nav-config';

/** 모바일·태블릿 — 고객 하단 탭 (PG 모바일 네비) */
export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const t = useT();

  if (!user || user.role !== 'CUSTOMER') return null;

  const items = NAV_ITEMS.CUSTOMER;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={t('nav.menu')}
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const label = item.shortKey ? t(item.shortKey) : t(item.labelKey);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium sm:text-xs ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <NavDot active={active} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavDot({ active }: { active: boolean }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-blue-600' : 'bg-gray-300'}`}
      aria-hidden
    />
  );
}
