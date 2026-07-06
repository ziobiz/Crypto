'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { LocaleBar } from './LocaleBar';
import { UserMenu } from './UserMenu';
import { SideNav } from './SideNav';
import { MobileBottomNav } from './MobileBottomNav';
import { NAV_ITEMS } from './nav-config';
import { useBranding } from '@/hooks/useBranding';

const SIDEBAR_KEY = 'crypto-sidebar-collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const t = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const branding = useBranding();

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === '1') setCollapsed(true);
  }, []);

  if (!user) return null;

  const items = NAV_ITEMS[user.role] ?? [];
  const isCustomer = user.role === 'CUSTOMER';

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-gray-50 shadow-sm">
        <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
          <button
            type="button"
            className="touch-target rounded-lg p-2 text-gray-600 hover:bg-gray-200 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('nav.menu')}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            type="button"
            className="hidden touch-target rounded-lg p-2 text-gray-600 hover:bg-gray-200 md:inline-flex"
            onClick={toggleCollapsed}
            aria-label={t('nav.toggleSidebar')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-8 w-auto max-w-[160px] object-contain" />
            ) : (
              <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                {branding?.siteName ?? t('app.title')}
              </h1>
            )}
          </div>

          <LocaleBar className="hidden sm:inline-flex" />
          <div className="sm:hidden">
            <LocaleBar />
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`hidden shrink-0 flex-col border-r border-gray-200 bg-gray-200 transition-all duration-200 md:flex ${
            collapsed ? 'w-16' : 'w-56 lg:w-64'
          }`}
        >
          <SideNav items={items} collapsed={collapsed} />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
            <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('common.close')} onClick={() => setDrawerOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18rem)] flex-col bg-gray-200 shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-gray-300 px-4">
                <span className="font-semibold">{t('nav.menu')}</span>
                <button type="button" className="touch-target rounded-lg p-2" onClick={() => setDrawerOpen(false)}>✕</button>
              </div>
              <SideNav items={items} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <main
          className={`min-w-0 flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 ${
            isCustomer ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6' : ''
          }`}
        >
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
