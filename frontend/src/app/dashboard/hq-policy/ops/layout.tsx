'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const SUB_TABS: { href: string; labelKey: MessageKey }[] = [
  { href: '/dashboard/hq-policy/ops/change-history', labelKey: 'hq.ops.changeHistory' },
  { href: '/dashboard/hq-policy/ops/release-history', labelKey: 'hq.ops.releaseHistory' },
  { href: '/dashboard/hq-policy/ops/payment', labelKey: 'hq.ops.paymentManagement' },
];

export default function HqOpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <div className="pg-stack">
      <p className="text-[13px] text-gray-600">{t('hq.ops.desc')}</p>
      <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b border-gray-200 pb-2">
        {SUB_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 pb-1.5 text-[13px] font-bold ${
                active
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
