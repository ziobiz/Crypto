'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { NavTabsProvider } from '@/context/NavTabsContext';
import { TabletModeProvider, useTabletMode } from '@/context/TabletModeContext';
import { SideNav } from './SideNav';
import { NavTabBar } from './NavTabBar';
import { SessionMetaBar } from './SessionMetaBar';
import { MobileBottomNav } from './MobileBottomNav';
import { NAV_ITEMS } from './nav-config';
import { useBranding } from '@/hooks/useBranding';

const SIDEBAR_KEY = 'crypto-sidebar-collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TabletModeProvider>
      <AppShellInner>{children}</AppShellInner>
    </TabletModeProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const t = useT();
  const { tablet } = useTabletMode();
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
    <NavTabsProvider items={items}>
      <div className="flex min-h-screen bg-white">
        {/* 데스크톱 사이드바 — ICOPAY 밀착 레이아웃 */}
        <aside
          className={`shrink-0 flex-col border-r border-[#5c636e] bg-[#6d7582] text-gray-100 transition-all duration-200 ${
            tablet ? 'hidden' : `hidden md:flex ${collapsed ? 'w-[3.75rem]' : 'w-[13rem]'}`
          }`}
        >
          <div className={`border-b border-white/15 px-3 py-3.5 ${collapsed ? 'text-center' : ''}`}>
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt=""
                className={`object-contain ${collapsed ? 'mx-auto h-8 w-8' : 'h-9 max-w-[180px]'}`}
              />
            ) : (
              <span className={`font-bold text-white ${collapsed ? 'text-xs' : 'text-base'}`}>
                {collapsed ? 'C' : (branding?.siteName ?? t('app.title'))}
              </span>
            )}
          </div>
          <SideNav items={items} collapsed={collapsed} onCollapse={toggleCollapsed} />
        </aside>

        {/* 모바일 드로어 */}
        {drawerOpen && !tablet && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label={t('common.close')}
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-[min(100vw-3rem,16rem)] flex-col bg-[#6d7582] shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <span className="font-semibold text-white">{t('nav.menu')}</span>
                <button type="button" className="touch-target text-gray-300" onClick={() => setDrawerOpen(false)}>
                  ✕
                </button>
              </div>
              <SideNav items={items} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className="tablet-shell flex min-w-0 flex-1 flex-col bg-white">
          <div className={`flex items-center gap-2 border-b border-gray-300 bg-[#6d7582] px-3 py-2 ${tablet ? 'hidden' : 'md:hidden'}`}>
            <button
              type="button"
              className="touch-target rounded p-2 text-gray-200"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.menu')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-7 object-contain" />
            ) : (
              <span className="text-sm font-bold text-white">{branding?.siteName ?? t('app.title')}</span>
            )}
          </div>

          <SessionMetaBar />
          <NavTabBar items={items} />

          <main
            className={`pg-admin min-h-0 flex-1 overflow-auto bg-[#eceef1] px-4 py-4 ${
              isCustomer && !tablet
                ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-4'
                : ''
            }`}
          >
            {children}
          </main>
        </div>

        {!tablet && <MobileBottomNav />}
      </div>
    </NavTabsProvider>
  );
}
