'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, DashboardResponse } from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardSimulatorPreview } from '@/components/DashboardSimulatorPreview';
import { ContentCard } from '@/components/layout/ContentCard';
import { useBranding } from '@/hooks/useBranding';
import { resolveOrgDisplayName } from '@/lib/session-display';
import { isKycApproved } from '@/lib/kyc';

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useT();
  const branding = useBranding();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error);
  }, []);

  const stats = data?.stats ?? {};

  const orgLine =
    resolveOrgDisplayName(
      user?.organization ?? user?.customerProfile?.recruitingOrg ?? null,
      t,
      user?.role,
    ) ||
    branding?.siteName ||
    '';

  return (
    <div className="pg-stack">
      {orgLine && <p className="pg-hint">{orgLine}</p>}

      <ContentCard>
        <UsdtRatePanel compact />
      </ContentCard>

      {user && user.role !== 'SUPER_ADMIN' && user.organization?.type !== 'HEAD_OFFICE' && (
        <DashboardSimulatorPreview />
      )}

      <ContentCard title={t('dashboard.chart.sectionTitle')}>
        <DashboardCharts />
      </ContentCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <StatCard label={t('dashboard.usdtPending')} value={stats.usdtPendingReview ?? 0} />
            <StatCard label={t('dashboard.escrowPending')} value={stats.escrowPending ?? 0} />
            <StatCard label={t('dashboard.usdtCompleted')} value={stats.usdtCompleted ?? 0} />
            <StatCard label={t('dashboard.escrowCompleted')} value={stats.escrowCompleted ?? 0} />
          </>
        )}
        {user?.role === 'ORG_STAFF' && (
          <>
            <StatCard label={t('dashboard.usdtTickets')} value={stats.usdtTickets ?? 0} />
            <StatCard label={t('dashboard.escrowTickets')} value={stats.escrowTickets ?? 0} />
            <StatCard
              label={t('dashboard.totalCommission')}
              value={stats.totalCommission ?? 0}
              suffix="USDT"
            />
            <StatCard
              label={t('dashboard.pendingCommission')}
              value={stats.pendingCommission ?? 0}
              suffix="USDT"
            />
            <StatCard label={t('dashboard.commissionCount')} value={stats.commissionCount ?? 0} />
          </>
        )}
        {user?.role === 'CUSTOMER' && (
          <>
            <StatCard label={t('dashboard.usdtPurchase')} value={stats.usdtTickets ?? 0} />
            <StatCard label={t('dashboard.escrow')} value={stats.escrowTickets ?? 0} />
            <StatCard label={t('dashboard.wallets')} value={stats.wallets ?? 0} />
            <StatCard label={t('dashboard.usdtCompleted')} value={stats.usdtCompleted ?? 0} />
          </>
        )}
      </div>

      {user?.role === 'CUSTOMER' && (
        <ContentCard title={t('dashboard.quickActions')}>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {isKycApproved(user) ? (
              <>
                <Link href="/dashboard/usdt/new" className="pg-btn pg-btn-primary w-full sm:w-auto">
                  {t('dashboard.newUsdt')}
                </Link>
                <Link href="/dashboard/escrow/new" className="pg-btn pg-btn-secondary w-full sm:w-auto">
                  {t('dashboard.newEscrow')}
                </Link>
              </>
            ) : (
              <>
                <span className="pg-btn pg-btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto">{t('dashboard.newUsdt')}</span>
                <span className="pg-btn pg-btn-secondary w-full cursor-not-allowed opacity-50 sm:w-auto">{t('dashboard.newEscrow')}</span>
                <Link href="/dashboard/kyc" className="pg-link self-center text-sm">{t('kyc.requiredToTrade')}</Link>
              </>
            )}
          </div>
        </ContentCard>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="pg-stat">
      <p className="pg-stat-label">{label}</p>
      <p className="pg-stat-value">
        {typeof value === 'number' && value % 1 !== 0
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value.toLocaleString()}
        {suffix && <span className="ml-1 text-[11px] font-normal text-gray-500">{suffix}</span>}
      </p>
    </div>
  );
}
