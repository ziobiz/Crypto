'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { maskAddressBar, rememberAppPath } from '@/lib/auth-session';

export function AddressBarMask() {
  const pathname = usePathname();

  useEffect(() => {
    const search = window.location.search.replace(/^\?/, '');
    rememberAppPath(pathname, search);
    maskAddressBar();
  }, [pathname]);

  return null;
}
