'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { useBranding } from '@/hooks/useBranding';
import type { MessageKey } from '@/i18n/messages';

function roleKey(role: string): MessageKey {
  return `role.${role}` as MessageKey;
}

function sessionRoleKey(role: string): MessageKey {
  if (role === 'SUPER_ADMIN') return 'session.roleAdmin';
  if (role === 'ORG_STAFF') return 'session.roleStaff';
  return 'session.roleCustomer';
}

function UserGlyph() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-600">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

/** PG/ICOPAY — 조직 | 역할 한 줄 + 드롭다운 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const t = useT();
  const branding = useBranding();
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

  const orgLine =
    user.organization?.name ??
    user.customerProfile?.recruitingOrg?.name ??
    branding?.siteName ??
    'HQ';

  const identityLine = `${orgLine} | ${t(sessionRoleKey(user.role))}`;

  function handleLogout() {
    setOpen(false);
    setConfirmLogout(false);
    logout();
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirmLogout(false);
        }}
        className="pg-session-user"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserGlyph />
        <span className="truncate text-xs font-medium" style={{ color: 'var(--shell-session-text)' }}>
          {identityLine}
        </span>
        <svg className="h-3.5 w-3.5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-[min(100vw-2rem,17rem)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-gray-900">{user.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">{user.email}</p>
            <p className="mt-1 text-[11px] text-gray-600">{t(roleKey(user.role))}</p>
            {orgLine && <p className="mt-0.5 truncate text-[11px] text-gray-500">{orgLine}</p>}
          </div>

          {!confirmLogout ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirmLogout(true)}
              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
            >
              {t('nav.logout')}
            </button>
          ) : (
            <div className="px-3 py-2.5">
              <p className="text-xs text-gray-700">{t('nav.logoutConfirm')}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 rounded border border-gray-200 py-1.5 text-xs text-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded bg-red-600 py-1.5 text-xs font-medium text-white"
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
