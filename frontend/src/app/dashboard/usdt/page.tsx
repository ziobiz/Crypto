'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { api, UsdtTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

export default function UsdtListPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<UsdtTicket[]>([]);

  useEffect(() => {
    api.usdt.list().then(setTickets).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">USDT 매입</h1>
        {user?.role === 'CUSTOMER' && (
          <Link href="/dashboard/usdt/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + 신청
          </Link>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">티켓번호</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">금액</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">예상 USDT</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">신청일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/usdt/${t.id}`} className="font-medium text-blue-600 hover:underline">
                    {t.ticketNo}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatCurrency(t.fiatAmount, t.fiatCurrency)}</td>
                <td className="px-4 py-3">{t.expectedUsdtAmount.toFixed(4)} USDT</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">거래 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
