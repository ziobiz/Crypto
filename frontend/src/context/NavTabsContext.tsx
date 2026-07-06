'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { MessageKey } from '@/i18n/messages';
import { resolveNavItem, type NavItem } from '@/components/layout/nav-config';

export type NavTab = { href: string; labelKey: MessageKey };

type NavTabsContextValue = {
  tabs: NavTab[];
  openTab: (tab: NavTab) => void;
  closeTab: (href: string) => void;
  closeAll: () => void;
};

const NavTabsContext = createContext<NavTabsContextValue | null>(null);
const STORAGE_KEY = 'crypto-nav-tabs';

export function NavTabsProvider({ items, children }: { items: NavItem[]; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<NavTab[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as NavTab[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    const home = items[0];
    if (home) setTabs([{ href: home.href, labelKey: home.labelKey }]);
  }, [items]);

  useEffect(() => {
    if (!pathname.startsWith('/dashboard')) return;
    const match = resolveNavItem(pathname, items);
    if (!match) return;
    setTabs((prev) => {
      if (prev.some((t) => t.href === match.href)) return prev;
      return [...prev, { href: match.href, labelKey: match.labelKey }];
    });
  }, [pathname, items]);

  useEffect(() => {
    if (tabs.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  const openTab = useCallback((tab: NavTab) => {
    setTabs((prev) => (prev.some((t) => t.href === tab.href) ? prev : [...prev, tab]));
    router.push(tab.href);
  }, [router]);

  const closeTab = useCallback(
    (href: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.href !== href);
        if (href === pathname && next.length > 0) {
          const fallback = next[next.length - 1]!;
          router.push(fallback.href);
        } else if (next.length === 0) {
          const home = items[0]?.href ?? '/dashboard';
          router.push(home);
          return [{ href: home, labelKey: items[0]!.labelKey }];
        }
        return next;
      });
    },
    [pathname, router, items],
  );

  const closeAll = useCallback(() => {
    const home = items[0];
    if (!home) return;
    setTabs([{ href: home.href, labelKey: home.labelKey }]);
    router.push(home.href);
  }, [router, items]);

  const value = useMemo(
    () => ({ tabs, openTab, closeTab, closeAll }),
    [tabs, openTab, closeTab, closeAll],
  );

  return <NavTabsContext.Provider value={value}>{children}</NavTabsContext.Provider>;
}

export function useNavTabs() {
  const ctx = useContext(NavTabsContext);
  if (!ctx) throw new Error('useNavTabs requires NavTabsProvider');
  return ctx;
}
