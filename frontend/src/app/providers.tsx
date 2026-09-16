'use client';

import { AuthProvider } from '@/context/AuthProvider';
import { LocaleProvider } from '@/context/LocaleProvider';
import { BrandingHead } from '@/components/BrandingHead';
import { AddressBarMask } from '@/components/AddressBarMask';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <BrandingHead />
      <AddressBarMask />
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
