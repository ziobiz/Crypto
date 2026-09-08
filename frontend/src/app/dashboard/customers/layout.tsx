'use client';

import { CustomersHubNav } from '@/components/layout/CustomersHubNav';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CustomersHubNav />
      {children}
    </div>
  );
}
