'use client';

import { HqPolicyHubNav } from '@/components/layout/HqPolicyHubNav';

export default function HqPolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pg-stack">
      <HqPolicyHubNav />
      {children}
    </div>
  );
}
