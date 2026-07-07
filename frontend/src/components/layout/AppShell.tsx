'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { NavTabsProvider } from '@/context/NavTabsContext';
import { TabletModeProvider, useTabletMode } from '@/context/TabletModeContext';
import { ShellThemeProvider } from '@/context/ShellThemeContext';
import { SideNav } from './SideNav';
import { NavTabBar } from './NavTabBar';
import { SessionMetaBar } from './SessionMetaBar';
import { NAV_ITEMS } from './nav-config';
import { useBranding } from '@/hooks/useBranding';

const SIDEBAR_KEY = 'crypto-sidebar-collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellThemeProvider>
      <TabletModeProvider>
        <AppShellInner>{children}</AppShellInner>
      </TabletModeProvider>
    </ShellThemeProvider>
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
          className={`pg-sidebar shrink-0 flex-col transition-all duration-200 ${
            tablet ? 'hidden' : `hidden md:flex ${collapsed ? 'w-[3.75rem]' : 'w-[13rem]'}`
          }`}
        >
          <div className={`pg-sidebar-logo ${collapsed ? 'px-2' : 'px-3'}`}>
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt=""
                className={`object-contain ${collapsed ? 'h-8 w-8' : 'h-9 max-w-full'}`}
              />
            ) : (
              <span
                className={`font-bold ${collapsed ? 'text-xs' : 'text-sm'}`}
                style={{ color: 'var(--shell-logo-text)' }}
              >
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
            <aside className="pg-sidebar absolute left-0 top-0 flex h-full w-[min(100vw-3rem,16rem)] flex-col shadow-xl">
              <div className="flex h-14 items-center justify-between border-b px-4" style={{ borderColor: 'var(--shell-sidebar-border)' }}>
                <span className="font-semibold" style={{ color: 'var(--shell-nav-text)' }}>
                  {t('nav.menu')}
                </span>
                <button type="button" className="touch-target opacity-70" onClick={() => setDrawerOpen(false)}>
                  ✕
                </button>
              </div>
              <SideNav items={items} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className="tablet-shell flex min-w-0 flex-1 flex-col bg-white">
          <div className={`pg-sidebar flex items-center gap-2 border-b px-3 py-2 md:hidden ${tablet ? 'hidden' : ''}`}>
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

          <main className="pg-admin pg-main min-h-0 flex-1 overflow-auto px-4 py-4">
            {children}
          </main>
        </div>
      </div>
    </NavTabsProvider>
  );
}
