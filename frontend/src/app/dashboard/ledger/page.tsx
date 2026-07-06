'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { api, LedgerSummary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

export default function LedgerPage() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);

  useEffect(() => {
    api.ledger(user?.organization?.id).then(setLedger).catch(console.error);
  }, [user]);

  if (!ledger) return <p className="text-gray-500">로딩 중...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">수수료 장부</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">누적 수수료</p>
          <p className="mt-2 text-3xl font-bold">{formatCurrency(ledger.totalAmount, ledger.currency)}</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">정산 건수</p>
          <p className="mt-2 text-3xl font-bold">{ledger.count}</p>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">티켓</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">유형</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">수수료</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">요율</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">정산일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ledger.entries.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium">{e.ticketNo}</td>
                <td className="px-4 py-3">{e.ticketType === 'USDT_PURCHASE' ? 'USDT 매입' : '에스크로'}</td>
                <td className="px-4 py-3">{e.amount.toLocaleString()} {ledger.currency}</td>
                <td className="px-4 py-3">{e.ratePercent}%</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(e.settledAt)}</td>
              </tr>
            ))}
            {ledger.entries.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">정산 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
