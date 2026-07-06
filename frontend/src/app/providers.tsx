'use client';

import { AuthProvider } from '@/context/AuthProvider';
import { LocaleProvider } from '@/context/LocaleProvider';
import { BrandingHead } from '@/components/BrandingHead';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <BrandingHead />
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
