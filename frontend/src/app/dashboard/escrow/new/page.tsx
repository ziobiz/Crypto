'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function EscrowNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ sellerEmail: 'seller@example.com', title: '', description: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await api.escrow.create({
        sellerEmail: form.sellerEmail,
        title: form.title,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
      });
      router.push(`/dashboard/escrow/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">무역 에스크로 생성</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">판매자 이메일</label>
          <input value={form.sellerEmail} onChange={(e) => setForm({ ...form, sellerEmail: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium">거래 제목</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium">거래 설명</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium">거래 금액 (KRW)</label>
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" min="1" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-6 py-2 text-sm text-white disabled:opacity-50">
          {loading ? '생성 중...' : '에스크로 생성'}
        </button>
      </form>
    </div>
  );
}
