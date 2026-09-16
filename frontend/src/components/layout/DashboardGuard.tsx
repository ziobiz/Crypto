'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { AppShell } from '@/components/layout/AppShell';
import { PageFrame } from '@/components/layout/PageFrame';
import { WorkflowDisplayProvider } from '@/context/WorkflowDisplayProvider';

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <WorkflowDisplayProvider>
      <AppShell>
        <PageFrame>{children}</PageFrame>
      </AppShell>
    </WorkflowDisplayProvider>
  );
}
