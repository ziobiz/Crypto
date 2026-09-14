'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { resolvePageMeta } from './breadcrumb-config';

export function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();
  const { titleKey, trail, hideTitle } = resolvePageMeta(pathname);
  const sep = ` ${t('page.breadcrumbSeparator')} `;

  return (
    <div className="pg-frame">
      <div className="pg-frame-head">
        {!hideTitle && <h1 className="pg-frame-title">{t(titleKey)}</h1>}
        {trail.length > 0 && (
          <nav className={`pg-frame-path${hideTitle ? ' ml-auto' : ''}`} aria-label={t('page.pathLabel')}>
            {trail.map((crumb, i) => (
              <span key={`${crumb.href}-${crumb.labelKey}`}>
                {i > 0 && sep}
                <Link href={crumb.href} className="pg-frame-path-link">
                  {t(crumb.labelKey)}
                </Link>
              </span>
            ))}
            {sep}
            <span className="pg-frame-path-current" aria-current="page">
              {t(titleKey)}
            </span>
          </nav>
        )}
      </div>
      <div className="pg-frame-body">{children}</div>
    </div>
  );
}
