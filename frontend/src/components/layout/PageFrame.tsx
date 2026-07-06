'use client';

import { usePathname } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { resolvePageMeta } from './breadcrumb-config';

export function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();
  const { titleKey, trailKeys } = resolvePageMeta(pathname);

  const pathLabels = [...trailKeys, titleKey].map((key) => t(key));
  const pathText = pathLabels.join(` ${t('page.breadcrumbSeparator')} `);

  return (
    <div className="pg-frame">
      <div className="pg-frame-head">
        <h1 className="pg-frame-title">
          {t('page.breadcrumbPrefix')}
          {t(titleKey)}
        </h1>
        {pathLabels.length > 1 && (
          <p className="pg-frame-path" aria-label={t('page.pathLabel')}>
            {pathText}
          </p>
        )}
      </div>
      <div className="pg-frame-body">{children}</div>
    </div>
  );
}
