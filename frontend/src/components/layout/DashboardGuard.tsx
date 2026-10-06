'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { AppShell } from '@/components/layout/AppShell';
import { PageFrame } from '@/components/layout/PageFrame';
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary';
import { WorkflowDisplayProvider } from '@/context/WorkflowDisplayProvider';
import { pendingIcopayReturnPath } from '@/lib/icopay-return';

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const retried = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    // 토큰은 있는데 user만 비어 있으면(일시 /me 실패) 한 번 재시도
    const hasToken =
      typeof window !== 'undefined' && Boolean(sessionStorage.getItem('token'));
    if (hasToken && !retried.current) {
      retried.current = true;
      void refresh();
      return;
    }
    router.replace('/login');
  }, [user, loading, router, refresh]);

  /** ICOPAY 결제 후 대시보드·목록 등 임의 복귀 → 결제 결과 페이지로 강제 이동 */
  useEffect(() => {
    if (loading || !user) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const target = pendingIcopayReturnPath(pathname || '', search);
    if (!target) return;
    router.replace(target);
  }, [loading, user, pathname, router]);

  if (loading || (!user && typeof window !== 'undefined' && sessionStorage.getItem('token'))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <WorkflowDisplayProvider>
      <DashboardErrorBoundary label="shell">
        <AppShell>
          <DashboardErrorBoundary label="page">
            <PageFrame>{children}</PageFrame>
          </DashboardErrorBoundary>
        </AppShell>
      </DashboardErrorBoundary>
    </WorkflowDisplayProvider>
  );
}
