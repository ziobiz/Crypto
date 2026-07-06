'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

function roleKey(role: string): MessageKey {
  return `role.${role}` as MessageKey;
}

/** PG 스타일 — 로그인 정보 드롭다운 + 로그아웃 확인 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmLogout(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!user) return null;

  const orgLine = user.organization
    ? user.organization.name
    : user.customerProfile?.recruitingOrg?.name;

  function handleLogout() {
    setOpen(false);
    setConfirmLogout(false);
    logout();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirmLogout(false);
        }}
        className="touch-target flex max-w-[min(100vw-8rem,14rem)] items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-left sm:max-w-xs sm:px-3"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {user.name.charAt(0)}
        </span>
        <span className="min-w-0 flex-1 hidden sm:block">
          <span className="block truncate text-sm font-medium text-gray-900">{user.name}</span>
          <span className="block truncate text-xs text-gray-500">{t(roleKey(user.role))}</span>
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,18rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg"
          role="menu"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
            <p className="mt-1 text-xs text-blue-600">{t(roleKey(user.role))}</p>
            {orgLine && <p className="mt-0.5 text-xs text-gray-500">{orgLine}</p>}
          </div>

          {!confirmLogout ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirmLogout(true)}
              className="touch-target w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
            >
              {t('nav.logout')}
            </button>
          ) : (
            <div className="px-4 py-3">
              <p className="text-sm text-gray-700">{t('nav.logoutConfirm')}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white"
                >
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
