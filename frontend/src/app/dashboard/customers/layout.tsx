'use client';

import { CustomersHubNav } from '@/components/layout/CustomersHubNav';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pg-stack">
      <CustomersHubNav />
      {children}
    </div>
  );
}
