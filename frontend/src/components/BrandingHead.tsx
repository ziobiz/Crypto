'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useBranding } from '@/hooks/useBranding';

export function BrandingHead() {
  const branding = useBranding();
  const pathname = usePathname();

  useEffect(() => {
    const title = branding?.tabTitle || branding?.siteName;
    if (!title) return;

    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const raf = requestAnimationFrame(apply);
    const t1 = window.setTimeout(apply, 0);
    const t2 = window.setTimeout(apply, 80);

    const titleEl = document.querySelector('title');
    const observer = titleEl
      ? new MutationObserver(apply)
      : null;
    if (titleEl && observer) {
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer?.disconnect();
    };
  }, [branding?.tabTitle, branding?.siteName, pathname]);

  useEffect(() => {
    const iconHref = branding?.faviconUrl;
    if (!iconHref) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconHref;
  }, [branding?.faviconUrl]);

  return null;
}
