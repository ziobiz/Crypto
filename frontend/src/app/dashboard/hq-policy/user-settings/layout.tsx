'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const SUB_TABS: { href: string; labelKey: MessageKey }[] = [
  { href: '/dashboard/hq-policy/access', labelKey: 'hq.sub.access.permission' },
  { href: '/dashboard/hq-policy/user-settings', labelKey: 'hq.sub.access.userSettings' },
];

export default function HqUserSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t('hq.hub.accessDesc')}</p>
      <nav className="flex flex-wrap gap-2.5">
        {SUB_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pg-subtab ${active ? 'pg-subtab-active' : 'pg-subtab-idle'}`}
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
