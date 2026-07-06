'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { api, EscrowTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

export default function EscrowListPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<EscrowTicket[]>([]);

  useEffect(() => {
    api.escrow.list().then(setTickets).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">무역 에스크로</h1>
        {user?.role === 'CUSTOMER' && (
          <Link href="/dashboard/escrow/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + 생성
          </Link>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">티켓번호</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">제목</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">금액</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">생성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/escrow/${t.id}`} className="font-medium text-blue-600 hover:underline">{t.ticketNo}</Link>
                </td>
                <td className="px-4 py-3">{t.title}</td>
                <td className="px-4 py-3">{formatCurrency(t.amount, t.currency)}</td>
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
