'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/hq-policy/access', label: '접근·권한' },
  { href: '/dashboard/hq-policy/org-columns', label: '조직·화면' },
  { href: '/dashboard/hq-policy/commission', label: '수수료·리스크' },
  { href: '/dashboard/hq-policy/platform', label: '플랫폼' },
];

export default function HqPolicyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">본사정책</h1>
        <p className="mt-1 text-sm text-gray-500">
          PG 본사정책 허브와 동일한 구성 — 접근 권한, 조직 항목, 수수료·리스크, 플랫폼 도메인·SSL
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
