'use client';

import { AuthProvider } from '@/context/AuthProvider';
import { LocaleProvider } from '@/context/LocaleProvider';
import { BrandingHead } from '@/components/BrandingHead';
import { AddressBarMask } from '@/components/AddressBarMask';
import { ChunkLoadRecovery } from '@/components/ChunkLoadRecovery';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <BrandingHead />
      <AddressBarMask />
      <ChunkLoadRecovery />
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
