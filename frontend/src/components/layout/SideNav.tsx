'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { useNavTabs } from '@/context/NavTabsContext';
import { NavIcon } from './NavIcons';
import { navChildIsActive, navItemHasActiveChild, type NavItem } from './nav-config';

const EXPAND_KEY = 'tinpass.nav.expanded';
/** 부모 아이콘(18px)+gap(10px)+좌패딩(12px) — 하위 라벨을 「본사정책」글자와 맞춤 */
const NAV_CHILD_PL = 'pl-[calc(0.75rem+18px+0.625rem)]';

function loadExpanded(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EXPAND_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveExpanded(map: Record<string, boolean>) {
  try {
    localStorage.setItem(EXPAND_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /** 활성 하위 경로에 있어도 사용자가 접으면 다시 강제 펼치지 않음 */
  const userCollapsedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setExpanded(loadExpanded());
  }, []);

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        if (!item.children?.length) continue;
        const childActive = navItemHasActiveChild(item, pathname);
        if (childActive) {
          if (!next[item.href] && !userCollapsedRef.current.has(item.href)) {
            next[item.href] = true;
            changed = true;
          }
        } else {
          userCollapsedRef.current.delete(item.href);
        }
      }
      if (changed) saveExpanded(next);
      return changed ? next : prev;
    });
  }, [pathname, items]);

  function toggleExpand(href: string) {
    setExpanded((prev) => {
      const willOpen = !prev[href];
      if (willOpen) userCollapsedRef.current.delete(href);
      else userCollapsedRef.current.add(href);
      const next = { ...prev, [href]: willOpen };
      saveExpanded(next);
      return next;
    });
  }

  function go(item: NavItem) {
    openTab({ href: item.href, labelKey: item.labelKey });
    onNavigate?.();
  }

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
          const hasChildren = !!item.children?.length;
          const childActive = navItemHasActiveChild(item, pathname);
          const selfActive =
            pathname === item.href ||
            (pathname.startsWith(`${item.href}/`) && !hasChildren);
          const isOpen = !!expanded[item.href];
          const parentActive = selfActive || childActive;

          if (!hasChildren) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => go(item)}
                title={t(item.labelKey)}
                className={`pg-nav-item ${collapsed ? 'justify-center px-2.5' : ''} ${
                  parentActive ? 'pg-nav-item-active' : ''
                }`}
              >
                <NavIcon id={item.icon} className="h-[18px] w-[18px] shrink-0 opacity-95" />
                {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
              </Link>
            );
          }

          return (
            <div key={item.href} className="mb-1">
              <button
                type="button"
                title={t(item.labelKey)}
                onClick={() => toggleExpand(item.href)}
                className={`pg-nav-item w-full text-left ${collapsed ? 'justify-center px-2.5' : ''} ${
                  parentActive ? 'pg-nav-item-active' : ''
                }`}
              >
                <NavIcon id={item.icon} className="h-[18px] w-[18px] shrink-0 opacity-95" />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>}
                {!collapsed && (
                  <span className="shrink-0 text-[11px] opacity-80" aria-hidden>
                    {isOpen ? '∨' : '>'}
                  </span>
                )}
              </button>
              {!collapsed && isOpen && (
                <div className="space-y-0.5">
                  {item.children!.map((child) => {
                    const active = navChildIsActive(pathname, child, item.children!);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => go(child)}
                        title={t(child.labelKey)}
                        className={`pg-nav-item py-2 text-[12px] ${NAV_CHILD_PL} ${
                          active ? 'pg-nav-item-active' : ''
                        }`}
                      >
                        <span className="truncate">{t(child.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
