'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { href: '/dashboard', label: '대시보드' },
    { href: '/dashboard/usdt', label: 'USDT 매입' },
    { href: '/dashboard/escrow', label: '무역 에스크로' },
    { href: '/dashboard/ledger', label: '수수료 장부' },
    { href: '/dashboard/hq-policy', label: '본사정책' },
  ],
  ORG_STAFF: [
    { href: '/dashboard', label: '대시보드' },
    { href: '/dashboard/usdt', label: 'USDT 매입' },
    { href: '/dashboard/escrow', label: '무역 에스크로' },
    { href: '/dashboard/ledger', label: '수수료 장부' },
  ],
  CUSTOMER: [
    { href: '/dashboard', label: '대시보드' },
    { href: '/dashboard/usdt', label: 'USDT 매입' },
    { href: '/dashboard/escrow', label: '무역 에스크로' },
    { href: '/dashboard/wallets', label: '내 지갑' },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = NAV_ITEMS[user.role] ?? [];

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900">Crypto Workflow</h1>
        <p className="mt-1 text-sm text-gray-500">{user.name}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
