'use client';

import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';

export function BrandingHead() {
  const branding = useBranding();

  useEffect(() => {
    if (!branding) return;
    document.title = branding.siteName;

    const iconHref = branding.faviconUrl;
    if (!iconHref) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconHref;
  }, [branding?.faviconUrl, branding?.siteName]);

  return null;
}
