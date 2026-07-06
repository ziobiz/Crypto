'use client';

import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';

export function BrandingHead() {
  const branding = useBranding();

  useEffect(() => {
    if (!branding) return;
    document.title = branding.siteName;

    const iconHref = branding.faviconUrl;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconHref) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = iconHref;
    }
  }, [branding]);

  return null;
}
