'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { api, DashboardResponse } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error);
  }, []);

  const stats = data?.stats ?? {};

  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="mt-1 text-gray-500">
        {user?.role === 'SUPER_ADMIN' && '총본사 관리자'}
        {user?.role === 'ORG_STAFF' && '영업 조직'}
        {user?.role === 'CUSTOMER' && '고객'}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <StatCard label="USDT 확인 대기" value={stats.usdtPendingReview ?? 0} />
            <StatCard label="에스크로 진행 중" value={stats.escrowPending ?? 0} />
            <StatCard label="USDT 완료" value={stats.usdtCompleted ?? 0} />
            <StatCard label="에스크로 완료" value={stats.escrowCompleted ?? 0} />
          </>
        )}
        {user?.role === 'ORG_STAFF' && (
          <>
            <StatCard label="USDT 거래" value={stats.usdtTickets ?? 0} />
            <StatCard label="에스크로 거래" value={stats.escrowTickets ?? 0} />
            <StatCard label="누적 수수료" value={stats.totalCommission ?? 0} suffix="원" />
            <StatCard label="정산 건수" value={stats.commissionCount ?? 0} />
          </>
        )}
        {user?.role === 'CUSTOMER' && (
          <>
            <StatCard label="USDT 매입" value={stats.usdtTickets ?? 0} />
            <StatCard label="에스크로" value={stats.escrowTickets ?? 0} />
            <StatCard label="등록 지갑" value={stats.wallets ?? 0} />
          </>
        )}
      </div>

      {user?.role === 'CUSTOMER' && (
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard/usdt/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            USDT 매입 신청
          </Link>
          <Link
            href="/dashboard/escrow/new"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            에스크로 생성
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
