'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, DashboardResponse } from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useT();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error);
  }, []);

  const stats = data?.stats ?? {};

  const roleLabel =
    user?.role === 'SUPER_ADMIN'
      ? t('role.superAdmin')
      : user?.role === 'ORG_STAFF'
        ? t('role.orgStaff')
        : t('role.customer');

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
      <p className="mt-1 text-gray-500">{roleLabel}</p>

      <div className="mt-6">
        <UsdtRatePanel />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              suffix={t('dashboard.currency.won')}
            />
            <StatCard label={t('dashboard.commissionCount')} value={stats.commissionCount ?? 0} />
          </>
        )}
        {user?.role === 'CUSTOMER' && (
          <>
            <StatCard label={t('dashboard.usdtPurchase')} value={stats.usdtTickets ?? 0} />
            <StatCard label={t('dashboard.escrow')} value={stats.escrowTickets ?? 0} />
            <StatCard label={t('dashboard.wallets')} value={stats.wallets ?? 0} />
          </>
        )}
      </div>

      {user?.role === 'CUSTOMER' && (
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard/usdt/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('dashboard.newUsdt')}
          </Link>
          <Link
            href="/dashboard/escrow/new"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {t('dashboard.newEscrow')}
          </Link>
        </div>
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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {typeof value === 'number' && value % 1 !== 0
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value.toLocaleString()}
        {suffix && <span className="ml-1 text-lg font-normal text-gray-500">{suffix}</span>}
      </p>
    </div>
  );
}
